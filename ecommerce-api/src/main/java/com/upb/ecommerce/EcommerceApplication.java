package com.upb.ecommerce;

import com.upb.ecommerce.core.dto.request.LoginRequest;
import com.upb.ecommerce.core.dto.request.ProductoRequest;
import com.upb.ecommerce.core.dto.request.TiendaRequest;
import com.upb.ecommerce.core.dto.request.UsuarioRequest;
import com.upb.ecommerce.core.dto.response.LoginResponse;
import com.upb.ecommerce.core.dto.response.TiendaResponse;
import com.upb.ecommerce.core.integracion.AuthClient;
import com.upb.ecommerce.core.integracion.ProductoClient;
import com.upb.ecommerce.core.integracion.TiendaClient;
import com.upb.ecommerce.core.service.UsuarioService;
import com.upb.ecommerce.domain.enums.RolType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.math.BigDecimal;

@Slf4j
@SpringBootApplication
@RequiredArgsConstructor
public class EcommerceApplication implements CommandLineRunner {

    private final TiendaClient tiendaClient;
    private final AuthClient authClient;
    private final ProductoClient productoClient;
    private final UsuarioService usuarioService;

    @Value("${client-smoke-test.enabled:true}")
    private boolean enabled;

    public static void main(String[] args) {
        SpringApplication.run(EcommerceApplication.class, args);
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            log.info("CommandLineRunner de prueba deshabilitado");
            return;
        }

        long suffix = System.currentTimeMillis();
        String slug = "tienda-smoke-" + suffix;
        String email = "smoke" + suffix + "@test.com";
        String password = "123456";

        try {
            log.info("CommandLineRunner iniciando prueba de consumo interno");

            TiendaRequest tiendaRequest = new TiendaRequest();
            tiendaRequest.setNombre("Tienda Smoke " + suffix);
            tiendaRequest.setSlug(slug);
            tiendaRequest.setTelefonoContacto("77777777");
            tiendaRequest.setEmailContacto(email);
            tiendaRequest.setLogoUrl("https://img.com/logo.png");

            TiendaResponse tienda = tiendaClient.crear(tiendaRequest);
            tiendaClient.listar();

            UsuarioRequest usuarioRequest = new UsuarioRequest();
            usuarioRequest.setTiendaId(tienda.getId());
            usuarioRequest.setNombre("Usuario Smoke");
            usuarioRequest.setEmail(email);
            usuarioRequest.setPassword(password);
            usuarioRequest.setRol(RolType.ADMIN);
            usuarioService.registrar(usuarioRequest);

            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setTiendaId(tienda.getId());
            loginRequest.setEmail(email);
            loginRequest.setPassword(password);

            LoginResponse loginResponse = authClient.auth(loginRequest);
            String bearerToken = loginResponse.getTokenType() + " " + loginResponse.getAccessToken();

            ProductoRequest productoRequest = new ProductoRequest();
            productoRequest.setTiendaId(tienda.getId());
            productoRequest.setNombre("Producto Smoke " + suffix);
            productoRequest.setSlugProducto("producto-smoke-" + suffix);
            productoRequest.setDescripcionLarga("Producto de prueba para smoke test");
            productoRequest.setPrecio(new BigDecimal("100"));
            productoRequest.setPrecioCosto(new BigDecimal("80"));
            productoRequest.setStock(10);
            productoRequest.setStockMinimo(2);
            productoRequest.setImagenUrl("https://img.com/producto.png");

            productoClient.crear(productoRequest, bearerToken);
            productoClient.listar(tienda.getId(), bearerToken);

            log.info("CommandLineRunner finalizo correctamente");
        } catch (Exception e) {
            log.error("CommandLineRunner fallo", e);
        }
    }
}
