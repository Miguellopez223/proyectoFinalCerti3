package com.upb.ecommerce.core.integracion;

import com.upb.ecommerce.core.dto.request.ProductoRequest;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class ProductoClient {

    @Value("${producto-client.url-base:http://localhost:8082}")
    private String urlBase;
    @Value("${producto-client.connect-timeout:10000}")
    private int connectTimeout = 10000;
    @Value("${producto-client.read-timeout:40000}")
    private int readTimeout = 40000;

    public List<ProductoResponse> listar(Long tiendaId, String authorization) throws Exception {
        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad producto-client.url-base es requerida para usar ProductoClient");
        }

        String endpoint = urlBase + "/api/productos/tienda/" + tiendaId;
        log.info("ProductoClient consumiendo GET {}", endpoint);

        ResponseEntity<List<ProductoResponse>> response;
        try {
            response = create().get()
                    .uri(endpoint)
                    .headers(headers -> addAuthorization(headers, authorization))
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toEntity(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error listando productos", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Se genero error al listar productos");
        }

        log.info("ProductoClient respuesta {} con {} registros",
                response.getStatusCode().value(),
                response.getBody() != null ? response.getBody().size() : 0);
        return response.getBody();
    }

    public ProductoResponse crear(ProductoRequest request, String authorization) throws Exception {
        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad producto-client.url-base es requerida para usar ProductoClient");
        }

        String endpoint = urlBase + "/api/productos";
        log.info("ProductoClient consumiendo POST {}", endpoint);

        ResponseEntity<ProductoResponse> response;
        try {
            response = create().post()
                    .uri(endpoint)
                    .headers(headers -> addAuthorization(headers, authorization))
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .body(request)
                    .retrieve()
                    .toEntity(ProductoResponse.class);
        } catch (Exception e) {
            log.error("Error creando producto", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Se genero error al crear producto");
        }

        log.info("ProductoClient respuesta {}", response.getStatusCode().value());
        return response.getBody();
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory clientHttpRequestFactory = new SimpleClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        clientHttpRequestFactory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(clientHttpRequestFactory).build();
    }

    private void addAuthorization(HttpHeaders headers, String authorization) {
        if (authorization != null && !authorization.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
        }
    }
}
