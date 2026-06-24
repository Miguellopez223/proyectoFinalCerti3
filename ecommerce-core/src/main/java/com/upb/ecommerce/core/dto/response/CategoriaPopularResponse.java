package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Una categoría popular del marketplace: nombre (representativo) y cantidad de productos. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategoriaPopularResponse {
    private String nombre;
    private long cantidad;
}
