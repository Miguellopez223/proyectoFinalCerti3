package com.upb.ecommerce.core.integracion;

import com.upb.ecommerce.core.dto.request.GenerarQrPagoRequest;
import com.upb.ecommerce.core.dto.response.GenerarQrPagoResponse;
import com.upb.ecommerce.core.dto.response.VerificarQrPagoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class StereumQrClient {

    @Value("${stereum.url-base:https://api.stereum.tech}")
    private String urlBase;
    @Value("${stereum.api-key:}")
    private String apiKey;
    @Value("${stereum.api-key-header:x-api-key}")
    private String apiKeyHeader;
    @Value("${stereum.connect-timeout:10000}")
    private int connectTimeout = 10000;
    @Value("${stereum.read-timeout:40000}")
    private int readTimeout = 40000;
    @Value("${stereum.mock-enabled:true}")
    private boolean mockEnabled;

    public GenerarQrPagoResponse generarQr(GenerarQrPagoRequest request, BigDecimal monto) throws Exception {
        if (mockEnabled) {
            log.info("StereumQrClient en modo mock para pedido {}", request.getPedidoId());
            return mockGeneracion(request, monto);
        }

        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad stereum.url-base es requerida para generar QR");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("La propiedad stereum.api-key es requerida para generar QR real");
        }

        String endpoint = urlBase + "/api/v1/transactions/create-charge";
        Map<String, Object> body = buildChargeBody(request, monto);
        log.info("StereumQrClient consumiendo POST {}", endpoint);

        try {
            ResponseEntity<Map<String, Object>> response = create().post()
                    .uri(endpoint)
                    .headers(this::addApiKey)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .retrieve()
                    .toEntity(new ParameterizedTypeReference<>() {});

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new Exception("Se genero error al crear cargo QR");
            }

            log.info("StereumQrClient respuesta {}", response.getStatusCode().value());
            return mapGeneracion(request.getPedidoId(), monto, request.getCurrency(), request.getNetwork(), response.getBody(), false);
        } catch (HttpClientErrorException.Forbidden e) {
            log.error("Stereum rechazo el acceso al endpoint QR", e);
            throw new IllegalStateException("La API Key no tiene permiso para create-charge en Stereum", e);
        } catch (Exception e) {
            log.error("Error consumiendo generacion QR", e);
            throw e;
        }
    }

    public VerificarQrPagoResponse verificarQr(String transactionId) throws Exception {
        if (mockEnabled) {
            log.info("StereumQrClient verificando en modo mock {}", transactionId);
            VerificarQrPagoResponse response = new VerificarQrPagoResponse();
            response.setTransactionId(transactionId);
            response.setStatus("PENDING");
            response.setMessage("Verificacion simulada en modo mock");
            response.setMock(true);
            response.setRawResponse("{}");
            return response;
        }

        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad stereum.url-base es requerida para verificar QR");
        }
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("La propiedad stereum.api-key es requerida para verificar QR real");
        }

        String endpoint = urlBase + "/api/v1/transactions/" + transactionId + "/verify";
        log.info("StereumQrClient consumiendo GET {}", endpoint);

        try {
            ResponseEntity<Map<String, Object>> response = create().get()
                    .uri(endpoint)
                    .headers(this::addApiKey)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toEntity(new ParameterizedTypeReference<>() {});

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new Exception("Se genero error al verificar cargo QR");
            }

            log.info("StereumQrClient respuesta {}", response.getStatusCode().value());
            return mapVerificacion(transactionId, response.getBody(), false);
        } catch (HttpClientErrorException.Forbidden e) {
            log.warn("Stereum rechazo el acceso a verify para {}", transactionId);
            VerificarQrPagoResponse response = new VerificarQrPagoResponse();
            response.setTransactionId(transactionId);
            response.setStatus("PERMISSION_DENIED");
            response.setMessage("La API Key no tiene permiso para el endpoint verify de Stereum");
            response.setMock(false);
            response.setRawResponse(e.getResponseBodyAsString());
            return response;
        } catch (Exception e) {
            log.error("Error verificando cargo QR", e);
            throw e;
        }
    }

    private Map<String, Object> buildChargeBody(GenerarQrPagoRequest request, BigDecimal monto) {
        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("name", request.getCustomerName());
        customer.put("lastname", request.getCustomerLastname());
        customer.put("document_number", request.getCustomerDocumentNumber());
        customer.put("email", request.getCustomerEmail());
        customer.put("phone", request.getCustomerPhone());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("country", request.getCountry());
        body.put("amount", monto.toPlainString());
        body.put("currency", request.getCurrency());
        body.put("network", request.getNetwork());
        body.put("idempotency_key", UUID.randomUUID().toString());
        body.put("charge_reason", request.getChargeReason());
        body.put("callback", request.getCallback());
        body.put("reservation_validity_time", String.valueOf(
                request.getReservationValidityTime() != null ? request.getReservationValidityTime() : 10));
        body.put("customer", customer);
        return body;
    }

    private GenerarQrPagoResponse mockGeneracion(GenerarQrPagoRequest request, BigDecimal monto) {
        GenerarQrPagoResponse response = new GenerarQrPagoResponse();
        response.setPedidoId(request.getPedidoId());
        response.setMonto(monto);
        response.setCurrency(request.getCurrency());
        response.setNetwork(request.getNetwork());
        response.setTransactionId("mock-" + UUID.randomUUID());
        response.setStatus("PENDING");
        response.setQrBase64("");
        response.setCollectingAccount("mock-wallet-" + request.getPedidoId());
        response.setOnMainNet(false);
        response.setExpirationTime(System.currentTimeMillis() + 600_000L);
        response.setMessage("QR simulado. Activa stereum.mock-enabled=false cuando te den permiso real.");
        response.setMock(true);
        response.setRawResponse(buildChargeBody(request, monto).toString());
        return response;
    }

    private GenerarQrPagoResponse mapGeneracion(Long pedidoId, BigDecimal monto, String currency, String network,
                                                Map<String, Object> raw, boolean mock) {
        GenerarQrPagoResponse response = new GenerarQrPagoResponse();
        response.setPedidoId(pedidoId);
        response.setMonto(monto);
        response.setCurrency(currency);
        response.setNetwork(network);
        response.setTransactionId(firstText(raw, "id", "transaction_id", "transactionId"));
        response.setStatus(firstText(raw, "transaction_status", "status", "state"));
        response.setQrBase64(firstText(raw, "qr_base64", "qr", "qr_content"));
        response.setCollectingAccount(firstText(raw, "collecting_account", "wallet"));
        response.setOnMainNet(firstBoolean(raw, "on_main_net", "onMainNet"));
        response.setExpirationTime(firstLong(raw, "expiration_time", "expires_at"));
        response.setMessage(firstText(raw, "message", "detail"));
        response.setMock(mock);
        response.setRawResponse(String.valueOf(raw));
        return response;
    }

    private VerificarQrPagoResponse mapVerificacion(String transactionId, Map<String, Object> raw, boolean mock) {
        VerificarQrPagoResponse response = new VerificarQrPagoResponse();
        response.setTransactionId(transactionId);
        response.setStatus(firstText(raw, "transaction_status", "status", "state"));
        response.setMessage(firstText(raw, "message", "detail"));
        response.setMock(mock);
        response.setRawResponse(String.valueOf(raw));
        return response;
    }

    @SuppressWarnings("unchecked")
    private String firstText(Map<String, Object> root, String... fieldNames) {
        if (root == null) {
            return null;
        }
        for (String fieldName : fieldNames) {
            Object direct = root.get(fieldName);
            if (direct != null) {
                return String.valueOf(direct);
            }
            Object data = root.get("data");
            if (data instanceof Map<?, ?> dataMap) {
                Object nested = ((Map<String, Object>) dataMap).get(fieldName);
                if (nested != null) {
                    return String.valueOf(nested);
                }
            }
        }
        return null;
    }

    private Boolean firstBoolean(Map<String, Object> root, String... fieldNames) {
        String value = firstText(root, fieldNames);
        return value != null ? Boolean.valueOf(value) : null;
    }

    private Long firstLong(Map<String, Object> root, String... fieldNames) {
        String value = firstText(root, fieldNames);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory clientHttpRequestFactory = new SimpleClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        clientHttpRequestFactory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(clientHttpRequestFactory).build();
    }

    private void addApiKey(HttpHeaders headers) {
        headers.set(apiKeyHeader, apiKey);
    }
}
