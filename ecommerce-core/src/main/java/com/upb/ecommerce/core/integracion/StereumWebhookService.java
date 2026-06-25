package com.upb.ecommerce.core.integracion;

import com.upb.ecommerce.core.service.PedidoService;
import com.upb.ecommerce.data.repository.PagoRepository;
import com.upb.ecommerce.domain.entities.Pago;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Lógica de negocio del callback de pago de Stereum. El controlador ya autenticó el aviso.
 *
 * <p>Stereum envía este callback cuando un cargo cambia de estado. Localiza el {@link Pago}
 * por {@code transactionId} (= {@code Pago.transaccionPasarelaId}) y sincroniza el estado del
 * pago y su {@link Pedido}:
 * <ul>
 *   <li>status de rechazo (CANCELADO/ERROR/...) → pago RECHAZADO (el pedido sigue PENDIENTE).</li>
 *   <li>cualquier otro caso (incluido status null) → pago EXITOSO y pedido PAGADO, porque
 *       Stereum solo emite este aviso cuando el pago se concretó.</li>
 * </ul>
 */
@Slf4j
@Service
public class StereumWebhookService {

    private final PagoRepository pagoRepository;
    private final PedidoService pedidoService;

    public StereumWebhookService(PagoRepository pagoRepository, PedidoService pedidoService) {
        this.pagoRepository = pagoRepository;
        this.pedidoService = pedidoService;
    }

    @Transactional
    public void procesarPagoCallback(StereumPagoCallback callback) {
        String txId = callback.getTransactionId() != null && !callback.getTransactionId().isBlank()
                ? callback.getTransactionId()
                : callback.getAlias();

        if (txId == null || txId.isBlank()) {
            // Sin id de transacción: probablemente un ping de validación de la URL.
            log.info("Callback Stereum sin transactionId — se ignora (posible validación de URL)");
            return;
        }

        Pago pago = pagoRepository.findByTransaccionPasarelaId(txId).orElse(null);
        if (pago == null) {
            log.warn("No se encontró un pago para la transacción Stereum {} — se ignora", txId);
            return;
        }

        // Idempotencia: Stereum puede reenviar el mismo callback.
        if ("EXITOSO".equals(pago.getEstadoPago()) || "RECHAZADO".equals(pago.getEstadoPago())) {
            log.info("El pago {} ya está en estado {} — callback ignorado", pago.getId(), pago.getEstadoPago());
            return;
        }

        if (esRechazo(callback.getStatus())) {
            pago.setEstadoPago("RECHAZADO");
            pagoRepository.save(pago);
            log.info("Pago {} marcado RECHAZADO (status Stereum {})", pago.getId(), callback.getStatus());
            return;
        }

        pago.setEstadoPago("EXITOSO");
        pagoRepository.save(pago);

        // Confirma el pedido: descuenta stock + registra la venta (SALIDA) + lo deja PAGADO.
        pedidoService.confirmarPago(pago.getPedido());
        log.info("Pago {} marcado EXITOSO y venta registrada (callback Stereum {})", pago.getId(), txId);
    }

    private boolean esRechazo(String status) {
        if (status == null || status.isBlank()) {
            return false;
        }
        String s = status.toUpperCase(Locale.ROOT);
        return s.contains("CANCEL") || s.contains("ERROR") || s.contains("RECHAZ") || s.contains("FAIL");
    }
}
