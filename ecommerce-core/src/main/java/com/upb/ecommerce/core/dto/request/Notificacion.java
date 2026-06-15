package com.upb.ecommerce.core.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record Notificacion(
        @JsonAlias({"notification_type", "notificationType"})
        String notificationType,
        @JsonAlias({"transaction_id", "transactionId", "id"})
        String transactionId,
        @JsonAlias({"transaction_status", "transactionStatus", "status", "state"})
        String transactionStatus,
        Data data
) {

    public String resolvedTransactionId() {
        if (transactionId != null && !transactionId.isBlank()) {
            return transactionId;
        }
        return data != null ? data.transactionId() : null;
    }

    public String resolvedTransactionStatus() {
        if (transactionStatus != null && !transactionStatus.isBlank()) {
            return transactionStatus;
        }
        return data != null ? data.transactionStatus() : null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Data(
            @JsonAlias({"transaction_id", "transactionId", "id"})
            String transactionId,
            @JsonAlias({"transaction_status", "transactionStatus", "status", "state"})
            String transactionStatus
    ) {
    }
}
