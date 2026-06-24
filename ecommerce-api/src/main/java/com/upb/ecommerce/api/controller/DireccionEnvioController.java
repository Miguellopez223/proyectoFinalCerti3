package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.DireccionEnvioRequest;
import com.upb.ecommerce.core.dto.response.DireccionEnvioResponse;
import com.upb.ecommerce.core.service.DireccionEnvioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Direcciones de envío", description = "Direcciones de envío de un usuario")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/direcciones")
public class DireccionEnvioController {

    private final DireccionEnvioService direccionService;

    public DireccionEnvioController(DireccionEnvioService direccionService) {
        this.direccionService = direccionService;
    }

    @Operation(summary = "Listar las direcciones de envío de un usuario")
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<DireccionEnvioResponse>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(direccionService.listarPorUsuario(usuarioId));
    }

    @Operation(summary = "Obtener una dirección de envío por su id")
    @GetMapping("/{id}")
    public ResponseEntity<DireccionEnvioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(direccionService.obtenerPorId(id));
    }

    @Operation(summary = "Crear una dirección de envío")
    @PostMapping
    public ResponseEntity<DireccionEnvioResponse> crear(@Valid @RequestBody DireccionEnvioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(direccionService.crear(request));
    }

    @Operation(summary = "Actualizar una dirección de envío")
    @PutMapping("/{id}")
    public ResponseEntity<DireccionEnvioResponse> actualizar(@PathVariable Long id,
                                                             @Valid @RequestBody DireccionEnvioRequest request) {
        return ResponseEntity.ok(direccionService.actualizar(id, request));
    }

    @Operation(summary = "Eliminar una dirección de envío")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        direccionService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
