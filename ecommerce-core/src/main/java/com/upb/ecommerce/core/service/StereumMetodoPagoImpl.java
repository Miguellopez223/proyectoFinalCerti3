package com.upb.ecommerce.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Implementación del método de pago vía Stereum (patrón Strategy). Se registra con el nombre
 * de bean {@code stereumMetodoPago} para inyectarla por {@code @Qualifier("stereumMetodoPago")}.
 *
 * <p>Nota: la integración real con Stereum (generación de QR por HMAC) ya existe en
 * {@code com.upb.ecommerce.core.integracion.StereumService}. Esta clase es la pieza del patrón
 * Strategy; aquí se podría delegar en ese servicio cuando se conecte de verdad.
 */
@Slf4j
@Service("stereumMetodoPago")
public class StereumMetodoPagoImpl implements MetodoPagoService {

    @Override
    public String generarQr(BigDecimal monto) {
        log.info("Generando QR de Stereum por un monto de {}", monto);
        // TODO: delegar en com.upb.ecommerce.core.integracion.StereumService
        return "";
    }
}
