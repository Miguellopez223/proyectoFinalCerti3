package com.upb.ecommerce.core.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class GenerarQrPagoResponse {

    private Long pagoId;
    private Long pedidoId;
    private BigDecimal monto;
    private String currency;
    private String network;
    private String transactionId;
    private String status;
    private String qrBase64;
    private String collectingAccount;
    private Boolean onMainNet;
    private Long expirationTime;
    private String message;
    private boolean mock;
    private String rawResponse;
}
