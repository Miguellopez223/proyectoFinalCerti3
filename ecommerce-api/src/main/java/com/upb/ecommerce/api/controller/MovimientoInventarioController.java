package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.MovimientoInventarioRequest;
import com.upb.ecommerce.core.dto.response.MovimientoInventarioResponse;
import com.upb.ecommerce.core.service.MovimientoInventarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Inventario", description = "Movimientos de inventario (entradas/salidas/ajustes). Solo ADMIN")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/inventario")
@PreAuthorize("hasRole('ADMIN')")
public class MovimientoInventarioController {

    private final MovimientoInventarioService movimientoService;

    public MovimientoInventarioController(MovimientoInventarioService movimientoService) {
        this.movimientoService = movimientoService;
    }

    @Operation(summary = "Listar los movimientos de inventario de una tienda")
    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<List<MovimientoInventarioResponse>> listarPorTienda(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(movimientoService.listarPorTienda(tiendaId));
    }

    @Operation(summary = "Listar los movimientos de inventario de un producto")
    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventarioResponse>> listarPorProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(movimientoService.listarPorProducto(productoId));
    }

    @Operation(summary = "Registrar un movimiento de inventario",
            description = "Entrada, salida o ajuste de stock de un producto.")
    @PostMapping
    public ResponseEntity<MovimientoInventarioResponse> registrar(
            @Valid @RequestBody MovimientoInventarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimientoService.registrar(request));
    }
}
