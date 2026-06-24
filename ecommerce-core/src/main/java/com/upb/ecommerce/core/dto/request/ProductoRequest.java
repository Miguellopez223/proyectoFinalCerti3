package com.upb.ecommerce.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProductoRequest {

    @NotNull
    private Long tiendaId;

    private Long categoriaId;

    private Long unidadMedidaId;

    @NotBlank
    private String nombre;

    @NotBlank
    private String slugProducto;

    private String descripcionLarga;

    @NotNull
    @Positive
    private BigDecimal precio;

    private BigDecimal precioCosto;

    /** Precio de oferta (opcional). Si se envía null, se quita el descuento. */
    private BigDecimal precioOferta;

    /** Inicio/fin opcionales de la oferta (flash sale). */
    private LocalDateTime ofertaInicio;
    private LocalDateTime ofertaFin;

    @NotNull
    private Integer stock;

    private Integer stockMinimo;

    private String imagenUrl;
}
