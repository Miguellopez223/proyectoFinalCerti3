package com.upb.ecommerce.core.dto.response;

public record ProductoImportError(
        int fila,
        String campo,
        String mensaje
) {
}
