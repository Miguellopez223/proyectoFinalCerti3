package com.upb.ecommerce.core.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Fila del ranking de clientes por compras. Como aquí las ventas son autoservicio del cliente
 * (marketplace B2C), se rankea por cliente, no por vendedor.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReporteClienteResponse {

    private Long usuarioId;
    private String nombre;
    private String email;
    /** Teléfono/WhatsApp para reactivar clientes inactivos. */
    private String telefono;
    private long cantidadCompras;
    private BigDecimal totalGastado;
    /** Fecha de la última compra (usado en el listado de inactivos). Null en el ranking top. */
    private LocalDateTime ultimaCompra;
}
