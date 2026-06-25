package com.upb.ecommerce.api.dto;

public record UploadResponse(
        String url,
        String key,
        String contentType,
        long size
) {
}
