package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(Long productoId);

    List<MovimientoInventario> findByTiendaIdOrderByFechaDesc(Long tiendaId);

    long countByTiendaId(Long tiendaId);

    /**
     * Última fecha de SALIDA por producto (para detectar productos "muertos").
     * Devuelve filas [productoId (Long), ultimaFecha (LocalDateTime)].
     */
    @Query("SELECT m.producto.id, MAX(m.fecha) FROM MovimientoInventario m " +
            "WHERE m.tienda.id = :tiendaId AND m.tipo = 'SALIDA' GROUP BY m.producto.id")
    List<Object[]> ultimaSalidaPorProducto(@Param("tiendaId") Long tiendaId);

    /**
     * Movimientos de la tienda dentro de un rango de fechas (no nulo), más recientes primero.
     * Los filtros opcionales por tipo/usuario se aplican en memoria en el servicio para evitar
     * el problema de PostgreSQL con binds nulos sin tipo (patrón {@code :param IS NULL}).
     */
    @Query("SELECT m FROM MovimientoInventario m WHERE m.tienda.id = :tiendaId " +
            "AND m.fecha >= :desde AND m.fecha <= :hasta " +
            "ORDER BY m.fecha DESC")
    List<MovimientoInventario> findEntreFechas(@Param("tiendaId") Long tiendaId,
                                               @Param("desde") LocalDateTime desde,
                                               @Param("hasta") LocalDateTime hasta);

    /**
     * Compras por proveedor en un rango (no nulo): agrupa las ENTRADAS con proveedor no nulo.
     * Filas [proveedor (String), numEntradas (Long), unidades (Long), costoTotal (BigDecimal)].
     * El costo total ignora entradas sin precioUnitario (SUM omite nulos).
     */
    @Query("SELECT m.proveedor, COUNT(m), SUM(m.cantidad), SUM(m.cantidad * m.precioUnitario) " +
            "FROM MovimientoInventario m WHERE m.tienda.id = :tiendaId AND m.tipo = 'ENTRADA' " +
            "AND m.proveedor IS NOT NULL AND m.proveedor <> '' " +
            "AND m.fecha >= :desde AND m.fecha <= :hasta " +
            "GROUP BY m.proveedor ORDER BY SUM(m.cantidad * m.precioUnitario) DESC")
    List<Object[]> comprasPorProveedor(@Param("tiendaId") Long tiendaId,
                                       @Param("desde") LocalDateTime desde,
                                       @Param("hasta") LocalDateTime hasta);
}
