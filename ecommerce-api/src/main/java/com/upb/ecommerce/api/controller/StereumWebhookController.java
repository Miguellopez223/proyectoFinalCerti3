package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.integracion.StereumPagoCallback;
import com.upb.ecommerce.core.integracion.StereumWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

/**
 * Recibe el callback de pago que Stereum/BISA envía cuando se confirma un cobro por QR.
 * Endpoint <b>público</b> (Stereum no manda JWT).
 *
 * <p>Formato REAL del aviso: un JSON plano con {@code transactionId} + las credenciales
 * {@code username}/{@code password} en el cuerpo (no hay firma por cabeceras). La seguridad
 * se basa en verificar esas credenciales contra las configuradas.
 *
 * <p>TODO (endurecer para producción): cuando se tenga la sección "Seguridad en Webhook" del
 * manual oficial, validar también la firma/contraseña exacta (la {@code password} parece un
 * hash/HMAC en base64) en vez de solo comparar credenciales.
 */
@Tag(name = "Webhook Stereum", description = "Recibe el callback de pago de Stereum. Público; se autentica con username/password del cuerpo")
@Slf4j
@RestController
@RequestMapping("/api/webhooks/stereum")
public class StereumWebhookController {

    private final StereumWebhookService stereumWebhookService;
    private final ObjectMapper objectMapper;

    /** Credenciales esperadas del callback (las que Stereum envía en username/password). */
    @Value("${stereum.webhook.username:}")
    private String expectedUsername;
    @Value("${stereum.webhook.password:}")
    private String expectedPassword;

    public StereumWebhookController(StereumWebhookService stereumWebhookService,
                                    ObjectMapper objectMapper) {
        this.stereumWebhookService = stereumWebhookService;
        this.objectMapper = objectMapper;
    }

    @Operation(summary = "Recibir el callback de pago de Stereum",
            description = "Acepta el JSON plano de Stereum, autentica con username/password del cuerpo y "
                    + "marca el pago/pedido como PAGADO. Responde 200 también al ping de validación de la URL.")
    @PostMapping("/outbound")
    public ResponseEntity<Void> outbound(@RequestBody String body) {
        // Logueamos el cuerpo crudo: clave para depurar callbacks en producción (consola EB → Logs).
        log.info("Callback Stereum recibido: {}", body);

        StereumPagoCallback callback = parsear(body);

        if (!autenticado(callback)) {
            log.warn("Callback Stereum con credenciales inválidas — se rechaza (401)");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales de callback inválidas");
        }

        stereumWebhookService.procesarPagoCallback(callback);
        return ResponseEntity.ok().build();
    }

    /**
     * Autentica el callback comparando las credenciales del cuerpo con las configuradas.
     * - Si no hay {@code stereum.webhook.username} configurado → no se exige (modo abierto).
     * - Si el cuerpo no trae credenciales (p.ej. ping de validación) → se deja pasar; no procesa
     *   pago salvo que haya un transactionId que coincida con un pago real.
     * - La {@code password} solo se compara si se configuró {@code stereum.webhook.password}.
     */
    private boolean autenticado(StereumPagoCallback c) {
        if (expectedUsername == null || expectedUsername.isBlank()) {
            return true;
        }
        if (c.getUsername() == null && c.getPassword() == null) {
            return true;
        }
        boolean userOk = expectedUsername.equals(c.getUsername());
        boolean passOk = expectedPassword == null || expectedPassword.isBlank()
                || expectedPassword.equals(c.getPassword());
        return userOk && passOk;
    }

    private StereumPagoCallback parsear(String body) {
        try {
            return objectMapper.readValue(body, StereumPagoCallback.class);
        } catch (Exception e) {
            log.error("No se pudo parsear el callback de Stereum", e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "JSON inválido");
        }
    }
}
