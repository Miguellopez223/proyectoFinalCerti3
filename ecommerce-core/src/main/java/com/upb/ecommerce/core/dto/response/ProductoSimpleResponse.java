package com.upb.ecommerce.core.dto.response;

import com.upb.ecommerce.domain.entities.Producto;

import java.math.BigDecimal;
// -- PREGUNTA 5 --
// DTO que solo devuelve los campos que el cliente necesita ver.
// Asi NO se expone la entidad Producto completa
public class ProductoSimpleResponse {

    private Long id;
    private String nombre;
    private BigDecimal precio;
    private Integer stock;

    // convierte una entidad Producto en este DTO simple.
    public static ProductoSimpleResponse desde(Producto p) {
        ProductoSimpleResponse dto = new ProductoSimpleResponse();
        dto.id = p.getId();
        dto.nombre = p.getNombre();
        dto.precio = p.getPrecio();
        dto.stock = p.getStock();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }
}
