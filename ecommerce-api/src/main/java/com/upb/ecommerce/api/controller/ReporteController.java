package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.response.*;
import com.upb.ecommerce.core.service.ReporteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Reportes analíticos de la tienda (5 pestañas). Solo accesibles por ADMIN.
 *
 * <p>Los parámetros {@code desde}/{@code hasta} son fechas ISO (yyyy-MM-dd) opcionales;
 * por defecto se reportan los últimos 30 días.
 */
@Tag(name = "Reportes", description = "Reportes analíticos de la tienda (analítico, ventas, productos, clientes, movimientos). Solo ADMIN")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/reportes/tienda/{tiendaId}")
@PreAuthorize("hasRole('ADMIN')")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @Operation(summary = "Reporte analítico general",
            description = "Métricas globales del periodo. desde/hasta opcionales (ISO yyyy-MM-dd); por defecto últimos 30 días.")
    @GetMapping("/analitico")
    public ResponseEntity<ReporteAnaliticoResponse> analitico(
            @PathVariable Long tiendaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.analitico(tiendaId, desde, hasta));
    }

    @Operation(summary = "Reporte de ventas del periodo")
    @GetMapping("/ventas")
    public ResponseEntity<ReporteVentasResponse> ventas(
            @PathVariable Long tiendaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.ventas(tiendaId, desde, hasta));
    }

    @Operation(summary = "Reporte de productos",
            description = "Incluye productos sin movimiento. diasSinMovimiento define el umbral (por defecto 30).")
    @GetMapping("/productos")
    public ResponseEntity<ReporteProductosResponse> productos(
            @PathVariable Long tiendaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "30") int diasSinMovimiento) {
        return ResponseEntity.ok(reporteService.productos(tiendaId, desde, hasta, diasSinMovimiento));
    }

    @Operation(summary = "Reporte de clientes del periodo")
    @GetMapping("/clientes")
    public ResponseEntity<List<ReporteClienteResponse>> clientes(
            @PathVariable Long tiendaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.clientes(tiendaId, desde, hasta));
    }

    @Operation(summary = "Reporte de movimientos de inventario",
            description = "Filtros opcionales: tipo, usuarioId y rango de fechas.")
    @GetMapping("/movimientos")
    public ResponseEntity<List<MovimientoInventarioResponse>> movimientos(
            @PathVariable Long tiendaId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.movimientos(tiendaId, tipo, usuarioId, desde, hasta));
    }
}
