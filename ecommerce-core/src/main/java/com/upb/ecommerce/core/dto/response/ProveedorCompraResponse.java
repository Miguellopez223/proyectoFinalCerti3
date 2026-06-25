package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Pestaña 6 — Proveedores: compras a un proveedor en el período, agregadas a partir de los
 * movimientos de inventario de tipo ENTRADA.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProveedorCompraResponse {

    private String proveedor;
    /** Número de entradas (movimientos) registradas a este proveedor. */
    private long numEntradas;
    /** Unidades compradas (Σ cantidad). */
    private long unidades;
    /** Costo total comprado (Σ cantidad × precioUnitario). */
    private BigDecimal costoTotal;
}
