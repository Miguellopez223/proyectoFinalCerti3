package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.response.BusquedaResponse;
import com.upb.ecommerce.core.dto.response.CategoriaPopularResponse;
import com.upb.ecommerce.core.dto.response.HomeResponse;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.service.MarketplaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints públicos (sin login) del marketplace: búsqueda cross-store, categorías populares,
 * secciones del home y recomendados.
 */
@Tag(name = "Marketplace", description = "Búsqueda y descubrimiento de productos de todas las tiendas. Público, sin login")
@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @Operation(summary = "Buscar productos por nombre/categoría/tienda (coincidencia sin tildes ni mayúsculas)",
            description = "Devuelve productos paginados + facetas de conteo por tienda. orden: relevante, "
                    + "reciente, precio_asc, precio_desc, descuento.")
    @GetMapping("/buscar")
    public ResponseEntity<BusquedaResponse> buscar(
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "tiendaId", required = false) Long tiendaId,
            @RequestParam(value = "orden", required = false, defaultValue = "relevante") String orden,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return ResponseEntity.ok(marketplaceService.buscar(q, tiendaId, orden, page, size));
    }

    @Operation(summary = "Sugerencias del buscador (typeahead)")
    @GetMapping("/sugerencias")
    public ResponseEntity<List<ProductoResponse>> sugerencias(
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "limit", defaultValue = "6") int limit) {
        return ResponseEntity.ok(marketplaceService.sugerencias(q, limit));
    }

    @Operation(summary = "Categorías más populares (por cantidad de productos)")
    @GetMapping("/categorias-populares")
    public ResponseEntity<List<CategoriaPopularResponse>> categoriasPopulares(
            @RequestParam(value = "limit", defaultValue = "12") int limit) {
        return ResponseEntity.ok(marketplaceService.categoriasPopulares(limit));
    }

    @Operation(summary = "Secciones del home: más buscados, ofertas, destacados y tiendas")
    @GetMapping("/home")
    public ResponseEntity<HomeResponse> home() {
        return ResponseEntity.ok(marketplaceService.home());
    }

    @Operation(summary = "Productos recomendados para un producto (misma categoría)")
    @GetMapping("/recomendados/{productoId}")
    public ResponseEntity<List<ProductoResponse>> recomendados(
            @PathVariable Long productoId,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(marketplaceService.recomendados(productoId, limit));
    }
}
