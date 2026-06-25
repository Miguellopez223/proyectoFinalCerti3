package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.util.List;

/** Secciones del home del marketplace (todas cross-store). */
@Data
public class HomeResponse {
    private List<ProductoResponse> masBuscados;
    private List<ProductoResponse> ofertas;
    private List<ProductoResponse> destacados;
    /** Productos recién agregados (los más nuevos) — sección "NUEVO". */
    private List<ProductoResponse> novedades;
    /** Catálogo completo (todos los productos activos), para el deck "Descubrí deslizando". */
    private List<ProductoResponse> catalogo;
    private List<TiendaResponse> tiendas;
}
