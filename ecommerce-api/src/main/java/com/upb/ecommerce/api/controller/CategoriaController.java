package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.CategoriaRequest;
import com.upb.ecommerce.core.dto.response.CategoriaResponse;
import com.upb.ecommerce.core.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<List<CategoriaResponse>> listarPorTienda(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(categoriaService.listarPorTienda(tiendaId));
    }

    @GetMapping("/tienda/{tiendaId}/paginado")
    public ResponseEntity<Page<CategoriaResponse>> listarPorTiendaPaginado(
            @PathVariable Long tiendaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {
        return ResponseEntity.ok(categoriaService.listarPorTiendaPaginado(
                tiendaId,
                PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
    }

    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
