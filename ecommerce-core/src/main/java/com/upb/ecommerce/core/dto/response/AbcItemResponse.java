package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Fila de la clasificación ABC (análisis de Pareto): productos ordenados por ingresos
 * descendente; la clase se asigna por el % acumulado (A ≤ 80%, B ≤ 95%, C el resto).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AbcItemResponse {

    private Long productoId;
    private String nombre;
    private BigDecimal ingresos;
    /** % que este producto representa del total de ingresos. */
    private BigDecimal porcentaje;
    /** % acumulado hasta este producto (inclusive). */
    private BigDecimal porcentajeAcumulado;
    /** "A", "B" o "C". */
    private String clase;
}
