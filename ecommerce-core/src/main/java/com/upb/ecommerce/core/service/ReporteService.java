package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.response.*;
import com.upb.ecommerce.data.repository.MovimientoInventarioRepository;
import com.upb.ecommerce.data.repository.PagoRepository;
import com.upb.ecommerce.data.repository.PedidoRepository;
import com.upb.ecommerce.data.repository.ProductoRepository;
import com.upb.ecommerce.domain.entities.DetallePedido;
import com.upb.ecommerce.domain.entities.Pago;
import com.upb.ecommerce.domain.entities.Pedido;
import com.upb.ecommerce.domain.entities.Producto;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

/**
 * Reportes analíticos del ADMIN (7 pestañas). Todas las agregaciones se calculan en memoria
 * a partir de pedidos completados traídos con fetch-join, evitando JPQL dependiente del
 * dialecto y problemas de lazy-loading.
 *
 * <p>Una "venta completada" es un pedido en estado PAGADO/PREPARANDO/ENVIADO/ENTREGADO
 * (ver {@link DashboardService#ESTADOS_COMPLETADOS}); las "anuladas" son los CANCELADO.
 */
@Service
public class ReporteService {

    private static final List<String> ESTADOS = DashboardService.ESTADOS_COMPLETADOS;
    private static final List<String> ANULADAS = List.of("CANCELADO");
    private static final String[] DIAS_SEMANA = {"Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"};

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final PagoRepository pagoRepository;
    private final MovimientoInventarioRepository movimientoRepository;

    public ReporteService(PedidoRepository pedidoRepository,
                          ProductoRepository productoRepository,
                          PagoRepository pagoRepository,
                          MovimientoInventarioRepository movimientoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.pagoRepository = pagoRepository;
        this.movimientoRepository = movimientoRepository;
    }

    // ── Pestaña 1: Dashboard analítico ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteAnaliticoResponse analitico(Long tiendaId, LocalDate desde, LocalDate hasta) {
        LocalDateTime ini = inicio(desde);
        LocalDateTime fin = fin(hasta);
        List<Pedido> ventas = pedidoRepository.findCompletadasConDetalle(tiendaId, ESTADOS, ini, fin);

        ReporteAnaliticoResponse dto = new ReporteAnaliticoResponse();
        dto.setVentasPorDia(agruparPorDia(ventas));
        dto.setVentasPorCategoria(agruparPorCategoria(ventas));
        dto.setVentasPorHora(agruparPorHora(ventas));
        dto.setVentasPorDiaSemana(agruparPorDiaSemana(ventas));

        // Comparativa semana actual vs. anterior (lunes a hoy).
        LocalDateTime inicioActual = LocalDate.now().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioAnterior = inicioActual.minusWeeks(1);
        LocalDateTime finAnterior = inicioActual.minusSeconds(1);

