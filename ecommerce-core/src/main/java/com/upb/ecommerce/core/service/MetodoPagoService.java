package com.upb.ecommerce.core.service;

import java.math.BigDecimal;

/**
 * Patrón Strategy para los métodos de pago (réplica del patrón del docente, proyecto eventop).
 *
 * <p>Cada proveedor de pago implementa esta interfaz y se registra como un bean con un nombre
 * distinto ({@code @Service("...")}). El llamador elige la implementación concreta inyectándola
 * por {@code @Qualifier}, sin acoplarse a una clase concreta. Así se pueden añadir nuevos
 * proveedores sin tocar el código cliente.
 *
 * @see BancoGanaderoMetodoPagoImpl
 * @see StereumMetodoPagoImpl
 */
public interface MetodoPagoService {

    /**
     * Genera el QR de cobro para el monto indicado.
     *
     * @param monto importe a cobrar.
     * @return representación del QR generado (p. ej. la URL o el contenido del QR).
     */
    String generarQr(BigDecimal monto);
}
