package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Pestaña 3 — Productos: ranking de más vendidos, productos "muertos" (sin salidas en N
 * días), valorización del inventario y listado de stock crítico.
 *
 * <p><b>Valorización de Inventario</b> = Σ (stock disponible × precio) por producto, tanto
 * a costo como a precio de venta.
 */
@Data
public class ReporteProductosResponse {

    private List<ProductoRankingResponse> masVendidos;
    private List<ProductoResponse> productosMuertos;
    private BigDecimal valorizacionCosto;
    private BigDecimal valorizacionVenta;
    /** Cantidad de SKUs (productos activos distintos) de la tienda. */
    private long totalSkus;
    private List<ProductoResponse> stockCritico;
    /** Índice de rotación y cobertura (en días) por producto, sobre ventas de los últimos 30 días. */
    private List<RotacionResponse> rotacion;
}
