package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class ActualizarStockProductoAsyncRequest {

    @NotNull
    @JsonProperty("tienda_id")
    private Long tiendaId;

    @NotNull
    @PositiveOrZero
    private Integer stock;
}
