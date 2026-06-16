package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.request.GenerarQrPagoRequest;
import com.upb.ecommerce.core.dto.request.PagoRequest;
import com.upb.ecommerce.core.dto.response.GenerarQrPagoResponse;
import com.upb.ecommerce.core.dto.response.PagoResponse;
import com.upb.ecommerce.core.dto.response.VerificarQrPagoResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.core.integracion.StereumQrClient;
import com.upb.ecommerce.data.repository.PagoRepository;
import com.upb.ecommerce.data.repository.PedidoRepository;
import com.upb.ecommerce.domain.entities.Pago;
import com.upb.ecommerce.domain.entities.Pedido;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class PagoService {

    private static final Set<String> CURRENCIES = Set.of("USDT", "USDC", "BOB");
    private static final Set<String> NETWORKS = Set.of("POLYGON", "CSL");

    private final PagoRepository pagoRepository;
    private final PedidoRepository pedidoRepository;
    private final StereumQrClient stereumQrClient;

    public PagoService(PagoRepository pagoRepository,
                       PedidoRepository pedidoRepository,
                       StereumQrClient stereumQrClient) {
        this.pagoRepository = pagoRepository;
        this.pedidoRepository = pedidoRepository;
        this.stereumQrClient = stereumQrClient;
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

    public GenerarQrPagoResponse generarQr(GenerarQrPagoRequest request) throws Exception {
        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(() -> new NotDataFoundException("Pedido no encontrado"));
        validarPedidoPagable(pedido);
        validarRequestQr(request);

        GenerarQrPagoResponse response = stereumQrClient.generarQr(request, pedido.getTotal());

        Pago pago = pagoRepository.findByTransaccionPasarelaId(response.getTransactionId())
                .orElseGet(() -> pagoRepository.findFirstByPedidoIdAndMetodoOrderByIdDesc(pedido.getId(), "QR")
                        .filter(existing -> "PENDIENTE".equalsIgnoreCase(existing.getEstadoPago()))
                        .orElseGet(Pago::new));

        pago.setPedido(pedido);
        pago.setMetodo("QR");
        pago.setTransaccionPasarelaId(response.getTransactionId());
        pago.setMonto(pedido.getTotal());
        pago.setEstadoPago(normalizarEstadoPago(response.getStatus()));
        pago = pagoRepository.save(pago);

        response.setPagoId(pago.getId());
        return response;
    }

    @Transactional
    public VerificarQrPagoResponse verificarQr(String transactionId) throws Exception {
        VerificarQrPagoResponse response = stereumQrClient.verificarQr(transactionId);

        pagoRepository.findByTransaccionPasarelaId(transactionId).ifPresent(pago -> {
            String estadoPago = normalizarEstadoPago(response.getStatus());
            pago.setEstadoPago(estadoPago);
            pagoRepository.save(pago);

            if ("EXITOSO".equals(estadoPago)) {
                Pedido pedido = pago.getPedido();
                pedido.setEstadoPedido("PAGADO");
                pedidoRepository.save(pedido);
            }
        });

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

    private void validarRequestQr(GenerarQrPagoRequest request) {
        String currency = upper(request.getCurrency());
        String network = upper(request.getNetwork());
        String country = upper(request.getCountry());

        if (!"BO".equals(country)) {
            throw new OperationException("Solo se soporta country BO para esta integracion");
        }
        if (!CURRENCIES.contains(currency)) {
            throw new OperationException("Currency no soportada: " + request.getCurrency());
        }
        if (!NETWORKS.contains(network)) {
            throw new OperationException("Network no soportada: " + request.getNetwork());
        }
        if (request.getReservationValidityTime() == null || request.getReservationValidityTime() < 1
                || request.getReservationValidityTime() > 60) {
            throw new OperationException("reservationValidityTime debe estar entre 1 y 60 minutos");
        }
        if ("POLYGON".equals(network) && !Set.of("USDT", "USDC").contains(currency)) {
            throw new OperationException("POLYGON solo soporta USDT o USDC");
        }
        if ("CSL".equals(network) && !"BOB".equals(currency)) {
            throw new OperationException("CSL solo soporta BOB");
        }
    }

    private String normalizarEstadoPago(String status) {
        if (status == null || status.isBlank()) {
            return "PENDIENTE";
        }

        return switch (upper(status)) {
            case "PAGADO", "PAID", "EXITOSO", "COMPLETED" -> "EXITOSO";
            case "CANCELADO", "CANCELED", "CANCELLED", "RECHAZADO", "ERROR", "FAILED" -> "RECHAZADO";
            default -> "PENDIENTE";
        };
    }

    private String upper(String value) {
        return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
    }
}