        BigDecimal actual = pedidoRepository.sumIngresos(tiendaId, ESTADOS, inicioActual, ahora);
        BigDecimal anterior = pedidoRepository.sumIngresos(tiendaId, ESTADOS, inicioAnterior, finAnterior);
        dto.setIngresosSemanaActual(nz(actual));
        dto.setIngresosSemanaAnterior(nz(anterior));
        dto.setVariacionPorcentaje(variacion(nz(actual), nz(anterior)));
        return dto;
    }

    private List<SerieItemResponse> agruparPorDia(List<Pedido> ventas) {
        Map<LocalDate, long[]> conteo = new LinkedHashMap<>();   // [cantidad]
        Map<LocalDate, BigDecimal> ingresos = new LinkedHashMap<>();
        ventas.stream()
                .filter(p -> p.getFechaCreacion() != null)
                .sorted(Comparator.comparing(Pedido::getFechaCreacion))
                .forEach(p -> {
                    LocalDate dia = p.getFechaCreacion().toLocalDate();
                    conteo.computeIfAbsent(dia, k -> new long[1])[0]++;
                    ingresos.merge(dia, nz(p.getTotal()), BigDecimal::add);
                });
        List<SerieItemResponse> serie = new ArrayList<>();
        conteo.forEach((dia, c) -> serie.add(
                new SerieItemResponse(dia.toString(), c[0], ingresos.get(dia))));
        return serie;
    }

    private List<SerieItemResponse> agruparPorHora(List<Pedido> ventas) {
        long[] cantidad = new long[24];
        BigDecimal[] ingresos = new BigDecimal[24];
        for (int i = 0; i < 24; i++) ingresos[i] = BigDecimal.ZERO;
        for (Pedido p : ventas) {
            if (p.getFechaCreacion() == null) continue;
            int h = p.getFechaCreacion().getHour();
            cantidad[h]++;
            ingresos[h] = ingresos[h].add(nz(p.getTotal()));
        }
        List<SerieItemResponse> serie = new ArrayList<>(24);
        for (int h = 0; h < 24; h++) {
            serie.add(new SerieItemResponse(String.format("%02d", h), cantidad[h], ingresos[h]));
        }
        return serie;
    }

    /** Heatmap por día de la semana: 7 buckets fijos Dom..Sáb. */
    private List<SerieItemResponse> agruparPorDiaSemana(List<Pedido> ventas) {
        long[] cantidad = new long[7];
        BigDecimal[] ingresos = new BigDecimal[7];
        for (int i = 0; i < 7; i++) ingresos[i] = BigDecimal.ZERO;
        for (Pedido p : ventas) {
            if (p.getFechaCreacion() == null) continue;
            int idx = p.getFechaCreacion().getDayOfWeek().getValue() % 7; // SUN(7)→0 .. SAT(6)→6
            cantidad[idx]++;
            ingresos[idx] = ingresos[idx].add(nz(p.getTotal()));
        }
        List<SerieItemResponse> serie = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            serie.add(new SerieItemResponse(DIAS_SEMANA[i], cantidad[i], ingresos[i]));
        }
        return serie;
    }

    private List<SerieItemResponse> agruparPorCategoria(List<Pedido> ventas) {
        Map<String, long[]> cantidad = new LinkedHashMap<>();
        Map<String, BigDecimal> ingresos = new LinkedHashMap<>();
        for (Pedido p : ventas) {
            for (DetallePedido d : detalles(p)) {
                Producto pr = d.getProducto();
                String cat = (pr != null && pr.getCategoria() != null)
                        ? pr.getCategoria().getNombre() : "Sin categoría";
                cantidad.computeIfAbsent(cat, k -> new long[1])[0] += d.getCantidad();
                ingresos.merge(cat, subtotal(d), BigDecimal::add);
            }
        }
        List<SerieItemResponse> serie = new ArrayList<>();
        cantidad.forEach((cat, c) -> serie.add(
                new SerieItemResponse(cat, c[0], ingresos.get(cat))));
        serie.sort(Comparator.comparing(SerieItemResponse::getIngresos).reversed());
        return serie;
    }

    // ── Pestaña 2: Rendimiento de ventas ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteVentasResponse ventas(Long tiendaId, LocalDate desde, LocalDate hasta) {
        LocalDateTime ini = inicio(desde);
        LocalDateTime fin = fin(hasta);
        List<Pedido> ventas = pedidoRepository.findCompletadasConDetalle(tiendaId, ESTADOS, ini, fin);

        BigDecimal ingresosBrutos = BigDecimal.ZERO;
        BigDecimal costoVentas = BigDecimal.ZERO;
        long unidades = 0;
        for (Pedido p : ventas) {
            ingresosBrutos = ingresosBrutos.add(nz(p.getTotal()));
            for (DetallePedido d : detalles(p)) {
                unidades += d.getCantidad();
                BigDecimal costoUnit = d.getProducto() != null ? nz(d.getProducto().getPrecioCosto()) : BigDecimal.ZERO;
                costoVentas = costoVentas.add(costoUnit.multiply(BigDecimal.valueOf(d.getCantidad())));
            }
        }
        BigDecimal utilidad = ingresosBrutos.subtract(costoVentas);
        long total = ventas.size();

        ReporteVentasResponse dto = new ReporteVentasResponse();
        dto.setTotalVentas(total);
        dto.setIngresosBrutos(ingresosBrutos);
        dto.setCostoVentas(costoVentas);
        dto.setUtilidadBruta(utilidad);
        dto.setTicketPromedio(total == 0 ? BigDecimal.ZERO
                : ingresosBrutos.divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));
        dto.setMargenPorcentaje(porcentaje(utilidad, ingresosBrutos));

        // KPIs secundarios.
        dto.setUnidadesVendidas(unidades);
        dto.setUnidadesPorVenta(total == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(unidades).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP));

        List<Pedido> anuladas = pedidoRepository.findVentasEntre(tiendaId, ANULADAS, ini, fin);
        BigDecimal montoAnulado = BigDecimal.ZERO;
        for (Pedido p : anuladas) montoAnulado = montoAnulado.add(nz(p.getTotal()));
        dto.setVentasAnuladasCantidad(anuladas.size());
        dto.setMontoAnulado(montoAnulado);

        // Comparativa mensual (independiente del rango seleccionado).
        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime inicioMesAnt = inicioMes.minusMonths(1);
        LocalDateTime finMesAnt = inicioMes.minusSeconds(1);
        BigDecimal mesActual = nz(pedidoRepository.sumIngresos(tiendaId, ESTADOS, inicioMes, ahora));
        BigDecimal mesAnterior = nz(pedidoRepository.sumIngresos(tiendaId, ESTADOS, inicioMesAnt, finMesAnt));
        dto.setIngresosMesActual(mesActual);
        dto.setIngresosMesAnterior(mesAnterior);
        dto.setVariacionMensual(variacion(mesActual, mesAnterior));

        // Desglose por método de pago (pagos exitosos del rango).
        Map<String, long[]> cantidad = new LinkedHashMap<>();
        Map<String, BigDecimal> montos = new LinkedHashMap<>();
        for (Pago pago : pagoRepository.findExitososEntre(tiendaId, ini, fin)) {
            String metodo = pago.getMetodo() != null ? pago.getMetodo() : "DESCONOCIDO";
            cantidad.computeIfAbsent(metodo, k -> new long[1])[0]++;
            montos.merge(metodo, nz(pago.getMonto()), BigDecimal::add);
        }
        List<SerieItemResponse> porMetodo = new ArrayList<>();
        cantidad.forEach((m, c) -> porMetodo.add(new SerieItemResponse(m, c[0], montos.get(m))));
        dto.setPorMetodoPago(porMetodo);
        return dto;
    }

    // ── Pestaña 3: Inteligencia de productos ─────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteProductosResponse productos(Long tiendaId, LocalDate desde, LocalDate hasta,
                                              int diasSinMovimiento) {
        LocalDateTime ini = inicio(desde);
        LocalDateTime fin = fin(hasta);

        ReporteProductosResponse dto = new ReporteProductosResponse();

        // Ranking histórico de más vendidos (todo el tiempo), top 10.
        List<ProductoRankingResponse> masVendidos = new ArrayList<>();
        for (Object[] fila : pedidoRepository.topProductosHistorico(tiendaId, ESTADOS, PageRequest.of(0, 10))) {
            masVendidos.add(new ProductoRankingResponse(
                    (Long) fila[0], (String) fila[1], ((Number) fila[2]).longValue(), nz((BigDecimal) fila[3])));
        }
        dto.setMasVendidos(masVendidos);

        // Valorización del inventario y total de SKUs (punto en el tiempo).
        List<Producto> activos = productoRepository.findByTiendaIdAndEstadoTrue(tiendaId);
        BigDecimal valCosto = BigDecimal.ZERO;
        BigDecimal valVenta = BigDecimal.ZERO;
        for (Producto p : activos) {
            BigDecimal stock = BigDecimal.valueOf(p.getStock());
            valCosto = valCosto.add(nz(p.getPrecioCosto()).multiply(stock));
            valVenta = valVenta.add(nz(p.getPrecio()).multiply(stock));
        }
        dto.setValorizacionCosto(valCosto);
        dto.setValorizacionVenta(valVenta);
        dto.setTotalSkus(activos.size());
        dto.setStockCritico(productoRepository.findStockCritico(tiendaId)
                .stream().map(ProductoResponse::fromEntity).toList());

        // Productos "muertos": sin SALIDA en los últimos N días (o nunca).
        Map<Long, LocalDateTime> ultimaSalida = new LinkedHashMap<>();
        for (Object[] fila : movimientoRepository.ultimaSalidaPorProducto(tiendaId)) {
            ultimaSalida.put((Long) fila[0], (LocalDateTime) fila[1]);
        }
        LocalDateTime limite = LocalDateTime.now().minusDays(diasSinMovimiento);
        List<ProductoResponse> muertos = new ArrayList<>();
        for (Producto p : activos) {
            LocalDateTime ult = ultimaSalida.get(p.getId());
            if (ult == null || ult.isBefore(limite)) {
                muertos.add(ProductoResponse.fromEntity(p));
            }
        }
        dto.setProductosMuertos(muertos);

        // Rotación y cobertura: unidades vendidas en los últimos 30 días vs. stock actual.
        Map<Long, Long> vendidos30 = new HashMap<>();
        LocalDateTime hace30 = LocalDateTime.now().minusDays(30);
        for (Pedido p : pedidoRepository.findCompletadasConDetalle(tiendaId, ESTADOS, hace30, LocalDateTime.now())) {
            for (DetallePedido d : detalles(p)) {
                if (d.getProducto() == null) continue;
                vendidos30.merge(d.getProducto().getId(), (long) d.getCantidad(), Long::sum);
            }
        }
        List<RotacionResponse> rotacion = new ArrayList<>();
        for (Producto p : activos) {
            long v = vendidos30.getOrDefault(p.getId(), 0L);
            if (v == 0) continue; // sin rotación → ya aparece como producto "muerto"
            int stock = p.getStock();
            BigDecimal rot = stock > 0
                    ? BigDecimal.valueOf(v).divide(BigDecimal.valueOf(stock), 2, RoundingMode.HALF_UP)
                    : null; // stock 0 con ventas → rotación "infinita"
            // cobertura (días) = stock / (vendidos30 / 30) = stock * 30 / vendidos30
            BigDecimal cobertura = BigDecimal.valueOf((long) stock * 30)
                    .divide(BigDecimal.valueOf(v), 1, RoundingMode.HALF_UP);
            rotacion.add(new RotacionResponse(p.getId(), p.getNombre(), stock, v, rot, cobertura));
        }
        // Más urgentes primero (menor cobertura).
        rotacion.sort(Comparator.comparing(RotacionResponse::getCoberturaDias));
        dto.setRotacion(rotacion);
        return dto;
    }

    // ── Pestaña 4: Rentabilidad / ABC ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteRentabilidadResponse rentabilidad(Long tiendaId, LocalDate desde, LocalDate hasta) {
        List<Pedido> ventas = pedidoRepository.findCompletadasConDetalle(
                tiendaId, ESTADOS, inicio(desde), fin(hasta));

        // Agregación por producto y por categoría.
        Map<Long, String> nombres = new LinkedHashMap<>();
        Map<Long, BigDecimal> ingProd = new LinkedHashMap<>();
        Map<Long, BigDecimal> costoProd = new LinkedHashMap<>();
        Map<String, BigDecimal> ingCat = new LinkedHashMap<>();
        Map<String, BigDecimal> costoCat = new LinkedHashMap<>();
        for (Pedido p : ventas) {
            for (DetallePedido d : detalles(p)) {
                Producto pr = d.getProducto();
                if (pr == null) continue;
                BigDecimal ingreso = subtotal(d);
                BigDecimal costo = nz(pr.getPrecioCosto()).multiply(BigDecimal.valueOf(d.getCantidad()));
                nombres.putIfAbsent(pr.getId(), pr.getNombre());
                ingProd.merge(pr.getId(), ingreso, BigDecimal::add);
                costoProd.merge(pr.getId(), costo, BigDecimal::add);
                String cat = pr.getCategoria() != null ? pr.getCategoria().getNombre() : "Sin categoría";
                ingCat.merge(cat, ingreso, BigDecimal::add);
                costoCat.merge(cat, costo, BigDecimal::add);
            }
        }

        ReporteRentabilidadResponse dto = new ReporteRentabilidadResponse();

        // Productos más rentables (por utilidad descendente).
        List<RentabilidadProductoResponse> rentables = new ArrayList<>();
        ingProd.forEach((id, ing) -> {
            BigDecimal utilidad = ing.subtract(costoProd.get(id));
            rentables.add(new RentabilidadProductoResponse(
                    id, nombres.get(id), ing, utilidad, porcentaje(utilidad, ing)));
        });
        rentables.sort(Comparator.comparing(RentabilidadProductoResponse::getUtilidad).reversed());
        dto.setProductosRentables(rentables);

        // Rentabilidad por categoría.
        List<RentabilidadProductoResponse> porCategoria = new ArrayList<>();
        ingCat.forEach((cat, ing) -> {
            BigDecimal utilidad = ing.subtract(costoCat.get(cat));
            porCategoria.add(new RentabilidadProductoResponse(
                    null, cat, ing, utilidad, porcentaje(utilidad, ing)));
        });
        porCategoria.sort(Comparator.comparing(RentabilidadProductoResponse::getUtilidad).reversed());
        dto.setPorCategoria(porCategoria);

        // Clasificación ABC (Pareto): ordenar por ingresos desc, acumular %.
        List<Map.Entry<Long, BigDecimal>> ordenado = new ArrayList<>(ingProd.entrySet());
        ordenado.sort(Map.Entry.<Long, BigDecimal>comparingByValue().reversed());
        BigDecimal totalIngresos = ordenado.stream()
                .map(Map.Entry::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
        List<AbcItemResponse> abc = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;
        long a = 0, b = 0, c = 0;
        for (Map.Entry<Long, BigDecimal> e : ordenado) {
            BigDecimal pct = porcentaje(e.getValue(), totalIngresos);
            acumulado = acumulado.add(e.getValue());
            BigDecimal pctAcum = porcentaje(acumulado, totalIngresos);
            String clase;
            if (pctAcum.compareTo(BigDecimal.valueOf(80)) <= 0) { clase = "A"; a++; }
            else if (pctAcum.compareTo(BigDecimal.valueOf(95)) <= 0) { clase = "B"; b++; }
            else { clase = "C"; c++; }
            abc.add(new AbcItemResponse(e.getKey(), nombres.get(e.getKey()), e.getValue(), pct, pctAcum, clase));
        }
        dto.setAbc(abc);
        dto.setClaseA(a);
        dto.setClaseB(b);
        dto.setClaseC(c);
        return dto;
    }

    // ── Pestaña 5: Clientes ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ReporteClientesResponse clientes(Long tiendaId, LocalDate desde, LocalDate hasta,
                                            int diasInactividad) {
        ReporteClientesResponse dto = new ReporteClientesResponse();

        // Histórico por cliente: KPIs e inactivos.
        long recurrentes = 0, unaCompra = 0;
        LocalDateTime limite = LocalDateTime.now().minusDays(diasInactividad);
        List<ReporteClienteResponse> inactivos = new ArrayList<>();
        List<Object[]> historico = pedidoRepository.comprasPorClienteHistorico(tiendaId, ESTADOS);
        for (Object[] f : historico) {
            long compras = ((Number) f[4]).longValue();
            if (compras > 1) recurrentes++; else unaCompra++;
            LocalDateTime ultima = (LocalDateTime) f[6];
            if (ultima != null && ultima.isBefore(limite)) {
                inactivos.add(new ReporteClienteResponse(
                        (Long) f[0], (String) f[1], (String) f[2], (String) f[3],
                        compras, nz((BigDecimal) f[5]), ultima));
            }
        }
        inactivos.sort(Comparator.comparing(ReporteClienteResponse::getUltimaCompra));
        dto.setTotalClientes(historico.size());
        dto.setRecurrentes(recurrentes);
        dto.setUnaCompra(unaCompra);
        dto.setInactivos(inactivos.size());
        dto.setClientesInactivos(inactivos);

        // Top 10 mejores clientes del período seleccionado.
        List<Pedido> ventas = pedidoRepository.findCompletadasConDetalle(
                tiendaId, ESTADOS, inicio(desde), fin(hasta));
        Map<Long, long[]> compras = new LinkedHashMap<>();
        Map<Long, BigDecimal> gastado = new LinkedHashMap<>();
        Map<Long, String[]> datos = new LinkedHashMap<>();  // [nombre, email, telefono]
        for (Pedido p : ventas) {
            if (p.getUsuario() == null) continue;
            Long id = p.getUsuario().getId();
            datos.putIfAbsent(id, new String[]{
                    p.getUsuario().getNombre(), p.getUsuario().getEmail(), p.getUsuario().getNumeroWhatsapp()});
            compras.computeIfAbsent(id, k -> new long[1])[0]++;
            gastado.merge(id, nz(p.getTotal()), BigDecimal::add);
        }
        List<ReporteClienteResponse> ranking = new ArrayList<>();
        compras.forEach((id, cnt) -> ranking.add(new ReporteClienteResponse(
                id, datos.get(id)[0], datos.get(id)[1], datos.get(id)[2], cnt[0], gastado.get(id), null)));
        ranking.sort(Comparator.comparing(ReporteClienteResponse::getTotalGastado).reversed());
        dto.setTopClientes(ranking.size() > 10 ? ranking.subList(0, 10) : ranking);
        return dto;
    }

    // ── Pestaña 6: Proveedores ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProveedorCompraResponse> proveedores(Long tiendaId, LocalDate desde, LocalDate hasta) {
        List<ProveedorCompraResponse> lista = new ArrayList<>();
        for (Object[] f : movimientoRepository.comprasPorProveedor(tiendaId, desdeOAmplio(desde), hastaOAmplio(hasta))) {
            lista.add(new ProveedorCompraResponse(
                    (String) f[0],
                    ((Number) f[1]).longValue(),
                    ((Number) f[2]).longValue(),
                    nz((BigDecimal) f[3])));
        }
        return lista;
    }

    // ── Pestaña 7: Movimientos ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MovimientoInventarioResponse> movimientos(Long tiendaId, String tipo, Long usuarioId,
                                                          LocalDate desde, LocalDate hasta) {
        String tipoNorm = (tipo != null && !tipo.isBlank()) ? tipo.toUpperCase() : null;
        // El rango va siempre con valores no nulos a la query; tipo/usuario se filtran en memoria
        // para evitar el problema de PostgreSQL con binds nulos sin tipo.
        return movimientoRepository.findEntreFechas(tiendaId, desdeOAmplio(desde), hastaOAmplio(hasta))
                .stream()
                .filter(m -> tipoNorm == null || tipoNorm.equals(m.getTipo()))
                .filter(m -> usuarioId == null
                        || (m.getUsuario() != null && usuarioId.equals(m.getUsuario().getId())))
                .map(MovimientoInventarioResponse::fromEntity)
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    /** Rango por defecto: últimos 30 días si no se especifica 'desde'. */
    private LocalDateTime inicio(LocalDate desde) {
        return (desde != null ? desde : LocalDate.now().minusDays(30)).atStartOfDay();
    }

    private LocalDateTime fin(LocalDate hasta) {
        return (hasta != null ? hasta : LocalDate.now()).atTime(LocalTime.MAX);
    }

    /** Inicio del rango con sentinela amplio (no nulo) cuando no se especifica fecha. */
    private LocalDateTime desdeOAmplio(LocalDate desde) {
        return (desde != null ? desde : LocalDate.of(1970, 1, 1)).atStartOfDay();
    }

    /** Fin del rango con sentinela amplio (no nulo) cuando no se especifica fecha. */
    private LocalDateTime hastaOAmplio(LocalDate hasta) {
        return (hasta != null ? hasta : LocalDate.of(2999, 12, 31)).atTime(LocalTime.MAX);
    }

    private List<DetallePedido> detalles(Pedido p) {
        return p.getDetalles() != null ? p.getDetalles() : List.of();
    }

    private BigDecimal subtotal(DetallePedido d) {
        return nz(d.getPrecioUnitario()).multiply(BigDecimal.valueOf(d.getCantidad()));
    }

    private BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /** Porcentaje parte/total con 2 decimales (0 si el total es 0). */
    private BigDecimal porcentaje(BigDecimal parte, BigDecimal total) {
        if (total.signum() == 0) return BigDecimal.ZERO;
        return parte.multiply(BigDecimal.valueOf(100)).divide(total, 2, RoundingMode.HALF_UP);
    }

    /** Variación % entre dos períodos; si el anterior es 0 devuelve 100 (o 0 si ambos 0). */
    private BigDecimal variacion(BigDecimal actual, BigDecimal anterior) {
        if (anterior.signum() == 0) {
            return actual.signum() == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(100);
        }
        return actual.subtract(anterior)
                .multiply(BigDecimal.valueOf(100))
                .divide(anterior, 2, RoundingMode.HALF_UP);
    }
}
