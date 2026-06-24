package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.request.LoginRequest;
import com.upb.ecommerce.core.dto.request.UsuarioRequest;
import com.upb.ecommerce.core.dto.response.UsuarioResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.data.repository.UsuarioRepository;
import com.upb.ecommerce.domain.entities.Tienda;
import com.upb.ecommerce.domain.entities.Usuario;
import com.upb.ecommerce.domain.enums.RolType;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final TiendaRepository tiendaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          TiendaRepository tiendaRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tiendaRepository = tiendaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioResponse> listarPorTienda(Long tiendaId) {
        return usuarioRepository.findAll().stream()
                .filter(u -> u.getTienda().getId().equals(tiendaId))
                .map(UsuarioResponse::fromEntity)
                .toList();
    }

    // Cache "usuarios" indexada por el id del usuario: la primera llamada va a la BD y
    // guarda el resultado; las siguientes (dentro de los 10 min de expiracion) lo devuelven
    // desde memoria sin tocar la BD.
    @Cacheable(value = "usuarios", key = "#id")
    public UsuarioResponse obtenerPorId(Long id) {
        return UsuarioResponse.fromEntity(
                usuarioRepository.findById(id)
                        .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado")));
    }

    @Transactional
    public UsuarioResponse registrar(UsuarioRequest request) {
        Tienda tienda = tiendaRepository.findById(request.getTiendaId())
                .orElseThrow(() -> new NotDataFoundException("Tienda no encontrada"));

        if (usuarioRepository.findByEmailAndTiendaId(request.getEmail(), tienda.getId()).isPresent()) {
            throw new OperationException("Ya existe un usuario con ese email en esta tienda");
        }

        Usuario usuario = new Usuario();
        usuario.setTienda(tienda);
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setNumeroWhatsapp(request.getNumeroWhatsapp());
        // Seguridad: el auto-registro es público, por lo que SIEMPRE se crea como
        // CLIENTE (no visible en catálogo) para evitar escalada de privilegios desde el
        // endpoint abierto.
        usuario.setRol(RolType.CLIENTE);
        usuario.setVisibleCatalogo(false);
        return UsuarioResponse.fromEntity(usuarioRepository.save(usuario));
    }

    /**
     * Alta de usuario por un ADMIN: respeta el rol enviado y permite configurar el número
     * de WhatsApp y la visibilidad en el catálogo público.
     */
    // Un admin puede crear el usuario visible en catalogo y con WhatsApp: invalida el catalogo.
    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public UsuarioResponse crearPorAdmin(UsuarioRequest request) {
        Tienda tienda = tiendaRepository.findById(request.getTiendaId())
                .orElseThrow(() -> new NotDataFoundException("Tienda no encontrada"));

        if (usuarioRepository.findByEmailAndTiendaId(request.getEmail(), tienda.getId()).isPresent()) {
            throw new OperationException("Ya existe un usuario con ese email en esta tienda");
        }

        Usuario usuario = new Usuario();
        usuario.setTienda(tienda);
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setRol(request.getRol());
        usuario.setNumeroWhatsapp(request.getNumeroWhatsapp());
        usuario.setVisibleCatalogo(Boolean.TRUE.equals(request.getVisibleCatalogo()));
        return UsuarioResponse.fromEntity(usuarioRepository.save(usuario));
    }

    // Refresca el usuario en cache e invalida el catalogo (pudo cambiar su WhatsApp/visibilidad).
    @CachePut(value = "usuarios", key = "#id")
    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));
        usuario.setNombre(request.getNombre());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        usuario.setNumeroWhatsapp(request.getNumeroWhatsapp());
        if (request.getVisibleCatalogo() != null) {
            usuario.setVisibleCatalogo(request.getVisibleCatalogo());
        }
        return UsuarioResponse.fromEntity(usuarioRepository.save(usuario));
    }

    /**
     * Busca un usuario por email + tiendaId. Usado por AuthController para validar
     * que el usuario existe en la tienda solicitada antes de autenticar.
     */
    public Optional<Usuario> findByEmailAndTiendaId(String email, Long tiendaId) {
        return usuarioRepository.findByEmailAndTiendaId(email, tiendaId);
    }

    /** Resuelve un usuario activo solo por email (login sin selección de tienda). */
    public Optional<Usuario> findActivoPorEmail(String email) {
        return usuarioRepository.findFirstByEmailAndEstadoTrue(email);
    }

    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public Usuario findOrCreateGoogleUser(Long tiendaId, String email, String nombre) {
        // Si no se especifica tienda, resolvemos por email; los nuevos caen en la tienda por defecto.
        Optional<Usuario> existente = tiendaId != null
                ? usuarioRepository.findByEmailAndTiendaId(email, tiendaId)
                : usuarioRepository.findFirstByEmailAndEstadoTrue(email);
        if (existente.isPresent()) {
            Usuario usuario = existente.get();
            if (!usuario.isEnabled()) {
                throw new OperationException("Usuario inactivo");
            }
            return usuario;
        }

        Tienda tienda = tiendaId != null
                ? tiendaRepository.findById(tiendaId)
                        .orElseThrow(() -> new NotDataFoundException("Tienda no encontrada"))
                : tiendaRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new NotDataFoundException("No hay tiendas configuradas"));

        Usuario usuario = new Usuario();
        usuario.setTienda(tienda);
        usuario.setNombre(nombre != null && !nombre.isBlank() ? nombre : email);
        usuario.setEmail(email);
        usuario.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        usuario.setRol(RolType.CLIENTE);
        usuario.setVisibleCatalogo(false);
        usuario.setEstado(true);
        return usuarioRepository.save(usuario);
    }

    /**
     * Valida credenciales completas (email + tiendaId + password) y devuelve el Usuario.
     * Conservado para usos que no requieran AuthenticationManager.
     */
    public Usuario validarCredenciales(LoginRequest request) {
        Usuario usuario = usuarioRepository
                .findByEmailAndTiendaId(request.getEmail(), request.getTiendaId())
                .orElseThrow(() -> new OperationException("Credenciales inválidas"));

        if (!usuario.getEstado()) {
            throw new OperationException("Usuario inactivo");
        }
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new OperationException("Credenciales inválidas");
        }
        return usuario;
    }

    /**
     * Busca un usuario activo por ID para validar la sesión JWT en cada request.
     * Usa la query JPQL optimizada que solo carga (id, email, rol).
     */
    public Optional<Usuario> findByIdForSession(Long id) {
        return usuarioRepository.findByIdToValidateSession(id);
    }

    // Quita el usuario de su cache e invalida el catalogo (si era visible, sale de contactos).
    @Caching(evict = {
            @CacheEvict(value = "usuarios", key = "#id"),
            @CacheEvict(value = "catalogo", allEntries = true)
    })
    @Transactional
    public void desactivar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));
        usuario.setEstado(false);
        usuarioRepository.save(usuario);
    }

    // Reactiva: refresca su cache e invalida el catalogo (si es visible, vuelve a contactos).
    @CachePut(value = "usuarios", key = "#id")
    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public UsuarioResponse reactivar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));
        usuario.setEstado(true);
        return UsuarioResponse.fromEntity(usuarioRepository.save(usuario));
    }
}
