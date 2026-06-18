package com.upb.ecommerce.core.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final MailContentBuilder mailContentBuilder;

    @Value("${mail.smtp.username:}")
    private String remitente;

    public EmailService(JavaMailSender mailSender, MailContentBuilder mailContentBuilder) {
        this.mailSender = mailSender;
        this.mailContentBuilder = mailContentBuilder;
    }

    /** Recordatorio al cliente de que dejó productos en su carrito sin completar la compra. */
    public void enviarRecordatorioCarrito(String destino, String nombreCliente,
                                          int cantidadItems, BigDecimal totalEstimado) {
        String html = mailContentBuilder.buildCarritoAbandonado(nombreCliente, cantidadItems, totalEstimado);
        enviarHtml(destino, "¡Te quedaron productos en tu carrito!", html);
    }

    /** Envía las credenciales (contraseña en texto plano) al usuario recién creado por un admin. */
    public void enviarContrasena(String destino, String password) {
        String html = mailContentBuilder.sendPassword(password);
        enviarHtml(destino, "Tus credenciales de acceso", html);
    }

    /** Envía un mensaje genérico con el template base. */
    public void enviarMensaje(String destino, String asunto, String mensaje) {
        String html = mailContentBuilder.build(mensaje);
        enviarHtml(destino, asunto, html);
    }

    private void enviarHtml(String destino, String asunto, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            if (remitente != null && !remitente.isBlank()) {
                helper.setFrom(remitente);
            }
            helper.setTo(destino);
            helper.setSubject(asunto);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al construir el mensaje de correo: " + e.getMessage(), e);
        }
    }
}
