package com.upb.ecommerce.data.seeders;

import com.upb.ecommerce.data.repository.AtributoProductoRepository;
import com.upb.ecommerce.data.repository.CarritoRepository;
import com.upb.ecommerce.data.repository.CategoriaRepository;
import com.upb.ecommerce.data.repository.DetalleCarritoRepository;
import com.upb.ecommerce.data.repository.DetallePedidoRepository;
import com.upb.ecommerce.data.repository.DireccionEnvioRepository;
import com.upb.ecommerce.data.repository.MovimientoInventarioRepository;
import com.upb.ecommerce.data.repository.PagoRepository;
import com.upb.ecommerce.data.repository.PedidoRepository;
import com.upb.ecommerce.data.repository.ProductoRepository;
import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.data.repository.UnidadMedidaRepository;
import com.upb.ecommerce.data.repository.UsuarioRepository;
import com.upb.ecommerce.domain.entities.AtributoProducto;
import com.upb.ecommerce.domain.entities.Carrito;
import com.upb.ecommerce.domain.entities.Categoria;
import com.upb.ecommerce.domain.entities.DetalleCarrito;
import com.upb.ecommerce.domain.entities.DetallePedido;
import com.upb.ecommerce.domain.entities.DireccionEnvio;
import com.upb.ecommerce.domain.entities.MovimientoInventario;
import com.upb.ecommerce.domain.entities.Pago;
import com.upb.ecommerce.domain.entities.Pedido;
import com.upb.ecommerce.domain.entities.Producto;
import com.upb.ecommerce.domain.entities.Tienda;
import com.upb.ecommerce.domain.entities.UnidadMedida;
import com.upb.ecommerce.domain.entities.Usuario;
import com.upb.ecommerce.domain.enums.RolType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Seeder de datos de DEMOSTRACIÓN para probar el proyecto end-to-end.
 *
 * <p>Llena todas las tablas con datos realistas y complementarios de una tienda de barrio
 * boliviana (catálogo, clientes, direcciones, carritos, pedidos en varios estados, pagos
 * y movimientos de inventario), de modo que el dashboard, los reportes, el panel admin y la
 * vista del cliente tengan contenido al arrancar.
 *
 * <p>Corre DESPUÉS de {@link DataSeeder} (vía {@code @Order(2)}), que crea la tienda
 * {@code comercio1} y el admin. Es <b>idempotente</b>: si el cliente demo ya existe, no
 * vuelve a sembrar nada.
 *
 * <p>Credenciales de los clientes sembrados: contraseña {@code cliente123}.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private static final String TIENDA_SLUG = "comercio1";
    private static final String ADMIN_EMAIL = "admin@comercio1.com";
    private static final String CLIENTE_DEMO_EMAIL = "cliente@demo.com";
    private static final String CLIENTE_PASSWORD = "cliente123";
    private static final String ADMIN_PASSWORD = "Admin123**";
    private static final List<String> ESTADOS_COMPLETADOS =
            List.of("PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO");

    private final TiendaRepository tiendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final CategoriaRepository categoriaRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;
    private final ProductoRepository productoRepository;
    private final AtributoProductoRepository atributoProductoRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final DireccionEnvioRepository direccionEnvioRepository;
    private final CarritoRepository carritoRepository;
    private final DetalleCarritoRepository detalleCarritoRepository;
    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final PagoRepository pagoRepository;
    private final PasswordEncoder passwordEncoder;

    /** Línea de un pedido o carrito: slug del producto + cantidad. */
    private record Linea(String slug, int cantidad) {}

    /** Especificación de un pedido a sembrar (se resuelve cliente/dirección por email). */
    private record OrdenSpec(String email, String estado, int diasAtras, int hora,
                             String metodoPago, List<Linea> lineas) {}

    @Override
    @Transactional
    public void run(String... args) {
        Tienda tienda = tiendaRepository.findBySlug(TIENDA_SLUG).orElse(null);
        if (tienda == null) {
            log.warn("DemoDataSeeder: tienda '{}' no encontrada; se omite el sembrado demo", TIENDA_SLUG);
            return;
        }
        Long tiendaId = tienda.getId();

        // Idempotencia: si el cliente demo ya existe, asumimos que la demo ya fue sembrada.
        if (usuarioRepository.findByEmailAndTiendaId(CLIENTE_DEMO_EMAIL, tiendaId).isPresent()) {
            log.info("DemoDataSeeder: datos demo ya presentes; no se vuelven a sembrar.");
            return;
        }

        log.info("DemoDataSeeder: sembrando datos de demostración para la tienda '{}'...", tienda.getNombre());

        Usuario admin = usuarioRepository.findByEmailAndTiendaId(ADMIN_EMAIL, tiendaId).orElse(null);

        // 0) Restablecer la contraseña del admin a un valor conocido para poder probar el panel
        //    (el admin del .backup trae un hash bcrypt cuya contraseña en claro se desconoce).
        if (admin != null) {
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            usuarioRepository.save(admin);
            log.info("DemoDataSeeder: contraseña de '{}' restablecida a '{}' para pruebas.", ADMIN_EMAIL, ADMIN_PASSWORD);
        }

        // 1) Categorías y unidades de medida
        Map<String, Categoria> cats = crearCategorias(tienda);
        Map<String, UnidadMedida> unis = crearUnidades(tienda);

        // 2) Productos
        Map<String, Producto> p = crearProductos(tienda, cats, unis);

        // 3) Atributos de producto
        crearAtributos(p);

        // 4) Clientes y direcciones de envío
        Usuario ana = crearCliente(tienda, "Ana Gutiérrez", CLIENTE_DEMO_EMAIL, "76512345", false);
        Usuario carlos = crearCliente(tienda, "Carlos Mamani", "cliente2@demo.com", "70011223", false);
        Usuario lucia = crearCliente(tienda, "Lucía Flores", "cliente3@demo.com", "71122334", true);

        DireccionEnvio dirAna = crearDireccion(ana,
                "Av. Banzer #1234, entre 4to y 5to anillo", "Santa Cruz de la Sierra", "Casa de portón verde, timbre 2");
        crearDireccion(ana, "Calle Libertad #45", "Santa Cruz de la Sierra", "Edificio Torre Sol, dpto 3B");
        DireccionEnvio dirCarlos = crearDireccion(carlos,
                "Av. 6 de Agosto #890", "La Paz", "Frente a la plaza Avaroa");
        DireccionEnvio dirLucia = crearDireccion(lucia,
                "Calle Sucre #210", "Cochabamba", "Timbre azul, segundo piso");

        Map<String, Usuario> clientes = Map.of(
                ana.getEmail(), ana, carlos.getEmail(), carlos, lucia.getEmail(), lucia);
        Map<String, DireccionEnvio> direcciones = Map.of(
                ana.getEmail(), dirAna, carlos.getEmail(), dirCarlos, lucia.getEmail(), dirLucia);

        // 5) Pedidos a sembrar (repartidos en ~2 semanas para alimentar reportes)
        List<OrdenSpec> ordenes = definirPedidos();

        // 6) Movimientos de ENTRADA (carga inicial = stock actual + lo vendido) para que el
        //    inventario cuadre: ENTRADA - SALIDA = stock mostrado.
        Map<String, Integer> vendido = calcularVendido(ordenes);
        LocalDateTime fechaCarga = LocalDateTime.now().minusDays(20).withHour(8).withMinute(0).withSecond(0).withNano(0);
        for (Producto prod : p.values()) {
            int entrada = prod.getStock() + vendido.getOrDefault(prod.getSlugProducto(), 0);
            // La BD exige cantidad > 0 (constraint movimientos_inventario_cantidad_check).
            // Productos agotados sin ventas (carga 0) no generan movimiento de entrada.
            if (entrada > 0) {
                crearMovimiento(tienda, prod, admin, "ENTRADA", entrada, "Carga inicial de inventario", fechaCarga);
            }
        }

        // 7) Crear pedidos (+ detalles, pagos y movimientos de SALIDA)
        int pedidosCreados = 0;
        for (OrdenSpec o : ordenes) {
            LocalDateTime fecha = LocalDateTime.now()
                    .minusDays(o.diasAtras()).withHour(o.hora()).withMinute(15).withSecond(0).withNano(0);
            crearPedido(tienda, clientes.get(o.email()), direcciones.get(o.email()),
                    o.estado(), fecha, o.metodoPago(), p, o.lineas());
            pedidosCreados++;
        }

        // 8) Carritos: uno ACTIVO para el cliente demo (para ver la vista de carrito) y uno ABANDONADO
        crearCarrito(tienda, ana, "ACTIVO", p, List.of(
                new Linea("coca-cola-2l", 2), new Linea("papas-lays-145", 1), new Linea("leche-pil-entera-1l", 3)));
        crearCarrito(tienda, carlos, "ABANDONADO", p, List.of(
                new Linea("cerveza-pacena-620", 4)));

        log.info("DemoDataSeeder: listo. {} productos, 3 clientes, {} pedidos, carritos y movimientos sembrados.",
                p.size(), pedidosCreados);
        log.info("DemoDataSeeder: login cliente demo -> tienda '{}', {} / {}",
                tienda.getNombre(), CLIENTE_DEMO_EMAIL, CLIENTE_PASSWORD);
    }

    // ─── Catálogo ───────────────────────────────────────────────────────────────

    private Map<String, Categoria> crearCategorias(Tienda tienda) {
        Map<String, Categoria> cats = new LinkedHashMap<>();
        for (String nombre : List.of("Bebidas", "Abarrotes", "Lácteos", "Limpieza", "Snacks", "Cuidado Personal")) {
            Categoria c = new Categoria();
            c.setTienda(tienda);
            c.setNombre(nombre);
            c.setEstado(true);
            cats.put(nombre, categoriaRepository.save(c));
        }
        return cats;
    }

    private Map<String, UnidadMedida> crearUnidades(Tienda tienda) {
        Map<String, UnidadMedida> unis = new LinkedHashMap<>();
        unis.put("Unidad", crearUnidad(tienda, "Unidad", "un"));
        unis.put("Kilogramo", crearUnidad(tienda, "Kilogramo", "kg"));
        unis.put("Litro", crearUnidad(tienda, "Litro", "L"));
        unis.put("Paquete", crearUnidad(tienda, "Paquete", "paq"));
        unis.put("Caja", crearUnidad(tienda, "Caja", "caja"));
        unis.put("Docena", crearUnidad(tienda, "Docena", "doc"));
        return unis;
    }

    private UnidadMedida crearUnidad(Tienda tienda, String nombre, String abreviatura) {
        UnidadMedida u = new UnidadMedida();
        u.setTienda(tienda);
        u.setNombre(nombre);
        u.setAbreviatura(abreviatura);
        u.setEstado(true);
        return unidadMedidaRepository.save(u);
    }

    private Map<String, Producto> crearProductos(Tienda t, Map<String, Categoria> c, Map<String, UnidadMedida> u) {
        Map<String, Producto> p = new LinkedHashMap<>();
        // Bebidas
        add(p, prod(t, c.get("Bebidas"), u.get("Unidad"), "Coca-Cola 2L", "coca-cola-2l",
                "Gaseosa cola de 2 litros, ideal para compartir.", 13.00, 9.50, 120, 20));
        add(p, prod(t, c.get("Bebidas"), u.get("Unidad"), "Agua Vital 2L", "agua-vital-2l",
                "Agua mineral sin gas, botella de 2 litros.", 7.00, 4.50, 90, 15));
        add(p, prod(t, c.get("Bebidas"), u.get("Unidad"), "Jugo Del Valle Durazno 1L", "jugo-del-valle-durazno-1l",
                "Néctar de durazno, envase de 1 litro.", 10.00, 7.00, 60, 12));
        add(p, prod(t, c.get("Bebidas"), u.get("Unidad"), "Cerveza Paceña 620ml", "cerveza-pacena-620",
                "Cerveza lager nacional, botella de 620 ml.", 12.00, 8.50, 80, 24));
        // Abarrotes
        add(p, prod(t, c.get("Abarrotes"), u.get("Kilogramo"), "Arroz Grano de Oro 1kg", "arroz-grano-de-oro-1kg",
                "Arroz grano largo selecto, bolsa de 1 kg.", 9.50, 7.00, 150, 30));
        add(p, prod(t, c.get("Abarrotes"), u.get("Unidad"), "Aceite Fino 900ml", "aceite-fino-900",
                "Aceite vegetal comestible, botella de 900 ml.", 15.00, 11.50, 70, 15));
        add(p, prod(t, c.get("Abarrotes"), u.get("Paquete"), "Fideo Princesa 400g", "fideo-princesa-400",
                "Fideo tipo lazo, paquete de 400 g.", 6.50, 4.20, 100, 20));
        add(p, prod(t, c.get("Abarrotes"), u.get("Kilogramo"), "Azúcar Guabirá 1kg", "azucar-guabira-1kg",
                "Azúcar blanca refinada, bolsa de 1 kg.", 7.00, 5.20, 110, 25));
        // Lácteos
        add(p, prod(t, c.get("Lácteos"), u.get("Litro"), "Leche PIL Entera 1L", "leche-pil-entera-1l",
                "Leche entera larga vida, caja de 1 litro.", 7.50, 5.50, 95, 20));
        add(p, prod(t, c.get("Lácteos"), u.get("Litro"), "Yogurt PIL Frutilla 1L", "yogurt-pil-frutilla-1l",
                "Yogurt bebible sabor frutilla, 1 litro.", 14.00, 10.00, 40, 10));
        add(p, prod(t, c.get("Lácteos"), u.get("Kilogramo"), "Queso Menonita 500g", "queso-menonita-500",
                "Queso menonita fresco, trozo de 500 g.", 28.00, 22.00, 25, 8));
        // Limpieza
        add(p, prod(t, c.get("Limpieza"), u.get("Paquete"), "Detergente Ola 800g", "detergente-ola-800",
                "Detergente en polvo multiuso, bolsa de 800 g.", 18.00, 13.50, 50, 12));
        add(p, prod(t, c.get("Limpieza"), u.get("Litro"), "Lavandina Patito 1L", "lavandina-patito-1l",
                "Lavandina concentrada, botella de 1 litro.", 8.00, 5.00, 60, 15));
        add(p, prod(t, c.get("Limpieza"), u.get("Paquete"), "Papel Higiénico Elite x4", "papel-higienico-elite-x4",
                "Papel higiénico doble hoja, paquete de 4 rollos.", 11.00, 7.50, 75, 18));
        // Snacks
        add(p, prod(t, c.get("Snacks"), u.get("Unidad"), "Galletas Oreo 117g", "galletas-oreo-117",
                "Galletas rellenas de crema, paquete de 117 g.", 6.00, 4.00, 130, 25));
        add(p, prod(t, c.get("Snacks"), u.get("Unidad"), "Papas Lays 145g", "papas-lays-145",
                "Papas fritas clásicas, bolsa de 145 g.", 12.00, 8.50, 85, 20));
        add(p, prod(t, c.get("Snacks"), u.get("Unidad"), "Chocolate Breick", "chocolate-breick",
                "Barra de chocolate con leche.", 5.00, 3.20, 0, 15)); // AGOTADO (alerta dashboard)
        // Cuidado Personal
        add(p, prod(t, c.get("Cuidado Personal"), u.get("Unidad"), "Shampoo Sedal 340ml", "shampoo-sedal-340",
                "Shampoo anticaspa, frasco de 340 ml.", 22.00, 16.00, 8, 10)); // STOCK BAJO
        add(p, prod(t, c.get("Cuidado Personal"), u.get("Paquete"), "Jabón Uflex x3", "jabon-uflex-x3",
                "Jabón de tocador, paquete de 3 unidades.", 9.00, 6.00, 4, 12)); // STOCK CRÍTICO
        add(p, prod(t, c.get("Cuidado Personal"), u.get("Unidad"), "Pasta Dental Colgate 90g", "pasta-colgate-90",
                "Crema dental con flúor, tubo de 90 g.", 13.00, 9.00, 55, 12));
        return p;
    }

    private void crearAtributos(Map<String, Producto> p) {
        crearAtributo(p.get("coca-cola-2l"), "Marca", "Coca-Cola");
        crearAtributo(p.get("coca-cola-2l"), "Contenido", "2 L");
        crearAtributo(p.get("cerveza-pacena-620"), "Marca", "Paceña");
        crearAtributo(p.get("cerveza-pacena-620"), "Contenido", "620 ml");
        crearAtributo(p.get("cerveza-pacena-620"), "Tipo", "Lager");
        crearAtributo(p.get("arroz-grano-de-oro-1kg"), "Marca", "Grano de Oro");
        crearAtributo(p.get("arroz-grano-de-oro-1kg"), "Contenido", "1 kg");
        crearAtributo(p.get("papas-lays-145"), "Sabor", "Clásico");
        crearAtributo(p.get("papas-lays-145"), "Contenido", "145 g");
        crearAtributo(p.get("shampoo-sedal-340"), "Tipo", "Anticaspa");
        crearAtributo(p.get("shampoo-sedal-340"), "Contenido", "340 ml");
    }

    // ─── Pedidos demo ─────────────────────────────────────────────────────────────

    private List<OrdenSpec> definirPedidos() {
        return List.of(
                // Hoy
                new OrdenSpec(CLIENTE_DEMO_EMAIL, "ENTREGADO", 0, 10, "EFECTIVO", List.of(
                        new Linea("coca-cola-2l", 2), new Linea("galletas-oreo-117", 3), new Linea("papas-lays-145", 1))),
                new OrdenSpec("cliente2@demo.com", "PAGADO", 0, 13, "QR", List.of(
                        new Linea("arroz-grano-de-oro-1kg", 2), new Linea("aceite-fino-900", 1), new Linea("leche-pil-entera-1l", 3))),
                new OrdenSpec("cliente3@demo.com", "ENVIADO", 0, 16, "TARJETA", List.of(
                        new Linea("detergente-ola-800", 1), new Linea("papel-higienico-elite-x4", 2))),
                new OrdenSpec(CLIENTE_DEMO_EMAIL, "PENDIENTE", 0, 18, null, List.of(
                        new Linea("jugo-del-valle-durazno-1l", 2))),
                // Semana actual
                new OrdenSpec("cliente2@demo.com", "CANCELADO", 1, 11, null, List.of(
                        new Linea("cerveza-pacena-620", 12))),
                new OrdenSpec(CLIENTE_DEMO_EMAIL, "ENTREGADO", 2, 11, "QR", List.of(
                        new Linea("cerveza-pacena-620", 6), new Linea("papas-lays-145", 2))),
                new OrdenSpec("cliente2@demo.com", "ENTREGADO", 3, 9, "EFECTIVO", List.of(
                        new Linea("yogurt-pil-frutilla-1l", 1), new Linea("queso-menonita-500", 1), new Linea("leche-pil-entera-1l", 2))),
                new OrdenSpec("cliente3@demo.com", "PREPARANDO", 5, 15, "QR", List.of(
                        new Linea("azucar-guabira-1kg", 2), new Linea("fideo-princesa-400", 3))),
                new OrdenSpec(CLIENTE_DEMO_EMAIL, "PAGADO", 6, 12, "TARJETA", List.of(
                        new Linea("pasta-colgate-90", 2), new Linea("galletas-oreo-117", 4))),
                // Semana anterior
                new OrdenSpec("cliente2@demo.com", "ENTREGADO", 9, 18, "EFECTIVO", List.of(
                        new Linea("coca-cola-2l", 3), new Linea("agua-vital-2l", 4))),
                new OrdenSpec(CLIENTE_DEMO_EMAIL, "ENTREGADO", 11, 10, "QR", List.of(
                        new Linea("arroz-grano-de-oro-1kg", 5), new Linea("aceite-fino-900", 2), new Linea("azucar-guabira-1kg", 3))),
                new OrdenSpec("cliente3@demo.com", "ENTREGADO", 13, 14, "TARJETA", List.of(
                        new Linea("detergente-ola-800", 2), new Linea("lavandina-patito-1l", 3), new Linea("papel-higienico-elite-x4", 2)))
        );
    }

    private Map<String, Integer> calcularVendido(List<OrdenSpec> ordenes) {
        Map<String, Integer> vendido = new HashMap<>();
        for (OrdenSpec o : ordenes) {
            if (!ESTADOS_COMPLETADOS.contains(o.estado())) {
                continue;
            }
            for (Linea l : o.lineas()) {
                vendido.merge(l.slug(), l.cantidad(), Integer::sum);
            }
        }
        return vendido;
    }

    private void crearPedido(Tienda tienda, Usuario usuario, DireccionEnvio direccion, String estado,
                             LocalDateTime fecha, String metodoPago, Map<String, Producto> prods, List<Linea> lineas) {
        BigDecimal total = BigDecimal.ZERO;
        for (Linea l : lineas) {
            Producto prod = prods.get(l.slug());
            total = total.add(prod.getPrecio().multiply(BigDecimal.valueOf(l.cantidad())));
        }

        Pedido pedido = new Pedido();
        pedido.setTienda(tienda);
        pedido.setUsuario(usuario);
        pedido.setDireccionEnvio(direccion);
        pedido.setCodigoSeguimiento("PED-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT));
        pedido.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        pedido.setEstadoPedido(estado);
        pedido.setFechaCreacion(fecha);
        pedido = pedidoRepository.save(pedido);

        List<DetallePedido> detalles = new ArrayList<>();
        for (Linea l : lineas) {
            Producto prod = prods.get(l.slug());
            DetallePedido d = new DetallePedido();
            d.setPedido(pedido);
            d.setProducto(prod);
            d.setCantidad(l.cantidad());
            d.setPrecioUnitario(prod.getPrecio());
            detalles.add(d);
        }
        detallePedidoRepository.saveAll(detalles);

        boolean completado = ESTADOS_COMPLETADOS.contains(estado);
        if (completado && metodoPago != null) {
            Pago pago = new Pago();
            pago.setPedido(pedido);
            pago.setMetodo(metodoPago);
            pago.setMonto(pedido.getTotal());
            pago.setEstadoPago("EXITOSO");
            if ("QR".equals(metodoPago)) {
                pago.setTransaccionPasarelaId("stereum-" + UUID.randomUUID().toString().substring(0, 12));
            }
            pagoRepository.save(pago);
        }
        if (completado) {
            for (Linea l : lineas) {
                crearMovimiento(tienda, prods.get(l.slug()), null, "SALIDA", l.cantidad(),
                        "Venta pedido #" + pedido.getCodigoSeguimiento(), fecha);
            }
        }
    }

    // ─── Carritos ─────────────────────────────────────────────────────────────────

    private void crearCarrito(Tienda tienda, Usuario usuario, String estado,
                              Map<String, Producto> prods, List<Linea> lineas) {
        Carrito carrito = new Carrito();
        carrito.setTienda(tienda);
        carrito.setUsuario(usuario);
        carrito.setEstado(estado);
        carrito.setTotalEstimado(BigDecimal.ZERO);
        carrito = carritoRepository.save(carrito);

        BigDecimal total = BigDecimal.ZERO;
        List<DetalleCarrito> detalles = new ArrayList<>();
        for (Linea l : lineas) {
            Producto prod = prods.get(l.slug());
            DetalleCarrito d = new DetalleCarrito();
            d.setCarrito(carrito);
            d.setProducto(prod);
            d.setCantidad(l.cantidad());
            d.setPrecioUnitario(prod.getPrecio());
            detalles.add(d);
            total = total.add(prod.getPrecio().multiply(BigDecimal.valueOf(l.cantidad())));
        }
        detalleCarritoRepository.saveAll(detalles);

        carrito.setTotalEstimado(total.setScale(2, RoundingMode.HALF_UP));
        carritoRepository.save(carrito);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    private void crearMovimiento(Tienda tienda, Producto producto, Usuario usuario, String tipo,
                                 int cantidad, String referencia, LocalDateTime fecha) {
        MovimientoInventario m = new MovimientoInventario();
        m.setTienda(tienda);
        m.setProducto(producto);
        m.setUsuario(usuario);
        m.setTipo(tipo);
        m.setCantidad(cantidad);
        m.setReferencia(referencia);
        m.setFecha(fecha);
        movimientoInventarioRepository.save(m);
    }

    private Usuario crearCliente(Tienda tienda, String nombre, String email, String whatsapp, boolean visibleCatalogo) {
        Usuario u = new Usuario();
        u.setTienda(tienda);
        u.setNombre(nombre);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(CLIENTE_PASSWORD));
        u.setRol(RolType.CLIENTE);
        u.setNumeroWhatsapp(whatsapp);
        u.setVisibleCatalogo(visibleCatalogo);
        u.setEstado(true);
        return usuarioRepository.save(u);
    }

    private DireccionEnvio crearDireccion(Usuario usuario, String calle, String ciudad, String referencias) {
        DireccionEnvio d = new DireccionEnvio();
        d.setUsuario(usuario);
        d.setDireccionCalle(calle);
        d.setCiudad(ciudad);
        d.setReferencias(referencias);
        d.setEstado(true);
        return direccionEnvioRepository.save(d);
    }

    private void crearAtributo(Producto producto, String nombre, String valor) {
        AtributoProducto a = new AtributoProducto();
        a.setProducto(producto);
        a.setNombre(nombre);
        a.setValor(valor);
        atributoProductoRepository.save(a);
    }

    private void add(Map<String, Producto> mapa, Producto producto) {
        mapa.put(producto.getSlugProducto(), producto);
    }

    private Producto prod(Tienda t, Categoria categoria, UnidadMedida unidad, String nombre, String slug,
                          String descripcion, double precio, double costo, int stock, int stockMinimo) {
        Producto p = new Producto();
        p.setTienda(t);
        p.setCategoria(categoria);
        p.setUnidadMedida(unidad);
        p.setNombre(nombre);
        p.setSlugProducto(slug);
        p.setDescripcionLarga(descripcion);
        p.setPrecio(bd(precio));
        p.setPrecioCosto(bd(costo));
        p.setStock(stock);
        p.setStockMinimo(stockMinimo);
        p.setImagenUrl("https://placehold.co/600x600/0e7490/ffffff?text="
                + URLEncoder.encode(nombre, StandardCharsets.UTF_8));
        p.setEstado(true);
        return productoRepository.save(p);
    }

    private BigDecimal bd(double valor) {
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }
}
