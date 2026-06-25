package com.upb.ecommerce.domain.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
@Data
@NoArgsConstructor
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario; // null = movimiento automático del sistema

    @Column(nullable = false, length = 50)
    private String tipo; // "ENTRADA" o "SALIDA"

    @Column(nullable = false)
    private Integer cantidad;

    @Column(columnDefinition = "TEXT")
    private String referencia; // Ej: "Venta pedido #PED-ABC123", "Ajuste manual de stock"

    /**
     * Proveedor al que se compró el stock. Solo relevante en movimientos de tipo ENTRADA;
     * null en salidas, ajustes o filas importadas del .backup. Habilita el reporte de Proveedores.
     */
    @Column(length = 200)
    private String proveedor;

    /**
     * Costo unitario de la compra (entrada). Nullable a propósito: salidas y filas viejas
     * no lo tienen. Usado para valorizar las compras por proveedor.
     */
    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();
}
