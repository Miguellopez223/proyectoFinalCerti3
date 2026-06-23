package com.upb.ecommerce.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Component
public class GoogleTokenVerifier {

    private final RestClient restClient = RestClient.create("https://oauth2.googleapis.com");

    @Value("${google.oauth.client-id:}")
    private String clientId;

    public GoogleProfile verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Google OAuth no esta configurado");
        }

        Map<String, Object> tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Token de Google invalido");
        }

        String audience = value(tokenInfo, "aud");
        String emailVerified = value(tokenInfo, "email_verified");
        String email = value(tokenInfo, "email");
        String name = value(tokenInfo, "name");

        if (tokenInfo == null
                || audience == null
                || !audience.equals(clientId)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Token de Google no corresponde a esta aplicacion");
        }

        if (!"true".equalsIgnoreCase(emailVerified)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Google no verifico el email del usuario");
        }

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "El token de Google no contiene email");
        }

        return new GoogleProfile(email, name);
    }

    private String value(Map<String, Object> data, String key) {
        if (data == null || data.get(key) == null) {
            return null;
        }
        return String.valueOf(data.get(key));
    }

    public record GoogleProfile(String email, String name) {
    }
}
