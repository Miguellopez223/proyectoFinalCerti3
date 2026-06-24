package com.upb.ecommerce.api.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la documentación OpenAPI / Swagger (patrón del docente, proyecto eventop).
 *
 * <p>Define los metadatos de la API (lo que se ve arriba en Swagger UI) y un esquema de
 * seguridad <b>bearerToken</b> que habilita el botón <b>Authorize</b> para pegar el JWT.
 * Cada endpoint protegido lo referencia con {@code @SecurityRequirement(name = "bearerToken")}.
 *
 * <p>La UI queda disponible en {@code http://localhost:8081/swagger-ui.html} y el JSON en
 * {@code http://localhost:8081/v3/api-docs}. Ambas rutas están en la lista blanca de
 * {@link SecurityConfig}, por eso se ven sin login.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "API E-commerce UPB",
                version = "v1",
                description = "API REST de e-commerce multi-tienda: autenticación JWT + Google OAuth, "
                        + "carrito, pedidos, inventario, dashboards/reportes y pagos QR con Stereum. "
                        + "Desarrollada para UPB (Certificación III).",
                contact = @Contact(
                        name = "Equipo Ecommerce UPB",
                        email = "miguel762005@gmail.com"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8081", description = "Servidor de desarrollo")
        }
)
@SecurityScheme(
        name = "bearerToken",
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        scheme = "bearer",
        bearerFormat = "jwt"
)
public class OpenApiConfig {
}
