package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Conteo de productos por tienda para los resultados de una búsqueda (filtro por comercio). */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FacetaTienda {
    private Long tiendaId;
    private String nombre;
    private long cantidad;
}
