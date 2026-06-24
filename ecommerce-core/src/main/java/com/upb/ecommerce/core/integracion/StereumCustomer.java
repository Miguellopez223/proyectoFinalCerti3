package com.upb.ecommerce.core.integracion;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/**
 * Datos del cliente que paga, anidados en el request de create-charge de Stereum.
 * name/lastname/document_number son requeridos para cobros en BOB; email/phone opcionales
 * (no se serializan si son null, gracias a {@code @JsonInclude(NON_NULL)}).
 */
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StereumCustomer {

    private String name;
    private String lastname;

    @JsonProperty("document_number")
    private String documentNumber;

    private String email;
    private String phone;
}
