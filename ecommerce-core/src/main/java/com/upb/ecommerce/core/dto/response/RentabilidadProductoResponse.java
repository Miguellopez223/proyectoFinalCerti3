package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** Rentabilidad de un producto (o categoría): ingresos, utilidad y margen del período. */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RentabilidadProductoResponse {

    private Long id;
    private String nombre;
    private BigDecimal ingresos;
    private BigDecimal utilidad;
    private BigDecimal margenPorcentaje;
}
