package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.exception.OperationException;

import com.upb.ecommerce.core.dto.request.ActualizarStockProductoAsyncRequest;
import com.upb.ecommerce.core.dto.request.ProductoRequest;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.data.repository.CategoriaRepository;
import com.upb.ecommerce.data.repository.ProductoRepository;
import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.domain.entities.Categoria;
import com.upb.ecommerce.domain.entities.Producto;
import com.upb.ecommerce.domain.entities.Tienda;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository,
                           TiendaRepository tiendaRepository,
                           CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.tiendaRepository = tiendaRepository;
        this.categoriaRepository = categoriaRepository;
    }

    public List<ProductoResponse> listarPorTienda(Long tiendaId) {
        return productoRepository.findByTiendaIdAndEstadoTrue(tiendaId)
                .stream().map(ProductoResponse::fromEntity).toList();
    }

    public Page<ProductoResponse> listarPorTiendaPaginado(Long tiendaId, Pageable pageable) {
        return productoRepository.findByTiendaIdAndEstadoTrue(tiendaId, pageable)
                .map(ProductoResponse::fromEntity);
    }

    public List<ProductoResponse> listarPorCategoria(Long tiendaId, Long categoriaId) {
        return productoRepository.findByTiendaIdAndCategoriaIdAndEstadoTrue(tiendaId, categoriaId)
                .stream().map(ProductoResponse::fromEntity).toList();
    }

    public Page<ProductoResponse> listarPorCategoriaPaginado(Long tiendaId, Long categoriaId, Pageable pageable) {
        return productoRepository.findByTiendaIdAndCategoriaIdAndEstadoTrue(tiendaId, categoriaId, pageable)
                .map(ProductoResponse::fromEntity);
    }

    public ProductoResponse obtenerPorId(Long tiendaId, Long productoId) {
        return ProductoResponse.fromEntity(
                productoRepository.findByIdAndTiendaId(productoId, tiendaId)
                        .orElseThrow(() -> new OperationException("Producto no encontrado")));
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        Tienda tienda = tiendaRepository.findById(request.getTiendaId())
                .orElseThrow(() -> new OperationException("Tienda no encontrada"));

        Producto producto = new Producto();
        producto.setTienda(tienda);
        producto.setNombre(request.getNombre());
        producto.setSlugProducto(request.getSlugProducto());
        producto.setDescripcionLarga(request.getDescripcionLarga());
        producto.setPrecio(request.getPrecio());
        producto.setPrecioCosto(request.getPrecioCosto());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        if (request.getStockMinimo() != null) producto.setStockMinimo(request.getStockMinimo());

        if (request.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new OperationException("Categoría no encontrada"));
            producto.setCategoria(cat);
        }
        return ProductoResponse.fromEntity(productoRepository.save(producto));
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findByIdAndTiendaId(id, request.getTiendaId())
                .orElseThrow(() -> new OperationException("Producto no encontrado"));

        producto.setNombre(request.getNombre());
        producto.setSlugProducto(request.getSlugProducto());
        producto.setDescripcionLarga(request.getDescripcionLarga());
        producto.setPrecio(request.getPrecio());
        producto.setPrecioCosto(request.getPrecioCosto());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        if (request.getStockMinimo() != null) producto.setStockMinimo(request.getStockMinimo());

        if (request.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new OperationException("Categoría no encontrada"));
            producto.setCategoria(cat);
        } else {
            producto.setCategoria(null);
        }
        return ProductoResponse.fromEntity(productoRepository.save(producto));
    }

    @Transactional
    public void eliminar(Long tiendaId, Long id) {
        Producto producto = productoRepository.findByIdAndTiendaId(id, tiendaId)
                .orElseThrow(() -> new OperationException("Producto no encontrado"));
        producto.setEstado(false);
        productoRepository.save(producto);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = NotDataFoundException.class)
    public CompletableFuture<ProductoResponse> actualizarStockAsincrono(Long id,
                                                                        ActualizarStockProductoAsyncRequest request) {
        Producto producto = productoRepository.findByIdAndTiendaId(id, request.getTiendaId())
                .orElseThrow(() -> new NotDataFoundException("Producto no encontrado"));

        producto.setStock(request.getStock());
        Producto actualizado = productoRepository.save(producto);

        return CompletableFuture.completedFuture(ProductoResponse.fromEntity(actualizado));
    }
}
