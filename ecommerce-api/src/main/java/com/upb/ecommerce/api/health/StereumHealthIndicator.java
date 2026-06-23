package com.upb.ecommerce.api.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("stereum")
public class StereumHealthIndicator implements HealthIndicator {

    @Value("${stereum.url-base:}")
    private String urlBase;

    @Value("${stereum.api-key:}")
    private String apiKey;

    @Value("${stereum.connect-timeout:5000}")
    private int connectTimeoutMs;

    @Value("${stereum.read-timeout:20000}")
    private int readTimeoutMs;

    @Override
    public Health health() {
        if (urlBase.isBlank() || apiKey.isBlank()) {
            return Health.down()
                    .withDetail("razon", "URL base o API key no configurados")
                    .build();
        }

        String apiKeyPreview = apiKey.length() > 8
                ? apiKey.substring(0, 8) + "****"
                : "****";

        return Health.up()
                .withDetail("url", urlBase)
                .withDetail("apiKey", apiKeyPreview)
                .withDetail("connectTimeoutMs", connectTimeoutMs)
                .withDetail("readTimeoutMs", readTimeoutMs)
                .build();
    }
}
