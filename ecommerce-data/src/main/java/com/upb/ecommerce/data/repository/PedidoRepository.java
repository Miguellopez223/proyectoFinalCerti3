package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.Pedido;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByUsuarioIdAndTiendaId(Long usuarioId, Long tiendaId);

    /** Todos los pedidos del usuario (todas las tiendas), más recientes primero. */
    List<Pedido> findByUsuarioIdOrderByIdDesc(Long usuarioId);

    Optional<Pedido> findByIdAndTiendaId(Long id, Long tiendaId);

    /** Pedidos "completados" (estado en la lista) dentro de un rango de fechas. */
    @Query("SELECT p FROM Pedido p WHERE p.tienda.id = :tiendaId " +
            "AND p.estadoPedido IN :estados " +
            "AND p.fechaCreacion >= :desde AND p.fechaCreacion <= :hasta")
    List<Pedido> findVentasEntre(@Param("tiendaId") Long tiendaId,
                                 @Param("estados") List<String> estados,
                                 @Param("desde") LocalDateTime desde,
                                 @Param("hasta") LocalDateTime hasta);

    /** Últimas ventas completadas (usar Pageable para limitar, p.ej. las 5 más recientes). */
    @Query("SELECT p FROM Pedido p WHERE p.tienda.id = :tiendaId " +
            "AND p.estadoPedido IN :estados ORDER BY p.fechaCreacion DESC")
    List<Pedido> findUltimasVentas(@Param("tiendaId") Long tiendaId,
                                   @Param("estados") List<String> estados,
                                   Pageable pageable);

    /** Suma de ingresos de las ventas completadas en un rango (comparativa semanal). */
    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.tienda.id = :tiendaId " +
            "AND p.estadoPedido IN :estados " +
            "AND p.fechaCreacion >= :desde AND p.fechaCreacion <= :hasta")
    BigDecimal sumIngresos(@Param("tiendaId") Long tiendaId,
                           @Param("estados") List<String> estados,
                           @Param("desde") LocalDateTime desde,
                           @Param("hasta") LocalDateTime hasta);

    /**
     * Ventas completadas en un rango con sus detalles, producto, categoría y usuario
     * pre-cargados (fetch-join). Evita N+1 y LazyInitializationException al agregar en Java.
     */
    @Query("SELECT DISTINCT p FROM Pedido p " +
            "LEFT JOIN FETCH p.detalles d " +
            "LEFT JOIN FETCH d.producto pr " +
            "LEFT JOIN FETCH pr.categoria " +
            "LEFT JOIN FETCH p.usuario " +
            "WHERE p.tienda.id = :tiendaId AND p.estadoPedido IN :estados " +
            "AND p.fechaCreacion >= :desde AND p.fechaCreacion <= :hasta")
    List<Pedido> findCompletadasConDetalle(@Param("tiendaId") Long tiendaId,
                                           @Param("estados") List<String> estados,
                                           @Param("desde") LocalDateTime desde,
                                           @Param("hasta") LocalDateTime hasta);

    /**
     * Ranking histórico de productos más vendidos (sin filtro de fecha): filas
     * [productoId (Long), nombre (String), unidades (Long), ingresos (BigDecimal)],
     * ordenadas por unidades descendente. Usar {@code Pageable} para el top N.
     */
    @Query("SELECT d.producto.id, d.producto.nombre, SUM(d.cantidad), SUM(d.precioUnitario * d.cantidad) " +
            "FROM DetallePedido d WHERE d.pedido.tienda.id = :tiendaId " +
            "AND d.pedido.estadoPedido IN :estados " +
            "GROUP BY d.producto.id, d.producto.nombre " +
            "ORDER BY SUM(d.cantidad) DESC")
    List<Object[]> topProductosHistorico(@Param("tiendaId") Long tiendaId,
                                         @Param("estados") List<String> estados,
                                         Pageable pageable);

    /**
     * Última compra (completada) por cliente, todo el historial: filas
     * [usuarioId (Long), ultimaCompra (LocalDateTime)]. Usado para detectar clientes inactivos.
     */
    @Query("SELECT p.usuario.id, MAX(p.fechaCreacion) FROM Pedido p " +
            "WHERE p.tienda.id = :tiendaId AND p.estadoPedido IN :estados " +
            "GROUP BY p.usuario.id")
    List<Object[]> ultimaCompraPorCliente(@Param("tiendaId") Long tiendaId,
                                          @Param("estados") List<String> estados);

    /**
     * Compras (completadas) por cliente, todo el historial: filas
     * [usuarioId (Long), nombre (String), email (String), telefono (String),
     *  cantidadCompras (Long), totalGastado (BigDecimal), ultimaCompra (LocalDateTime)].
     */
    @Query("SELECT p.usuario.id, p.usuario.nombre, p.usuario.email, p.usuario.numeroWhatsapp, " +
            "COUNT(p), COALESCE(SUM(p.total), 0), MAX(p.fechaCreacion) FROM Pedido p " +
            "WHERE p.tienda.id = :tiendaId AND p.estadoPedido IN :estados " +
            "GROUP BY p.usuario.id, p.usuario.nombre, p.usuario.email, p.usuario.numeroWhatsapp")
    List<Object[]> comprasPorClienteHistorico(@Param("tiendaId") Long tiendaId,
                                              @Param("estados") List<String> estados);
}
