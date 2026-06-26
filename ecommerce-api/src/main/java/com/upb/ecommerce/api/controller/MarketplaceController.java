package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.response.BusquedaResponse;
import com.upb.ecommerce.core.dto.response.CategoriaPopularResponse;
import com.upb.ecommerce.core.dto.response.HomeResponse;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.service.MarketplaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
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

    @Operation(summary = "Buscar productos con filtros opcionales y paginación",
            description = "Devuelve productos activos paginados. Filtros opcionales: nombre, categoría, "
                    + "rango de precio (precioMin/precioMax) y disponibilidad en stock. "
                    + "Paginación: ?page=0&size=10&sort=nombre,asc")
    @GetMapping("/productos")
    public ResponseEntity<Page<ProductoResponse>> buscarPaginado(
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "categoriaId", required = false) Long categoriaId,
            @RequestParam(value = "precioMin", required = false) BigDecimal precioMin,
            @RequestParam(value = "precioMax", required = false) BigDecimal precioMax,
            @RequestParam(value = "enStock", required = false) Boolean enStock,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "nombre:asc") String sort) {
        Sort.Order[] orders = parseSort(sort);
        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, Sort.by(orders));
        return ResponseEntity.ok(marketplaceService.buscarPaginado(nombre, categoriaId, precioMin, precioMax, enStock, pageable));
    }

    /**
     * Parsea el parámetro sort en formato "campo:dirección" (ej: "nombre:asc", "precio:desc").
     * Soporta múltiples ordenamientos: "nombre:asc,precio:desc"
     */
    private Sort.Order[] parseSort(String sortParam) {
        if (sortParam == null || sortParam.isEmpty()) {
            return new Sort.Order[]{Sort.Order.asc("nombre")};
        }
        String[] sorts = sortParam.split(",");
        Sort.Order[] orders = new Sort.Order[sorts.length];
        for (int i = 0; i < sorts.length; i++) {
            String[] parts = sorts[i].trim().split(":");
            String field = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            orders[i] = new Sort.Order(direction, field);
        }
        return orders;
    }

    @Operation(summary = "Sugerencias del buscador (typeahead)")
    @GetMapping("/sugerencias")
    public ResponseEntity<List<ProductoResponse>> sugerencias(
            @RequestParam(value = "q", required = false, defaultValue = "") String q,
            @RequestParam(value = "limit", defaultValue = "6") int limit) {
        return ResponseEntity.ok(marketplaceService.sugerencias(q, limit));
    }

    @Operation(summary = "Obtener un producto por id (detalle público del marketplace)")
    @GetMapping("/producto/{id}")
    public ResponseEntity<ProductoResponse> producto(@PathVariable Long id) {
        return ResponseEntity.ok(marketplaceService.obtenerProducto(id));
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
