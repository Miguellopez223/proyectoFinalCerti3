package com.upb.ecommerce.core.integracion;

import com.upb.ecommerce.core.dto.request.LoginRequest;
import com.upb.ecommerce.core.dto.response.LoginResponse;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Slf4j
@Service
public class AuthClient {

    @Value("${auth-client.url-base:http://localhost:8082}")
    private String urlBase;
    @Value("${auth-client.connect-timeout:10000}")
    private int connectTimeout = 10000;
    @Value("${auth-client.read-timeout:40000}")
    private int readTimeout = 40000;

    public LoginResponse auth(LoginRequest request) throws Exception {
        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad auth-client.url-base es requerida para usar AuthClient");
        }

        String endpoint = urlBase + "/api/auth";
        log.info("AuthClient consumiendo POST {}", endpoint);

        JSONObject jsonRequest = new JSONObject();
        jsonRequest.put("tienda_id", request.getTiendaId());
        jsonRequest.put("email", request.getEmail());
        jsonRequest.put("password", request.getPassword());

        ResponseEntity<String> response;
        try {
            response = create().post()
                    .uri(endpoint)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .body(jsonRequest.toString())
                    .retrieve()
                    .toEntity(String.class);
        } catch (Exception e) {
            log.error("Error consumiendo auth", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Se genero error al consumir auth");
        }

        log.info("AuthClient respuesta {}", response.getStatusCode().value());

        String responseBody = response.getBody();
        if (responseBody == null || responseBody.isBlank()) {
            throw new Exception("La respuesta del servicio auth llego vacia");
        }

        JSONObject jsonResponse = new JSONObject(responseBody);
        return LoginResponse.builder()
                .accessToken(jsonResponse.optString("access_token", null))
                .idToken(jsonResponse.optString("id_token", null))
                .refreshToken(jsonResponse.optString("refresh_token", null))
                .tokenType(jsonResponse.optString("token_type", null))
                .expiresIn(jsonResponse.optLong("expires_in", 0L))
                .expiresAt(jsonResponse.optLong("expires_at", 0L))
                .build();
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory clientHttpRequestFactory = new SimpleClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        clientHttpRequestFactory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(clientHttpRequestFactory).build();
    }
}
