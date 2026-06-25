package com.upb.ecommerce.core.dto.response;

import java.util.List;

public record ProductoImportResponse(
        int totalFilas,
        int importados,
        int fallidos,
        List<ProductoImportError> errores
) {
}
