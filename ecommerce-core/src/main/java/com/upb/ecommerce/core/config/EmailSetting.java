package com.upb.ecommerce.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * Construye manualmente el cliente SMTP ({@link JavaMailSender}) a partir de propiedades
 * {@code mail.*} (mismo patrón que el proyecto de referencia del docente), en vez de usar
 * el autoconfigurado por Spring Boot con {@code spring.mail.*}.
 *
 * <p>Las credenciales llegan por variable de entorno (ver application.properties). El bean es
 * {@code @Lazy} y no abre conexión al crearse: solo conecta al SMTP cuando realmente se envía.
 */
@Component
public class EmailSetting {

    @Value("${mail.host}")
    private String host;

    @Value("${mail.smtp.port}")
    private int port;

    @Value("${mail.smtp.auth}")
    private boolean auth;

    @Value("${mail.smtp.starttls.enable}")
    private boolean starttlsEnable;

    @Value("${mail.smtp.protocol}")
    private String protocol;

    @Value("${mail.smtp.username}")
    private String username;

    @Value("${mail.smtp.password}")
    private String password;

    @Bean
    @Lazy
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        Properties mailProperties = new Properties();
        mailProperties.put("mail.smtp.auth", auth);
        mailProperties.put("mail.smtp.starttls.enable", starttlsEnable);
        mailSender.setJavaMailProperties(mailProperties);
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setProtocol(protocol);
        mailSender.setUsername(username);
        mailSender.setPassword(password);
        mailSender.setDefaultEncoding("UTF-8");
        return mailSender;
    }
}
