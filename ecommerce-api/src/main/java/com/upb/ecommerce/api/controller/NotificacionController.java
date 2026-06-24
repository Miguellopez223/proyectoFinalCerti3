package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Endpoint de prueba para verificar el envío de correos (patrón del docente).
 *
 * <p>Ejemplo: {@code POST /api/notificaciones/prueba?to=rllayus@gmail.com}. Devuelve si el
 * envío fue exitoso o el error de SMTP, para diagnosticar la configuración de Gmail.
 */
@Tag(name = "Notificaciones", description = "Endpoint de prueba para diagnosticar el envío de correos (SMTP). Público")
@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final EmailService emailService;

    public NotificacionController(EmailService emailService) {
        this.emailService = emailService;
    }

    @Operation(summary = "Enviar un correo de prueba",
            description = "Envía un correo de prueba al destinatario indicado (param to) para verificar la configuración SMTP de Gmail.")
    @PostMapping("/prueba")
    public ResponseEntity<Map<String, Object>> prueba(
            @RequestParam(defaultValue = "rllayus@gmail.com") String to) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("destino", to);
        try {
            emailService.enviarPasswordReset(to, "123456");
            resp.put("enviado", true);
            resp.put("mensaje", "Correo de prueba enviado correctamente a " + to);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("enviado", false);
            resp.put("mensaje", "Falló el envío: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(resp);
        }
    }
}
