package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.Pago;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByPedidoId(Long pedidoId);

    Page<Pago> findByPedidoId(Long pedidoId, Pageable pageable);

    Optional<Pago> findFirstByPedidoIdAndMetodoOrderByIdDesc(Long pedidoId, String metodo);

    Optional<Pago> findByTransaccionPasarelaId(String transaccionPasarelaId);
}
