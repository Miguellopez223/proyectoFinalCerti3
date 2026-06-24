package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.ProductoRequest;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Productos", description = "Catálogo interno de productos por tienda (alta/baja/edición requiere rol ADMIN)")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @Operation(summary = "Listar productos de una tienda")
    @GetMapping("/tienda/{tiendaId}")
    public ResponseEntity<List<ProductoResponse>> listarPorTienda(@PathVariable Long tiendaId) {
        return ResponseEntity.ok(productoService.listarPorTienda(tiendaId));
    }

    @Operation(summary = "Listar productos de una tienda (paginado)",
            description = "Devuelve los productos paginados. Parámetros: page, size, sortBy y sortDir (ASC/DESC).")
    @GetMapping("/tienda/{tiendaId}/paginado")
    public ResponseEntity<Page<ProductoResponse>> listarPorTiendaPaginado(
            @PathVariable Long tiendaId,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "sortBy", defaultValue = "nombre") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "ASC") Sort.Direction sortDir) {
        return ResponseEntity.ok(productoService.listarPorTiendaPaginado(
                tiendaId, PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
    }

    @Operation(summary = "Listar productos de una tienda por categoría")
    @GetMapping("/tienda/{tiendaId}/categoria/{categoriaId}")
    public ResponseEntity<List<ProductoResponse>> listarPorCategoria(@PathVariable Long tiendaId,
                                                                     @PathVariable Long categoriaId) {
        return ResponseEntity.ok(productoService.listarPorCategoria(tiendaId, categoriaId));
    }

    @Operation(summary = "Obtener un producto por su id dentro de una tienda")
    @GetMapping("/tienda/{tiendaId}/{productoId}")
    public ResponseEntity<ProductoResponse> obtenerPorId(@PathVariable Long tiendaId,
                                                         @PathVariable Long productoId) {
        return ResponseEntity.ok(productoService.obtenerPorId(tiendaId, productoId));
    }

    @Operation(summary = "Crear un producto", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ProductoResponse> crear(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productoService.crear(request));
    }

    @Operation(summary = "Actualizar un producto", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ProductoResponse> actualizar(@PathVariable Long id,
                                                       @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(productoService.actualizar(id, request));
    }

    @Operation(summary = "Eliminar un producto", description = "Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/tienda/{tiendaId}/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long tiendaId, @PathVariable Long id) {
        productoService.eliminar(tiendaId, id);
        return ResponseEntity.noContent().build();
    }
}
