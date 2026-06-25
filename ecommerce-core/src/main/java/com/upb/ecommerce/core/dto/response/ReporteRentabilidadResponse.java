package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Pestaña 4 — Rentabilidad / ABC: productos y categorías más rentables del período más la
 * clasificación ABC (Pareto) por ingresos.
 */
@Data
public class ReporteRentabilidadResponse {

    /** Conteo de productos por clase ABC. */
    private long claseA;
    private long claseB;
    private long claseC;

    /** Productos ordenados por utilidad descendente. */
    private List<RentabilidadProductoResponse> productosRentables;
    /** Rentabilidad agrupada por categoría. */
    private List<RentabilidadProductoResponse> porCategoria;
    /** Tabla de clasificación ABC (Pareto), ordenada por ingresos descendente. */
    private List<AbcItemResponse> abc;
}
