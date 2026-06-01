package com.upb.ecommerce.core.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GenerarQrPagoRequest {

    @NotNull
    private Long pedidoId;

    @NotBlank
    private String country;

    @NotBlank
    private String currency;

    @NotBlank
    private String network;

    @NotBlank
    private String chargeReason;

    private String callback;

    private Integer reservationValidityTime = 10;

    @NotBlank
    private String customerName;

    @NotBlank
    private String customerLastname;

    @NotBlank
    private String customerDocumentNumber;

    private String customerEmail;

    private String customerPhone;
}
