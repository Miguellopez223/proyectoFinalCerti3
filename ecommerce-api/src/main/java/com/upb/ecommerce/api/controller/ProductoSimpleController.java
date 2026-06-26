package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.response.ProductoSimpleResponse;
import com.upb.ecommerce.core.service.ProductoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// --- PREGUNTA 5 ---

// Endpoint: GET /api/v1/productos
@RestController
@RequestMapping("/api/v1/productos")
public class ProductoSimpleController {

    private final ProductoService productoService;

    public ProductoSimpleController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // Ejemplos de uso:
    //   GET /api/v1/productos -> primera pagina, todos los productos
    //   GET /api/v1/productos?nombre=camisa -> filtra por nombre
    //   GET /api/v1/productos?page=0&size=5 -> paginacion (pagina 0, 5 por pagina)
    //   GET /api/v1/productos?nombre=camisa&page=1  -> filtro + paginacion juntos
    @GetMapping
    public Page<ProductoSimpleResponse> listar(
            // Parametro de filtro OPCIONAL (required = false)
            @RequestParam(value = "nombre", required = false) String nombre,
            // Parametros de PAGINACION con valores por defecto.
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        // Construyo el Pageable (que pagina quiero y de que tamano).
        Pageable pageable = PageRequest.of(page, size);

        return productoService.listarSimple(nombre, pageable);
    }
}
