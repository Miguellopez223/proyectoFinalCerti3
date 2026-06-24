package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.UsuarioRequest;
import com.upb.ecommerce.core.dto.response.UsuarioResponse;
import com.upb.ecommerce.core.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Gestión CRUD de usuarios. El login se movió a {@link AuthController} en /api/auth.
 */
@Tag(name = "Usuarios", description = "Gestión de usuarios. El registro es público; el resto requiere login (alta/baja por ADMIN)")
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @Operation(summary = "Listar los usuarios de una tienda", description = "Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<List<UsuarioResponse>> listarPorTienda(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(usuarioService.listarPorTienda(tiendaId));
    }

    @Operation(summary = "Obtener un usuario por su id", security = @SecurityRequirement(name = "bearerToken"))
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    @Operation(summary = "Registrar un usuario (auto-registro)",
            description = "Endpoint público. Crea siempre un usuario con rol CLIENTE.")
    @PostMapping("/registrar")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.registrar(request));
    }

    /**
     * Alta de usuario por un ADMIN: respeta el rol y permite fijar WhatsApp y visibilidad
     * en el catálogo público. A diferencia de /registrar (público, siempre CLIENTE).
     */
    @Operation(summary = "Crear un usuario (alta por ADMIN)",
            description = "Respeta el rol indicado y permite fijar WhatsApp y visibilidad en el catálogo. Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crearPorAdmin(request));
    }

    @Operation(summary = "Actualizar un usuario", security = @SecurityRequirement(name = "bearerToken"))
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> actualizar(@PathVariable Long id,
                                                      @Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.actualizar(id, request));
    }

    @Operation(summary = "Desactivar un usuario", description = "Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        usuarioService.desactivar(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reactivar un usuario", description = "Requiere rol ADMIN.",
            security = @SecurityRequirement(name = "bearerToken"))
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<UsuarioResponse> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.reactivar(id));
    }
}
