package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByTiendaIdAndEstadoTrue(Long tiendaId);

    Page<Producto> findByTiendaIdAndEstadoTrue(Long tiendaId, Pageable pageable);

    List<Producto> findByTiendaIdAndCategoriaIdAndEstadoTrue(Long tiendaId, Long categoriaId);

    Optional<Producto> findByIdAndTiendaId(Long id, Long tiendaId);

    Optional<Producto> findBySlugProductoAndTiendaId(String slugProducto, Long tiendaId);

    long countByTiendaIdAndEstadoTrue(Long tiendaId);

    /** Productos agotados (stock = 0) y activos. */
    long countByTiendaIdAndEstadoTrueAndStock(Long tiendaId, Integer stock);

    /** Productos activos cuyo stock está en o por debajo del mínimo (incluye agotados). */
    @Query("SELECT p FROM Producto p WHERE p.tienda.id = :tiendaId AND p.estado = true " +
           "AND p.stock <= p.stockMinimo ORDER BY p.stock ASC")
    List<Producto> findStockCritico(@Param("tiendaId") Long tiendaId);

    // ─── Marketplace (cross-store) ──────────────────────────────────────────────
    // Usa la función SQL kilikea_norm() (creada por MarketplaceDbInitializer) para
    // comparar sin distinguir mayúsculas/minúsculas ni tildes, por coincidencia parcial.

    /** Productos activos (de tiendas activas) que coinciden con el término en nombre de producto, categoría o tienda. */
    @Query(value = """
            SELECT p.* FROM productos p
            JOIN tiendas t ON t.id = p.tienda_id AND t.estado = true
            LEFT JOIN categorias c ON c.id = p.categoria_id
            WHERE p.estado = true
              AND ( kilikea_norm(p.nombre) LIKE '%' || kilikea_norm(:q) || '%'
                 OR kilikea_norm(coalesce(c.nombre, '')) LIKE '%' || kilikea_norm(:q) || '%'
                 OR kilikea_norm(t.nombre) LIKE '%' || kilikea_norm(:q) || '%' )
            """, nativeQuery = true)
    List<Producto> buscarCoincidencias(@Param("q") String q);

    /** Categorías más populares (por cantidad de productos activos), agregadas por nombre normalizado. */
    @Query(value = """
            SELECT min(c.nombre) AS nombre, count(*) AS total
            FROM productos p
            JOIN categorias c ON c.id = p.categoria_id AND c.estado = true
            JOIN tiendas t ON t.id = p.tienda_id AND t.estado = true
            WHERE p.estado = true
            GROUP BY kilikea_norm(c.nombre)
            ORDER BY count(*) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> categoriasPopulares(@Param("limit") int limit);

    /** Productos con oferta vigente (cross-store), ordenados por mayor descuento. */
    @Query("SELECT p FROM Producto p WHERE p.estado = true AND p.tienda.estado = true " +
           "AND p.precioOferta IS NOT NULL AND p.precioOferta < p.precio " +
           "AND (p.ofertaInicio IS NULL OR p.ofertaInicio <= CURRENT_TIMESTAMP) " +
           "AND (p.ofertaFin IS NULL OR p.ofertaFin >= CURRENT_TIMESTAMP) " +
           "ORDER BY (p.precio - p.precioOferta) / p.precio DESC")
    List<Producto> findOfertasVigentes(Pageable pageable);

    /** Productos recientes (cross-store) — proxy de "más buscados" usando id DESC. */
    @Query("SELECT p FROM Producto p WHERE p.estado = true AND p.tienda.estado = true ORDER BY p.id DESC")
    List<Producto> findRecientes(Pageable pageable);

    /** Destacados (cross-store): en stock, ordenados por precio descendente. */
    @Query("SELECT p FROM Producto p WHERE p.estado = true AND p.tienda.estado = true AND p.stock > 0 ORDER BY p.precio DESC")
    List<Producto> findDestacados(Pageable pageable);

    /** Recomendados: otros productos de la misma categoría (por nombre normalizado), excluyendo el actual. */
    @Query(value = """
            SELECT p2.* FROM productos p2
            JOIN tiendas t ON t.id = p2.tienda_id AND t.estado = true
            JOIN categorias c2 ON c2.id = p2.categoria_id
            WHERE p2.estado = true AND p2.id <> :id
              AND kilikea_norm(c2.nombre) = (
                SELECT kilikea_norm(c1.nombre) FROM productos p1
                JOIN categorias c1 ON c1.id = p1.categoria_id
                WHERE p1.id = :id )
            ORDER BY random() LIMIT :limit
            """, nativeQuery = true)
    List<Producto> recomendadosPorCategoria(@Param("id") Long id, @Param("limit") int limit);

    /**
     * Búsqueda paginada de productos activos con filtros opcionales.
     * Parámetros de filtro:
     * - nombre: búsqueda por nombre normalizado (sin tildes, insensible a mayúsculas)
     * - categoriaId: filtrar por ID de categoría
     * - precioMin/precioMax: rango de precio
     * - enStock: si true, solo productos con stock > 0
     * - tiendaId: filtrar por tienda (opcional)
     */
    @Query("""
            SELECT p FROM Producto p
            LEFT JOIN p.categoria c
            WHERE p.estado = true
              AND p.tienda.estado = true
              AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')))
              AND (:categoriaId IS NULL OR p.categoria.id = :categoriaId)
              AND (:precioMin IS NULL OR p.precio >= :precioMin)
              AND (:precioMax IS NULL OR p.precio <= :precioMax)
              AND (:enStock = false OR p.stock > 0)
              AND (:tiendaId IS NULL OR p.tienda.id = :tiendaId)
            ORDER BY p.nombre ASC
            """)
    Page<Producto> buscarConFiltros(
            @Param("nombre") String nombre,
            @Param("categoriaId") Long categoriaId,
            @Param("precioMin") BigDecimal precioMin,
            @Param("precioMax") BigDecimal precioMax,
            @Param("enStock") Boolean enStock,
            @Param("tiendaId") Long tiendaId,
            Pageable pageable
    );
}
