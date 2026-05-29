package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRequest {

    @NotNull
    @JsonProperty("tienda_id")
    private Long tiendaId;

    @JsonProperty("categoria_id")
    private Long categoriaId;

    @NotBlank
    private String nombre;

    @NotBlank
    @JsonProperty("slug_producto")
    private String slugProducto;

    @JsonProperty("descripcion_larga")
    private String descripcionLarga;

    @NotNull
    @Positive
    private BigDecimal precio;

    @JsonProperty("precio_costo")
    private BigDecimal precioCosto;

    @NotNull
    private Integer stock;

    @JsonProperty("stock_minimo")
    private Integer stockMinimo;

    @JsonProperty("imagen_url")
    private String imagenUrl;
}
