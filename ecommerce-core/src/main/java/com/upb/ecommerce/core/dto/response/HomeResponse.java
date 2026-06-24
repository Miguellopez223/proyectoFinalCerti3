package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.util.List;

/** Secciones del home del marketplace (todas cross-store). */
@Data
public class HomeResponse {
    private List<ProductoResponse> masBuscados;
    private List<ProductoResponse> ofertas;
    private List<ProductoResponse> destacados;
    private List<TiendaResponse> tiendas;
}
