package com.upb.ecommerce.core.dto.response;

import lombok.Data;

@Data
public class VerificarQrPagoResponse {

    private String transactionId;
    private String status;
    private String message;
    private boolean mock;
    private String rawResponse;
}
