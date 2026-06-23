package com.upb.ecommerce.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.util.Properties;

@Component
public class EmailSetting {

    @Value("${mail.host:smtp.gmail.com}")
    private String host;

    @Value("${mail.smtp.port:587}")
    private int port;

    @Value("${mail.smtp.auth:true}")
    private boolean auth;

    @Value("${mail.smtp.starttls.enable:true}")
    private boolean starttlsEnable;

    @Value("${mail.smtp.protocol:smtp}")
    private String protocol;

    @Value("${mail.smtp.username:}")
    private String username;

    @Value("${mail.smtp.password:}")
    private String password;

    @Value("${mail.smtp.ssl.trust:smtp.gmail.com}")
    private String sslTrust;

    @Value("${mail.smtp.ssl.protocols:TLSv1.2}")
    private String sslProtocols;

    @Bean
    @Lazy
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        Properties mailProperties = new Properties();
        mailProperties.put("mail.smtp.auth", auth);
        mailProperties.put("mail.smtp.starttls.enable", starttlsEnable);
        mailProperties.put("mail.smtp.starttls.required", starttlsEnable);
        mailProperties.put("mail.smtp.ssl.trust", sslTrust);
        mailProperties.put("mail.smtp.ssl.protocols", sslProtocols);

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
