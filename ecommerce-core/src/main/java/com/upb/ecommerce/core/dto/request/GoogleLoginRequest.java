package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    /** Opcional: si no viene, se resuelve por email; los usuarios nuevos caen en la tienda por defecto. */
    @JsonProperty("tienda_id")
    private Long tiendaId;

    @NotBlank
    @JsonProperty("id_token")
    private String idToken;
}
