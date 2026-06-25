package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Pestaña 2 — Ventas: indicadores financieros del período y desglose por método de pago.
 *
 * <ul>
 *   <li><b>Utilidad Bruta</b> = Σ (precio de venta − precio de costo) por ítem vendido.</li>
 *   <li><b>Margen %</b> = Utilidad Bruta / Ingresos Brutos × 100.</li>
 * </ul>
 */
@Data
public class ReporteVentasResponse {

    private long totalVentas;
    private BigDecimal ingresosBrutos;
    private BigDecimal costoVentas;
    private BigDecimal utilidadBruta;
    private BigDecimal ticketPromedio;
    private BigDecimal margenPorcentaje;

    // ── KPIs secundarios ─────────────────────────────────────────────────────
    /** Total de unidades vendidas (Σ cantidad de los detalles). */
    private long unidadesVendidas;
    /** Promedio de unidades por venta (unidadesVendidas / totalVentas). */
    private BigDecimal unidadesPorVenta;
    /** Pedidos anulados (estado CANCELADO) en el período. */
    private long ventasAnuladasCantidad;
    /** Monto revertido por los pedidos anulados. */
    private BigDecimal montoAnulado;

    // ── Comparativa mensual (independiente del rango de fechas) ───────────────
    private BigDecimal ingresosMesActual;
    private BigDecimal ingresosMesAnterior;
    /** Variación %: (mesActual - mesAnterior) / mesAnterior * 100. */
    private BigDecimal variacionMensual;

    /** Desglose por método de pago (etiqueta = método, cantidad = nº pagos, ingresos = monto). */
    private List<SerieItemResponse> porMetodoPago;
}
