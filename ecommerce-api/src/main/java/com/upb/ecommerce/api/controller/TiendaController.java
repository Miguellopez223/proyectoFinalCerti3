package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.TiendaRequest;
import com.upb.ecommerce.core.dto.response.TiendaResponse;
import com.upb.ecommerce.core.service.TiendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Tiendas", description = "Gestión de tiendas. Listar y crear son públicos; editar y desactivar requieren rol ADMIN")
@RestController
@RequestMapping("/api/tiendas")
public class TiendaController {

    private final TiendaService tiendaService;

    public TiendaController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    @Operation(summary = "Listar todas las tiendas", description = "Endpoint público (sin login).")
    @GetMapping
    public ResponseEntity<List<TiendaResponse>> listarTodas() {
        return ResponseEntity.ok(tiendaService.listarTodas());
    }

    @Operation(summary = "Obtener una tienda por su id", security = @SecurityRequirement(name = "bearerToken"))
    @GetMapping("/{id}")
    public ResponseEntity<TiendaResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(tiendaService.obtenerPorId(id));
    }

    @Operation(summary = "Obtener una tienda por su slug", security = @SecurityRequirement(name = "bearerToken"))
    @GetMapping("/slug/{slug}")
    public ResponseEntity<TiendaResponse> obtenerPorSlug(@PathVariable String slug) {
        return ResponseEntity.ok(tiendaService.obtenerPorSlug(slug));
    }

    @Operation(summary = "Crear una tienda", description = "Endpoint público: permite el alta inicial de una tienda.")
    @PostMapping
    public ResponseEntity<TiendaResponse> crear(@Valid @RequestBody TiendaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tiendaService.crear(request));
    }

    @Operation(summary = "Actualizar una tienda", description = "Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<TiendaResponse> actualizar(@PathVariable Long id,
                                                     @Valid @RequestBody TiendaRequest request) {
        return ResponseEntity.ok(tiendaService.actualizar(id, request));
    }

    @Operation(summary = "Desactivar una tienda", description = "Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        tiendaService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}
