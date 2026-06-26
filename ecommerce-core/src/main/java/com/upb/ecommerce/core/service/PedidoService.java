package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.request.CrearPedidoRequest;
import com.upb.ecommerce.core.dto.request.GenerarQrRequest;
import com.upb.ecommerce.core.dto.response.PedidoResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.core.integracion.StereumCreateChargeRequest;
import com.upb.ecommerce.core.integracion.StereumCreateChargeResponse;
import com.upb.ecommerce.core.integracion.StereumCustomer;
import com.upb.ecommerce.core.integracion.StereumService;
import com.upb.ecommerce.data.repository.*;
import com.upb.ecommerce.domain.entities.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final CarritoRepository carritoRepository;
    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoInventarioRepository movimientoRepository;
    private final DireccionEnvioRepository direccionRepository;
    private final PagoRepository pagoRepository;
    private final StereumService stereumService;
    private final EmailService emailService;

    public PedidoService(PedidoRepository pedidoRepository,
                         CarritoRepository carritoRepository,
                         ProductoRepository productoRepository,
                         TiendaRepository tiendaRepository,
                         UsuarioRepository usuarioRepository,
                         MovimientoInventarioRepository movimientoRepository,
                         DireccionEnvioRepository direccionRepository,
                         PagoRepository pagoRepository,
                         StereumService stereumService,
                         EmailService emailService) {
        this.pedidoRepository = pedidoRepository;
        this.carritoRepository = carritoRepository;
        this.productoRepository = productoRepository;
        this.tiendaRepository = tiendaRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimientoRepository = movimientoRepository;
        this.direccionRepository = direccionRepository;
        this.pagoRepository = pagoRepository;
        this.stereumService = stereumService;
        this.emailService = emailService;
    }

    public List<PedidoResponse> listarPorUsuario(Long tiendaId, Long usuarioId) {
        return pedidoRepository.findByUsuarioIdAndTiendaId(usuarioId, tiendaId)
                .stream().map(PedidoResponse::fromEntity).toList();
    }

    /** Todos los pedidos del usuario (de todas las tiendas) — vista "Mis pedidos" del marketplace. */
    public List<PedidoResponse> listarTodosPorUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioIdOrderByIdDesc(usuarioId)
                .stream().map(PedidoResponse::fromEntity).toList();
    }

    public PedidoResponse obtenerPorId(Long tiendaId, Long pedidoId) {
        return PedidoResponse.fromEntity(
                pedidoRepository.findByIdAndTiendaId(pedidoId, tiendaId)
                        .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado")));
    }

    // (la dispara el job de Quartz)
    private static final String CORREO_CANCELACION = "rllayus@gmail.com";
    private static final String ASUNTO_CANCELACION = "Pregunta 6-A";
    private static final String MENSAJE_CANCELACION = "pedido cancelado";


    @Transactional
    public int cancelarPedidosNoPagados() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(1);
        List<Pedido> vencidos = pedidoRepository.findByEstadoPedidoAndFechaCreacionBefore("PENDIENTE", limite);

        for (Pedido pedido : vencidos) {
            pedido.setEstadoPedido("CANCELADO");
            pedidoRepository.save(pedido);
            try {
                emailService.enviarTextoPlano(CORREO_CANCELACION, ASUNTO_CANCELACION, MENSAJE_CANCELACION);
            } catch (Exception e) {
                log.warn("Pedido {} cancelado, pero no se pudo enviar el correo: {}", pedido.getId(), e.getMessage());
            }
        }
        if (!vencidos.isEmpty()) {
            log.info("Cancelación automática: {} pedido(s) PENDIENTE pasados a CANCELADO", vencidos.size());
        }
        return vencidos.size();
    }

    @Transactional
    public PedidoResponse crearDesdeCarrito(CrearPedidoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));
        Carrito carrito = carritoRepository
                .findByUsuarioIdAndTiendaIdAndEstado(request.getUsuarioId(), request.getTiendaId(), "ACTIVO")
                .orElseThrow(() -> new NotDataFoundException("No hay carrito activo para este usuario"));
        return PedidoResponse.fromEntity(
                convertirCarritoEnPedido(carrito, usuario, resolverDireccion(request.getDireccionId())));
    }

    /**
     * Checkout multi-tienda: convierte TODOS los carritos activos del usuario en un pedido por
     * tienda (el modelo de pedido es por tienda). El cobro de cada pedido va a la cuenta única
     * de la plataforma (Stereum); el reparto a cada tienda es una conciliación posterior.
     */
    @Transactional
    public List<PedidoResponse> crearDesdeCarritos(Long usuarioId, Long direccionId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));
        DireccionEnvio direccion = resolverDireccion(direccionId);
        List<Carrito> carritos = carritoRepository.findByUsuarioIdAndEstado(usuarioId, "ACTIVO").stream()
                .filter(c -> c.getDetalles() != null && !c.getDetalles().isEmpty())
                .toList();
        if (carritos.isEmpty()) {
            throw new OperationException("No hay carritos con productos para procesar");
        }
        List<PedidoResponse> pedidos = new ArrayList<>();
        for (Carrito c : carritos) {
            pedidos.add(PedidoResponse.fromEntity(convertirCarritoEnPedido(c, usuario, direccion)));
        }
        return pedidos;
    }

    private DireccionEnvio resolverDireccion(Long direccionId) {
        if (direccionId == null) return null;
        return direccionRepository.findById(direccionId)
                .orElseThrow(() -> new NotDataFoundException("Dirección no encontrada"));
    }

    /** Convierte un carrito en un pedido (descuenta stock, registra salidas y marca el carrito). */
    private Pedido convertirCarritoEnPedido(Carrito carrito, Usuario usuario, DireccionEnvio direccion) {
        if (carrito.getDetalles() == null || carrito.getDetalles().isEmpty()) {
            throw new OperationException("El carrito está vacío");
        }
        Tienda tienda = carrito.getTienda();

        Pedido pedido = new Pedido();
        pedido.setTienda(tienda);
        pedido.setUsuario(usuario);
        pedido.setCodigoSeguimiento("PED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        pedido.setEstadoPedido("PENDIENTE");
        pedido.setDetalles(new ArrayList<>());
        if (direccion != null) {
            pedido.setDireccionEnvio(direccion);
        }

        // El pedido nace PENDIENTE: NO se descuenta stock ni se registra la venta todavía.
        // La venta (descuento de stock + SALIDA de inventario) se registra al CONFIRMARSE EL PAGO
        // (ver confirmarPago), para que un pedido impago no afecte el inventario.
        BigDecimal total = BigDecimal.ZERO;
        for (DetalleCarrito dc : carrito.getDetalles()) {
            Producto producto = dc.getProducto();
            if (producto.getStock() < dc.getCantidad()) {
                throw new OperationException("Stock insuficiente para: " + producto.getNombre());
            }

            DetallePedido dp = new DetallePedido();
            dp.setPedido(pedido);
            dp.setProducto(producto);
            dp.setCantidad(dc.getCantidad());
            dp.setPrecioUnitario(dc.getPrecioUnitario());
            pedido.getDetalles().add(dp);

            total = total.add(dc.getPrecioUnitario().multiply(BigDecimal.valueOf(dc.getCantidad())));
        }

        pedido.setTotal(total);
        pedidoRepository.save(pedido);

        carrito.setEstado("CONVERTIDO_A_PEDIDO");
        carritoRepository.save(carrito);
        return pedido;
    }

    @Transactional
    public PedidoResponse actualizarEstado(Long tiendaId, Long pedidoId, String nuevoEstado) {
        Pedido pedido = pedidoRepository.findByIdAndTiendaId(pedidoId, tiendaId)
                .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado"));

        List<String> estadosValidos = List.of("PENDIENTE", "PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "CANCELADO");
        if (!estadosValidos.contains(nuevoEstado)) {
            throw new OperationException("Estado no válido: " + nuevoEstado);
        }
        pedido.setEstadoPedido(nuevoEstado);
        return PedidoResponse.fromEntity(pedidoRepository.save(pedido));
    }

    /**
     * Cancela un pedido: repone el stock de cada producto, registra los movimientos
     * de ENTRADA correspondientes y deja el pedido en estado CANCELADO.
     * No se permite cancelar pedidos ya ENVIADO/ENTREGADO/CANCELADO.
     */
    @Transactional
    public PedidoResponse cancelarPedido(Long tiendaId, Long pedidoId) {
        Pedido pedido = pedidoRepository.findByIdAndTiendaId(pedidoId, tiendaId)
                .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado"));

        String estado = pedido.getEstadoPedido();
        if ("CANCELADO".equals(estado)) {
            throw new OperationException("El pedido ya está cancelado");
        }
        if ("ENVIADO".equals(estado) || "ENTREGADO".equals(estado)) {
            throw new OperationException("No se puede cancelar un pedido en estado " + estado);
        }

        // Solo se repone el stock si ya se había descontado (es decir, si el pedido llegó a pagarse).
        // Un pedido PENDIENTE (impago) nunca tocó el inventario, así que no hay nada que reponer.
        if (stockYaDescontado(estado) && pedido.getDetalles() != null) {
            for (DetallePedido dp : pedido.getDetalles()) {
                Producto producto = dp.getProducto();
                producto.setStock(producto.getStock() + dp.getCantidad());
                productoRepository.save(producto);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTienda(pedido.getTienda());
                mov.setProducto(producto);
                mov.setTipo("ENTRADA");
                mov.setCantidad(dp.getCantidad());
                mov.setReferencia("Cancelación pedido " + pedido.getCodigoSeguimiento());
                movimientoRepository.save(mov);
            }
        }

        pedido.setEstadoPedido("CANCELADO");
        return PedidoResponse.fromEntity(pedidoRepository.save(pedido));
    }

    /** Estados en los que el stock del pedido ya fue descontado (post-pago). */
    private boolean stockYaDescontado(String estado) {
        return "PAGADO".equals(estado) || "PREPARANDO".equals(estado)
                || "ENVIADO".equals(estado) || "ENTREGADO".equals(estado);
    }

    /**
     * Confirma el pago de un pedido: descuenta el stock, registra la SALIDA de inventario
     * (la "venta") y deja el pedido en PAGADO. Es <b>idempotente</b>: solo actúa sobre pedidos
     * PENDIENTES, así que reenvíos del callback de Stereum no descuentan el stock dos veces.
     */
    @Transactional
    public void confirmarPago(Pedido pedido) {
        if (!"PENDIENTE".equals(pedido.getEstadoPedido())) {
            log.info("Pedido {} no está PENDIENTE (está {}) — no se vuelve a registrar la venta",
                    pedido.getId(), pedido.getEstadoPedido());
            return;
        }

        Tienda tienda = pedido.getTienda();
        if (pedido.getDetalles() != null) {
            for (DetallePedido dp : pedido.getDetalles()) {
                Producto producto = dp.getProducto();
                int nuevoStock = producto.getStock() - dp.getCantidad();
                if (nuevoStock < 0) {
                    log.warn("Stock insuficiente al confirmar pago del pedido {} para '{}' (stock {}, vendido {}) — se deja en 0",
                            pedido.getId(), producto.getNombre(), producto.getStock(), dp.getCantidad());
                    nuevoStock = 0;
                }
                producto.setStock(nuevoStock);
                productoRepository.save(producto);

                MovimientoInventario mov = new MovimientoInventario();
                mov.setTienda(tienda);
                mov.setProducto(producto);
                mov.setTipo("SALIDA");
                mov.setCantidad(dp.getCantidad());
                mov.setReferencia("Venta pagada pedido " + pedido.getCodigoSeguimiento());
                movimientoRepository.save(mov);
            }
        }

        pedido.setEstadoPedido("PAGADO");
        pedidoRepository.save(pedido);
        log.info("Pedido {} PAGADO: venta registrada y stock descontado", pedido.getId());
    }

    /**
     * Genera un QR de pago (Stereum) para un pedido. El monto se toma del total del
     * pedido. Lanza {@code Exception} si Stereum falla (la maneja el controlador).
     *
     * <p>Tras crear el cargo en Stereum se persiste un {@link Pago} en estado PENDIENTE
     * guardando el id de transacción de Stereum en {@code transaccionPasarelaId}. Ese id
     * es la clave que permite, cuando llegue el webhook de confirmación, encontrar este
     * pago y marcarlo como pagado.
     */
    @Transactional
    public StereumCreateChargeResponse generarQrPago(Long tiendaId, Long pedidoId,
                                                     GenerarQrRequest req) throws Exception {
        Pedido pedido = pedidoRepository.findByIdAndTiendaId(pedidoId, tiendaId)
                .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado"));

        if ("CANCELADO".equals(pedido.getEstadoPedido())) {
            throw new OperationException("No se puede cobrar un pedido cancelado");
        }
        if ("PAGADO".equals(pedido.getEstadoPedido())) {
            throw new OperationException("El pedido ya fue pagado");
        }

        validarDatosQr(req);

        Usuario usuario = pedido.getUsuario();
        StereumCustomer customer = StereumCustomer.builder()
                .name(usuario.getNombre())
                .lastname(".")
                .documentNumber(req.getDocumentNumber() != null ? req.getDocumentNumber() : "0000000")
                .build();

        // account_id no se setea aqui: StereumService lo completa con stereum.account-id.
        StereumCreateChargeRequest charge = StereumCreateChargeRequest.builder()
                .country(upper(req.getCountry()))
                .amount(pedido.getTotal().toPlainString())
                .currency(upper(req.getCurrency()))
                .network(upper(req.getNetwork()))
                .chargeReason("Pago pedido " + pedido.getCodigoSeguimiento())
                .reservationValidityTime(req.getReservationValidityTime())
                .customer(customer)
                .build();

        StereumCreateChargeResponse response = stereumService.crearCargo(charge);

        // Registramos el pago como PENDIENTE con el id de Stereum, para poder
        // reconciliarlo cuando llegue la notificación del webhook.
        Pago pago = new Pago();
        pago.setPedido(pedido);
        pago.setMetodo("QR");
        pago.setTransaccionPasarelaId(response.getId());
        pago.setMonto(pedido.getTotal());
        pago.setEstadoPago("PENDIENTE");
        pagoRepository.save(pago);

        return response;
    }

    /**
     * Valida que la combinacion pais/moneda/red sea soportada por Stereum:
     * solo Bolivia (BO); CSL cobra en BOB y POLYGON en USDT/USDC.
     */
    private void validarDatosQr(GenerarQrRequest req) {
        String country = upper(req.getCountry());
        String currency = upper(req.getCurrency());
        String network = upper(req.getNetwork());

        if (!"BO".equals(country)) {
            throw new OperationException("Solo se soporta el pais BO para esta integracion");
        }
        if (!Set.of("BOB", "USDT", "USDC").contains(currency)) {
            throw new OperationException("Moneda no soportada: " + req.getCurrency());
        }
        if (!Set.of("CSL", "POLYGON").contains(network)) {
            throw new OperationException("Red no soportada: " + req.getNetwork());
        }
        if ("CSL".equals(network) && !"BOB".equals(currency)) {
            throw new OperationException("La red CSL solo soporta cobros en BOB");
        }
        if ("POLYGON".equals(network) && !Set.of("USDT", "USDC").contains(currency)) {
            throw new OperationException("La red POLYGON solo soporta USDT o USDC");
        }
    }

    private String upper(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
