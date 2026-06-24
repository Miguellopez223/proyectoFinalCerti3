package com.upb.ecommerce.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Crea (idempotente) la función SQL {@code kilikea_norm(text)} usada por la búsqueda del
 * marketplace para comparar texto sin distinguir mayúsculas/minúsculas ni tildes.
 *
 * No usa la extensión {@code unaccent} a propósito: {@code translate()} no requiere
 * privilegios especiales y es portable. Si por permisos no se pudiera crear, se registra una
 * advertencia y se puede ejecutar manualmente {@code script/marketplace.sql}.
 */
@Component
public class MarketplaceDbInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(MarketplaceDbInitializer.class);

    private static final String CREAR_FUNCION_NORM = """
            CREATE OR REPLACE FUNCTION kilikea_norm(txt text) RETURNS text AS $func$
              SELECT lower(translate(coalesce(txt, ''),
                'ÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑáàäâãéèëêíìïîóòöôõúùüûñ',
                'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun'));
            $func$ LANGUAGE sql IMMUTABLE;
            """;

    private final JdbcTemplate jdbcTemplate;

    public MarketplaceDbInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute(CREAR_FUNCION_NORM);
            log.info("Función SQL kilikea_norm() lista (búsqueda normalizada del marketplace).");
        } catch (Exception e) {
            log.warn("No se pudo crear kilikea_norm(): {}. Ejecutá script/marketplace.sql manualmente "
                    + "o la búsqueda del marketplace fallará.", e.getMessage());
        }
    }
}
