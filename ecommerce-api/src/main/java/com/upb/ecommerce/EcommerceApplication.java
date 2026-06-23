package com.upb.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Punto de entrada de la aplicación.
 * @SpringBootApplication escanea com.upb.ecommerce.** lo que incluye
 * los beans de los módulos domain, data, core y api.
 */
@SpringBootApplication(scanBasePackages = "com.upb")
@EntityScan(basePackages = "com.upb")
@EnableJpaRepositories(basePackages = "com.upb")
@EnableCaching
public class EcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }
}
