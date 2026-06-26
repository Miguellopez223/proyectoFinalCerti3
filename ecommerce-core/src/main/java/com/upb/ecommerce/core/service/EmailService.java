package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.config.MailContentBuilder;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Envío de correos electrónicos en HTML. Usa el {@link JavaMailSender} creado por
 * {@link com.upb.ecommerce.core.config.EmailSetting} y construye el cuerpo con plantillas
 * Thymeleaf vía {@link MailContentBuilder} (mismo patrón del proyecto de referencia del docente).
 */
@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final MailContentBuilder mailContentBuilder;

    @Value("${mail.smtp.from-mail:}")
    private String remitente;
    @Value("${app.url-frontend:http://localhost:5173}")
    private String urlFrontend;
    @Value("${app.tienda-nombre:Comercio1}")
    private String tiendaNombre;

    public EmailService(JavaMailSender mailSender, MailContentBuilder mailContentBuilder) {
        this.mailSender = mailSender;
        this.mailContentBuilder = mailContentBuilder;
    }

    /**
     * Envío genérico de un correo HTML a partir de la plantilla {@code email/notificacion}.
     * Lanza una excepción si el envío falla (el llamador decide cómo manejarlo).
     */
    public void enviarNotificacion(String destino, String asunto, String titulo, String saludo,
                                   String cuerpoHtml, String botonTexto, String botonUrl, String nota) {
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8"); // true = multipart (HTML)
            if (remitente != null && !remitente.isBlank()) {
                helper.setFrom(remitente);
            }
            helper.setTo(destino);
            helper.setSubject(asunto);
            String html = mailContentBuilder.construir(
                    tiendaNombre, titulo, saludo, cuerpoHtml, botonTexto, botonUrl, nota);
            helper.setText(html, true); // true = el cuerpo es HTML
            mailSender.send(mime);
            log.info("Correo '{}' enviado a {}", asunto, destino);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo '{}' a {}: {}", asunto, destino, e.getMessage());
            throw new RuntimeException("No se pudo enviar el correo: " + e.getMessage(), e);
        }
    }

    // --- PREGUNTA 6 ---
    // Lo usa el job que cancela pedidos: asunto "Pregunta 6-A", mensaje "Pedido cancelado".
    public void enviarCorreoSimple(String destino, String asunto, String mensaje) {
        SimpleMailMessage correo = new SimpleMailMessage();
        if (remitente != null && !remitente.isBlank()) {
            correo.setFrom(remitente);
        }
        correo.setTo(destino);
        correo.setSubject(asunto);
        correo.setText(mensaje);
        mailSender.send(correo);
        log.info("Correo simple '{}' enviado a {}", asunto, destino);
    }

    /** Recordatorio al cliente de que dejó productos en su carrito (ahora en HTML). */
    public void enviarRecordatorioCarrito(String destino, String nombreCliente,
                                          int cantidadItems, BigDecimal totalEstimado) {
        String saludo = "Hola " + nombreCliente + ",";
        String cuerpo = "Notamos que dejaste <strong>" + cantidadItems + " producto(s)</strong> en tu carrito " +
                "por un total estimado de <strong>Bs " + totalEstimado + "</strong> sin completar la compra.<br><br>" +
                "¡Todavía estás a tiempo! Vuelve a la tienda y finaliza tu pedido antes de que se agoten.";
        enviarNotificacion(destino, "¡Te quedaron productos en tu carrito!",
                "Tu carrito te espera 🛒", saludo, cuerpo,
                "Volver a mi carrito", urlFrontend + "/tienda/carrito",
                "Si ya completaste tu compra, ignora este mensaje.");
    }

    /** Restablecimiento / envío de contraseña (réplica del patrón del docente, en HTML). */
    public void enviarPasswordReset(String destino, String password) {
        String cuerpo = "Recibimos una solicitud para restablecer tu contraseña. " +
                "Tu nueva contraseña temporal es:<br><br>" +
                "<span style=\"display:inline-block; font-family:'Courier New',monospace; font-size:20px; " +
                "font-weight:700; letter-spacing:3px; color:#0e7490; background:#f0fdfa; " +
                "padding:10px 18px; border-radius:6px;\">" + password + "</span>";
        enviarNotificacion(destino, "Restablecimiento de contraseña",
                "Restablece tu contraseña", "Hola,", cuerpo,
                "Ir a iniciar sesión", urlFrontend + "/login",
                "Por seguridad, cambia esta contraseña apenas inicies sesión. " +
                        "Si no solicitaste este cambio, ignora este correo.");
    }
}
