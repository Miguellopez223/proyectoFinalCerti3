package com.upb.ecommerce.data.seeders;

import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.data.repository.UsuarioRepository;
import com.upb.ecommerce.domain.entities.Tienda;
import com.upb.ecommerce.domain.entities.Usuario;
import com.upb.ecommerce.domain.enums.RolType;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@Order(1)
@AllArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin123**";

    private final TiendaRepository tiendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        init();
    }

    private void init() {
        Tienda tienda1 = ensureTienda("Comercio1 Inventario General", "comercio1", "77712345", "contacto@comercio1.com");
        Tienda tienda2 = ensureTienda("Comercio2 Inventario General", "comercio2", "77712346", "contacto@comercio2.com");
        Tienda tienda3 = ensureTienda("Comercio3 Inventario General", "comercio3", "77712347", "contacto@comercio3.com");
        Tienda tienda4 = ensureTienda("Comercio4 Inventario General", "comercio4", "77712348", "contacto@comercio4.com");
        Tienda tienda5 = ensureTienda("Comercio5 Inventario General", "comercio5", "77712349", "contacto@comercio5.com");

        // Cada admin sembrado queda a cargo de una tienda distinta (antes todos eran admin
        // de "comercio1"). El email de cada uno no cambia, solo la tienda que administra.
        ensureAdminUser(tienda1, "Roberto Rodriguez", "admin@comercio1.com");
        ensureAdminUser(tienda2, "PolloBurger", "polloburger@comercio1.com");
        ensureAdminUser(tienda3, "Miguel", "miguel@comercio1.com");
        ensureAdminUser(tienda4, "Ignacio", "ignacio@comercio1.com");
        ensureAdminUser(tienda5, "Santiago", "santiago@comercio1.com");

        migrateLegacyPasswords();
    }

    private Tienda ensureTienda(String nombre, String slug, String telefono, String email) {
        return tiendaRepository.findBySlug(slug).orElseGet(() -> {
            Tienda tienda = new Tienda();
            tienda.setNombre(nombre);
            tienda.setSlug(slug);
            tienda.setTelefonoContacto(telefono);
            tienda.setEmailContacto(email);
            Tienda guardada = tiendaRepository.save(tienda);
            log.info("Tienda creada: {}", guardada.getNombre());
            return guardada;
        });
    }

    /**
     * Crea el admin si no existe, o lo actualiza si ya existe. Busca por email sin filtrar
     * por tienda (un admin sembrado en una corrida anterior puede estar en otra tienda) para
     * poder reasignarlo a la tienda objetivo en vez de crear un duplicado.
     */
    private void ensureAdminUser(Tienda tienda, String nombre, String email) {
        Optional<Usuario> existing = usuarioRepository.findFirstByEmailAndEstadoTrue(email)
                .or(() -> usuarioRepository.findByEmailAndTiendaId(email, tienda.getId()));
        if (existing.isPresent()) {
            Usuario usuario = existing.get();
            boolean changed = false;

            if (usuario.getTienda() == null || !tienda.getId().equals(usuario.getTienda().getId())) {
                usuario.setTienda(tienda);
                changed = true;
            }
            if (!nombre.equals(usuario.getNombre())) {
                usuario.setNombre(nombre);
                changed = true;
            }
            if (usuario.getRol() != RolType.ADMIN) {
                usuario.setRol(RolType.ADMIN);
                changed = true;
            }
            if (!Boolean.TRUE.equals(usuario.getEstado())) {
                usuario.setEstado(true);
                changed = true;
            }

            if (changed) {
                usuarioRepository.save(usuario);
                log.info("Usuario admin actualizado: {} -> tienda '{}'", email, tienda.getNombre());
            }
            return;
        }

        Usuario admin = new Usuario();
        admin.setTienda(tienda);
        admin.setNombre(nombre);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
        admin.setRol(RolType.ADMIN);
        admin.setEstado(true);
        usuarioRepository.save(admin);
        log.info("Usuario admin creado: {} | tienda: {} | password: {}", admin.getEmail(), tienda.getNombre(), DEFAULT_ADMIN_PASSWORD);
    }

    private void migrateLegacyPasswords() {
        List<Usuario> usuarios = usuarioRepository.findAll().stream()
                .filter(usuario -> hasLegacyPasswordFormat(usuario.getPassword()))
                .toList();

        if (usuarios.isEmpty()) {
            return;
        }

        usuarios.forEach(usuario -> {
            String currentPassword = usuario.getPassword();
            if (isSeededAdminWithLegacyPassword(usuario, currentPassword)) {
                usuario.setPassword(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            } else if (isRawBcryptHash(currentPassword)) {
                usuario.setPassword("{bcrypt}" + currentPassword);
            } else {
                usuario.setPassword("{noop}" + currentPassword);
            }
        });

        usuarioRepository.saveAll(usuarios);
        log.info("Se migraron {} contraseñas heredadas al formato compatible con Spring Security", usuarios.size());
    }

    private boolean hasLegacyPasswordFormat(String password) {
        return password != null && !password.startsWith("{");
    }

    private boolean isRawBcryptHash(String password) {
        return password.startsWith("$2a$")
                || password.startsWith("$2b$")
                || password.startsWith("$2y$");
    }

    private boolean isSeededAdminWithLegacyPassword(Usuario usuario, String password) {
        return "admin@comercio1.com".equalsIgnoreCase(usuario.getEmail())
                && "123456".equals(password);
    }
}
