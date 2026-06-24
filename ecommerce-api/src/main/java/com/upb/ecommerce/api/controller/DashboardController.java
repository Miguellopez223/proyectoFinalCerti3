package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.response.DashboardResponse;
import com.upb.ecommerce.core.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Panel de métricas rápidas de la tienda. Solo accesible por ADMIN.
 */
@Tag(name = "Dashboard", description = "Panel de métricas rápidas de la tienda. Solo ADMIN")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Obtener las métricas del dashboard de una tienda", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<DashboardResponse> obtener(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(dashboardService.obtener(tiendaId));
    }
}
