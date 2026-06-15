package com.upb.ecommerce.data.repository;

import com.upb.ecommerce.domain.entities.Categoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByTiendaIdAndEstadoTrue(Long tiendaId);

    Page<Categoria> findByTiendaIdAndEstadoTrue(Long tiendaId, Pageable pageable);
}
