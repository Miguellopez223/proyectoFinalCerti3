package com.upb.ecommerce.core.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Implementación del método de pago vía Banco Ganadero (patrón Strategy).
 * Se registra con el nombre de bean {@code ganaderoMetodoPago} para poder inyectarla
 * por {@code @Qualifier("ganaderoMetodoPago")}.
 */
@Slf4j
@Service("ganaderoMetodoPago")
public class BancoGanaderoMetodoPagoImpl implements MetodoPagoService {

    @Override
    public String generarQr(BigDecimal monto) {
        log.info("Generando QR de Banco Ganadero por un monto de {}", monto);
        // TODO: integrar con la API real del Banco Ganadero
        return "";
    }
}
