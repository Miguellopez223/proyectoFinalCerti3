package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.CategoriaRequest;
import com.upb.ecommerce.core.dto.response.CategoriaResponse;
import com.upb.ecommerce.core.service.CategoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Categorías", description = "Categorías de producto por tienda. Crear/editar/eliminar requiere rol ADMIN")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @Operation(summary = "Listar las categorías de una tienda")
    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<List<CategoriaResponse>> listarPorTienda(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(categoriaService.listarPorTienda(tiendaId));
    }

    @Operation(summary = "Crear una categoría", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<CategoriaResponse> crear(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.crear(request));
    }

    @Operation(summary = "Actualizar una categoría", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaResponse> actualizar(@PathVariable Long id,
                                                        @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.actualizar(id, request));
    }

    @Operation(summary = "Eliminar una categoría", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        categoriaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
