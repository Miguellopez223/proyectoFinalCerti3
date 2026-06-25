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
        // Crear tienda inicial solo si no existe ninguna
        if (tiendaRepository.count() == 0) {
            Tienda tienda = new Tienda();
            tienda.setNombre("Comercio1 Inventario General");
            tienda.setSlug("comercio1");
            tienda.setTelefonoContacto("77712345");
            tienda.setEmailContacto("contacto@comercio1.com");
            tiendaRepository.save(tienda);
            log.info("Tienda inicial creada: {}", tienda.getNombre());
        }

        Tienda tienda = tiendaRepository.findBySlug("comercio1")
                .orElseThrow(() -> new RuntimeException("Tienda inicial no encontrada"));

        ensureAdminUser(tienda, "Roberto Rodriguez", "admin@comercio1.com");
        ensureAdminUser(tienda, "PolloBurger", "polloburger@comercio1.com");
        ensureAdminUser(tienda, "Miguel", "miguel@comercio1.com");
        ensureAdminUser(tienda, "Ignacio", "ignacio@comercio1.com");
        ensureAdminUser(tienda, "Santiago", "santiago@comercio1.com");

        migrateLegacyPasswords();
    }

    private void ensureAdminUser(Tienda tienda, String nombre, String email) {
        Optional<Usuario> existing = usuarioRepository.findByEmailAndTiendaId(email, tienda.getId());
        if (existing.isPresent()) {
            Usuario usuario = existing.get();
            boolean changed = false;

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
                log.info("Usuario admin actualizado: {}", email);
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
        log.info("Usuario admin creado: {} | password: {}", admin.getEmail(), DEFAULT_ADMIN_PASSWORD);
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
