package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.AtributoProductoRequest;
import com.upb.ecommerce.core.dto.response.AtributoProductoResponse;
import com.upb.ecommerce.core.service.AtributoProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Atributos de producto", description = "Atributos (color, talla, etc.) de un producto. Alta/edición/baja requiere rol ADMIN")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/atributos")
public class AtributoProductoController {

    private final AtributoProductoService atributoService;

    public AtributoProductoController(AtributoProductoService atributoService) {
        this.atributoService = atributoService;
    }

    @Operation(summary = "Listar los atributos de un producto")
    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<AtributoProductoResponse>> listarPorProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(atributoService.listarPorProducto(productoId));
    }

    @Operation(summary = "Agregar un atributo a un producto", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<AtributoProductoResponse> agregar(@Valid @RequestBody AtributoProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(atributoService.agregar(request));
    }

    @Operation(summary = "Actualizar un atributo", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<AtributoProductoResponse> actualizar(@PathVariable Long id,
                                                               @Valid @RequestBody AtributoProductoRequest request) {
        return ResponseEntity.ok(atributoService.actualizar(id, request));
    }

    @Operation(summary = "Eliminar un atributo", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        atributoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
