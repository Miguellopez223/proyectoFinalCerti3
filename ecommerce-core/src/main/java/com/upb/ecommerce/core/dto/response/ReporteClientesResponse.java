package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.util.List;

/**
 * Pestaña 5 — Clientes: KPIs de la cartera, top de mejores clientes del período y clientes
 * inactivos (compraron antes pero no en los últimos N días).
 */
@Data
public class ReporteClientesResponse {

    /** Clientes que compraron al menos una vez (histórico). */
    private long totalClientes;
    /** Clientes con más de una compra (histórico). */
    private long recurrentes;
    /** Clientes con una sola compra (histórico). */
    private long unaCompra;
    /** Clientes sin compras en los últimos N días. */
    private long inactivos;

    /** Top 10 clientes por monto gastado en el período. */
    private List<ReporteClienteResponse> topClientes;
    /** Clientes inactivos (con teléfono y fecha de última compra) para reactivarlos. */
    private List<ReporteClienteResponse> clientesInactivos;
}
