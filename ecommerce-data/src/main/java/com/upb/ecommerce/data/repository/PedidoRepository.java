package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.Pedido;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByUsuarioIdAndTiendaId(Long usuarioId, Long tiendaId);

    Page<Pedido> findByUsuarioIdAndTiendaId(Long usuarioId, Long tiendaId, Pageable pageable);

    Optional<Pedido> findByIdAndTiendaId(Long id, Long tiendaId);
}
