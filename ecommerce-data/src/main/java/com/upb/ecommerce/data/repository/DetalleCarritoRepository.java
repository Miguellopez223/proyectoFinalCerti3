package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.DetalleCarrito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetalleCarritoRepository extends JpaRepository<DetalleCarrito, Long> {

    Optional<DetalleCarrito> findByCarritoIdAndProductoId(Long carritoId, Long productoId);

    /** Detalles persistidos de un carrito, leídos directo de la BD (no de la colección en memoria). */
    List<DetalleCarrito> findByCarritoId(Long carritoId);
}
