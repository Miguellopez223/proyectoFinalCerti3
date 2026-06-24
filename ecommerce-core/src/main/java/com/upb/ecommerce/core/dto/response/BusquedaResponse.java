package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Resultado de una búsqueda del marketplace: la página de productos + el total y las facetas
 * de conteo por tienda (para el filtro por comercio).
 */
@Data
public class BusquedaResponse {
    private List<ProductoResponse> productos;
    private long total;
    private int page;
    private int size;
    private int totalPaginas;
    private List<FacetaTienda> facetasTiendas;
}
