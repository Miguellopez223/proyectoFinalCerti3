package com.upb.ecommerce.api.controller;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upb.ecommerce.core.dto.request.Notificacion;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.core.integracion.StereumQrClient;
import com.upb.ecommerce.core.service.PagoService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stereum")
public class StereumController {

    private final PagoService pagoService;
    private final StereumQrClient stereumQrClient;

    public StereumController(PagoService pagoService,
                             StereumQrClient stereumQrClient) {
        this.pagoService = pagoService;
        this.stereumQrClient = stereumQrClient;
    }

    @PostMapping(value = "/outbound",
            produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> outbound(
            @RequestHeader("X-Signature") String signature,
            @RequestHeader("X-tiempo") long tiempo,
            @RequestBody String body) throws Exception {

        stereumQrClient.validarWebhook(signature, tiempo, body);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        Notificacion request = objectMapper.readValue(body, Notificacion.class);

        if ("webhooks.test".equalsIgnoreCase(request.notificationType())) {
            return ResponseEntity.ok().build();
        }

        if (!"transactions.outbound".equalsIgnoreCase(request.notificationType())) {
            throw new OperationException("No corresponde a este metodo la notificacion");
        }

        pagoService.procesarNotificacionStereum(request);
        return ResponseEntity.ok().build();
    }
}
