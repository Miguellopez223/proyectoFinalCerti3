package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Fila de rotación / cobertura de un producto (pestaña Inteligencia de productos).
 *
 * <ul>
 *   <li><b>rotacion</b> = unidades vendidas en 30 días / stock actual.</li>
 *   <li><b>coberturaDias</b> = stock / (vendidos30 / 30); null si no hubo ventas (cobertura ∞).</li>
 * </ul>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RotacionResponse {

    private Long productoId;
    private String nombre;
    private int stock;
    private long vendidos30;
    private BigDecimal rotacion;
    /** Días de cobertura; null = sin ventas en 30 días (cobertura infinita). */
    private BigDecimal coberturaDias;
}
