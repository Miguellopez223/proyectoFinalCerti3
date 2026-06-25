package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.request.PagoRequest;
import com.upb.ecommerce.core.dto.response.PagoResponse;
import com.upb.ecommerce.core.dto.response.VerificarQrPagoResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.core.integracion.StereumCreateChargeResponse;
import com.upb.ecommerce.core.integracion.StereumService;
import com.upb.ecommerce.data.repository.PagoRepository;
import com.upb.ecommerce.data.repository.PedidoRepository;
import com.upb.ecommerce.domain.entities.Pago;
import com.upb.ecommerce.domain.entities.Pedido;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final StereumService stereumService;
    private final PedidoService pedidoService;

    public PagoService(PagoRepository pagoRepository,
                       PedidoRepository pedidoRepository,
                       StereumService stereumService,
                       PedidoService pedidoService) {
        this.pagoRepository = pagoRepository;
        this.pedidoRepository = pedidoRepository;
        this.stereumService = stereumService;
        this.pedidoService = pedidoService;
    }

    public List<PagoResponse> listarPorPedido(Long pedidoId) {
        return pagoRepository.findByPedidoId(pedidoId)
                .stream().map(PagoResponse::fromEntity).toList();
    }

    @Transactional
    public PagoResponse registrar(PagoRequest request) {
        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado"));
        validarPedidoPagable(pedido);

        if (request.getMonto().compareTo(pedido.getTotal()) != 0) {
            throw new OperationException("El monto (" + request.getMonto()
                    + ") no coincide con el total del pedido (" + pedido.getTotal() + ")");
        }

        Pago pago = new Pago();
        pago.setPedido(pedido);
        pago.setMetodo(request.getMetodo());
        pago.setTransaccionPasarelaId(request.getTransaccionPasarelaId());
        pago.setMonto(request.getMonto());
        pago.setEstadoPago("EXITOSO");

        pedido.setEstadoPedido("PAGADO");
        pedidoRepository.save(pedido);

        return PagoResponse.fromEntity(pagoRepository.save(pago));
    }

    /**
     * Verifica activamente el estado de un cargo contra Stereum
     * ({@code GET /transactions/{id}/verify}) y sincroniza el pago/pedido local.
     * Sirve como respaldo del webhook (p.ej. el boton "ya pagué").
     */
    @Transactional
    public VerificarQrPagoResponse verificarQr(String transactionId) throws Exception {
        StereumCreateChargeResponse stereum = stereumService.verificarCargo(transactionId);
        String estadoPago = normalizarEstadoPago(stereum.getTransactionStatus());

        pagoRepository.findByTransaccionPasarelaId(transactionId).ifPresent(pago -> {
            // Idempotencia: no reabrir un pago ya cerrado.
            if ("EXITOSO".equals(pago.getEstadoPago()) || "RECHAZADO".equals(pago.getEstadoPago())) {
                return;
            }
            pago.setEstadoPago(estadoPago);
            pagoRepository.save(pago);

            if ("EXITOSO".equals(estadoPago)) {
                // Descuenta stock + registra la venta + deja el pedido PAGADO (idempotente).
                pedidoService.confirmarPago(pago.getPedido());
            }
        });

        VerificarQrPagoResponse response = new VerificarQrPagoResponse();
        response.setTransactionId(transactionId);
        response.setStatus(stereum.getTransactionStatus());
        response.setMessage("Estado normalizado: " + estadoPago);
        response.setMock(false);
        response.setRawResponse(String.valueOf(stereum));
        return response;
    }

    private void validarPedidoPagable(Pedido pedido) {
        String estado = pedido.getEstadoPedido();
        if ("PAGADO".equalsIgnoreCase(estado)) {
            throw new OperationException("El pedido ya fue pagado");
        }
        if ("CANCELADO".equalsIgnoreCase(estado)) {
            throw new OperationException("No se puede generar pagos para un pedido cancelado");
        }
    }

    private String normalizarEstadoPago(String status) {
        if (status == null || status.isBlank()) {
            return "PENDIENTE";
        }

        return switch (status.trim().toUpperCase(Locale.ROOT)) {
            case "PAGADO", "PAID", "EXITOSO", "COMPLETED" -> "EXITOSO";
            case "CANCELADO", "CANCELED", "CANCELLED", "RECHAZADO", "ERROR", "FAILED" -> "RECHAZADO";
            default -> "PENDIENTE";
        };
    }
}
