package com.upb.ecommerce.api.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Configuration
public class InjectConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        DelegatingPasswordEncoder encoder =
                (DelegatingPasswordEncoder) PasswordEncoderFactories.createDelegatingPasswordEncoder();
        encoder.setDefaultPasswordEncoderForMatches(new LegacyPasswordEncoder());
        return encoder;
    }

    /**
     * Compatibilidad con contraseñas antiguas almacenadas sin prefijo:
     * - texto plano: 123456
     * - hash bcrypt sin {bcrypt}
     *
     * Los registros nuevos se siguen guardando con el formato estándar de Spring Security.
     */
    private static final class LegacyPasswordEncoder implements PasswordEncoder {

        private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

        @Override
        public String encode(CharSequence rawPassword) {
            return bcrypt.encode(rawPassword);
        }

        @Override
        public boolean matches(CharSequence rawPassword, String encodedPassword) {
            if (encodedPassword == null || encodedPassword.isBlank()) {
                return false;
            }
            if (isRawBcryptHash(encodedPassword)) {
                return bcrypt.matches(rawPassword, encodedPassword);
            }
            return encodedPassword.contentEquals(rawPassword);
        }

        private boolean isRawBcryptHash(String encodedPassword) {
            return encodedPassword.startsWith("$2a$")
                    || encodedPassword.startsWith("$2b$")
                    || encodedPassword.startsWith("$2y$");
        }
    }
}
