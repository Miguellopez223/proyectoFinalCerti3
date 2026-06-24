package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    /** Opcional: si no viene, el usuario se resuelve por email (login solo con credenciales). */
    @JsonProperty("tienda_id")
    private Long tiendaId;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;
}
