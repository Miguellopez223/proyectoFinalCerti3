package com.upb.ecommerce.api.health;

import com.upb.ecommerce.api.config.TokenBlacklist;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class TokenBlacklistHealthIndicator implements HealthIndicator {

    private final TokenBlacklist tokenBlacklist;

    public TokenBlacklistHealthIndicator(TokenBlacklist tokenBlacklist) {
        this.tokenBlacklist = tokenBlacklist;
    }

    @Override
    public Health health() {
        int tokensInvalidados = tokenBlacklist.size();
        return Health.up()
                .withDetail("tokensInvalidados", tokensInvalidados)
                .withDetail("almacenamiento", "en memoria (single-node)")
                .build();
    }
}
