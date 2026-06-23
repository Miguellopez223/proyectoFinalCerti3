package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotNull
    @JsonProperty("tienda_id")
    private Long tiendaId;

    @NotBlank
    @JsonProperty("id_token")
    private String idToken;
}
