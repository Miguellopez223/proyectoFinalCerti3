package com.upb.ecommerce.core.integracion;

import com.upb.ecommerce.core.dto.request.TiendaRequest;
import com.upb.ecommerce.core.dto.response.TiendaResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class TiendaClient {

    @Value("${tienda-client.url-base:http://localhost:8082}")
    private String urlBase;
    @Value("${tienda-client.connect-timeout:10000}")
    private int connectTimeout = 10000;
    @Value("${tienda-client.read-timeout:40000}")
    private int readTimeout = 40000;

    public List<TiendaResponse> listar() throws Exception {
        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad tienda-client.url-base es requerida para usar TiendaClient");
        }

        String endpoint = urlBase + "/api/tiendas";
        log.info("TiendaClient consumiendo GET {}", endpoint);

        ResponseEntity<List<TiendaResponse>> response;
        try {
            response = create().get()
                    .uri(endpoint)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .retrieve()
                    .toEntity(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error consumiendo listado de tiendas", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Se genero error al listar tiendas");
        }

        log.info("TiendaClient respuesta {} con {} registros",
                response.getStatusCode().value(),
                response.getBody() != null ? response.getBody().size() : 0);
        return response.getBody();
    }

    public TiendaResponse crear(TiendaRequest request) throws Exception {
        if (urlBase == null || urlBase.isBlank()) {
            throw new IllegalStateException("La propiedad tienda-client.url-base es requerida para usar TiendaClient");
        }

        String endpoint = urlBase + "/api/tiendas";
        log.info("TiendaClient consumiendo POST {}", endpoint);

        ResponseEntity<TiendaResponse> response;
        try {
            response = create().post()
                    .uri(endpoint)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("Accept", MediaType.APPLICATION_JSON_VALUE)
                    .body(request)
                    .retrieve()
                    .toEntity(TiendaResponse.class);
        } catch (Exception e) {
            log.error("Error creando tienda", e);
            throw e;
        }

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new Exception("Se genero error al crear tienda");
        }

        log.info("TiendaClient respuesta {}", response.getStatusCode().value());
        return response.getBody();
    }

    private RestClient create() {
        SimpleClientHttpRequestFactory clientHttpRequestFactory = new SimpleClientHttpRequestFactory();
        clientHttpRequestFactory.setConnectTimeout(Duration.ofMillis(connectTimeout));
        clientHttpRequestFactory.setReadTimeout(Duration.ofMillis(readTimeout));
        return RestClient.builder().requestFactory(clientHttpRequestFactory).build();
    }
}
