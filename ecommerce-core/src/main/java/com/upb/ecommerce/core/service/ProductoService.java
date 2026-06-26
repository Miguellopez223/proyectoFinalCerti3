package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.request.ProductoRequest;
import com.upb.ecommerce.core.dto.response.ProductoImportError;
import com.upb.ecommerce.core.dto.response.ProductoImportResponse;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.exception.NotDataFoundException;
import com.upb.ecommerce.core.exception.OperationException;
import com.upb.ecommerce.data.repository.CategoriaRepository;
import com.upb.ecommerce.data.repository.ProductoRepository;
import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.data.repository.UnidadMedidaRepository;
import com.upb.ecommerce.domain.entities.Categoria;
import com.upb.ecommerce.domain.entities.Producto;
import com.upb.ecommerce.domain.entities.Tienda;
import com.upb.ecommerce.domain.entities.UnidadMedida;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final CategoriaRepository categoriaRepository;
    private final UnidadMedidaRepository unidadMedidaRepository;

    public ProductoService(ProductoRepository productoRepository,
                           TiendaRepository tiendaRepository,
                           CategoriaRepository categoriaRepository,
                           UnidadMedidaRepository unidadMedidaRepository) {
        this.productoRepository = productoRepository;
        this.tiendaRepository = tiendaRepository;
        this.categoriaRepository = categoriaRepository;
        this.unidadMedidaRepository = unidadMedidaRepository;
    }

    public List<ProductoResponse> listarPorTienda(Long tiendaId) {
        return productoRepository.findByTiendaIdAndEstadoTrue(tiendaId)
                .stream().map(ProductoResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductoResponse> listarPorTiendaPaginado(Long tiendaId, Pageable pageable) {
        return productoRepository.findByTiendaIdAndEstadoTrue(tiendaId, pageable)
                .map(ProductoResponse::fromEntity);
    }

    public List<ProductoResponse> listarPorCategoria(Long tiendaId, Long categoriaId) {
        return productoRepository.findByTiendaIdAndCategoriaIdAndEstadoTrue(tiendaId, categoriaId)
                .stream().map(ProductoResponse::fromEntity).toList();
    }

    /**
     * Busca productos activos con filtros opcionales y paginación.
     * Parámetros:
     * - nombre: búsqueda en nombre del producto (insensible a mayúsculas)
     * - categoriaId: filtrar por categoría
     * - precioMin: precio mínimo
     * - precioMax: precio máximo
     * - enStock: si true, solo productos con stock > 0
     * - tiendaId: filtrar por tienda (opcional)
     * - pageable: información de paginación (page, size, sort)
     */
    @Transactional(readOnly = true)
    public Page<ProductoResponse> buscarConFiltros(
            String nombre,
            Long categoriaId,
            BigDecimal precioMin,
            BigDecimal precioMax,
            Boolean enStock,
            Long tiendaId,
            Pageable pageable) {
        return productoRepository.buscarConFiltros(
                nombre,
                categoriaId,
                precioMin,
                precioMax,
                enStock != null && enStock,
                tiendaId,
                pageable
        ).map(ProductoResponse::fromEntity);
    }

    // Primero busca el producto en la cache "productos"; si no esta, va a la BD y guarda
    // el resultado. Clave compuesta tienda-producto: el productoId se valida contra la
    // tienda, asi que la clave debe incluir ambos para no servir un producto de otra tienda.
    @Cacheable(value = "productos", key = "#tiendaId + '-' + #productoId")
    public ProductoResponse obtenerPorId(Long tiendaId, Long productoId) {
        return ProductoResponse.fromEntity(
                productoRepository.findByIdAndTiendaId(productoId, tiendaId)
                        .orElseThrow(() -> new NotDataFoundException("Producto no encontrado")));
    }

    // Un producto nuevo cambia el catalogo de su tienda: se invalida la cache del catalogo.
    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public ProductoResponse crear(ProductoRequest request) {
        Tienda tienda = tiendaRepository.findById(request.getTiendaId())
                .orElseThrow(() -> new NotDataFoundException("Tienda no encontrada"));

        return ProductoResponse.fromEntity(productoRepository.save(toEntity(request, tienda)));
    }

    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public ProductoImportResponse importarCsv(Long tiendaId, InputStream inputStream) {
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new NotDataFoundException("Tienda no encontrada"));

        List<ProductoImportError> errores = new ArrayList<>();
        int totalFilas = 0;
        int importados = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (!StringUtils.hasText(headerLine)) {
                throw new OperationException("El CSV esta vacio.");
            }

            char delimiter = detectDelimiter(headerLine);
            List<String> headers = parseCsvLine(stripBom(headerLine), delimiter);
            Map<String, Integer> index = indexHeaders(headers);
            validateRequiredHeader(index, "nombre");
            validateRequiredHeader(index, "precio");
            validateRequiredHeader(index, "stock");

            String line;
            int fila = 1;
            while ((line = reader.readLine()) != null) {
                fila++;
                if (!StringUtils.hasText(line)) {
                    continue;
                }
                totalFilas++;
                try {
                    ProductoRequest request = buildRequestFromCsv(tienda, line, delimiter, index);
                    if (!StringUtils.hasText(request.getSlugProducto())) {
                        request.setSlugProducto(slugify(request.getNombre()));
                    }
                    if (productoRepository.findBySlugProductoAndTiendaId(request.getSlugProducto(), tiendaId).isPresent()) {
                        throw new OperationException("Ya existe un producto con slug '" + request.getSlugProducto() + "'.");
                    }
                    productoRepository.save(toEntity(request, tienda));
                    importados++;
                } catch (Exception ex) {
                    errores.add(new ProductoImportError(fila, "", ex.getMessage()));
                }
            }
        } catch (IOException ex) {
            throw new OperationException("No se pudo leer el archivo CSV.");
        }

        return new ProductoImportResponse(totalFilas, importados, errores.size(), errores);
    }

    private Producto toEntity(ProductoRequest request, Tienda tienda) {
        Producto producto = new Producto();
        producto.setTienda(tienda);
        producto.setNombre(request.getNombre());
        producto.setSlugProducto(request.getSlugProducto());
        producto.setDescripcionLarga(request.getDescripcionLarga());
        producto.setPrecio(request.getPrecio());
        producto.setPrecioCosto(request.getPrecioCosto());
        producto.setPrecioOferta(request.getPrecioOferta());
        producto.setOfertaInicio(request.getOfertaInicio());
        producto.setOfertaFin(request.getOfertaFin());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        if (request.getStockMinimo() != null) producto.setStockMinimo(request.getStockMinimo());

        if (request.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new NotDataFoundException("Categoría no encontrada"));
            producto.setCategoria(cat);
        }
        producto.setUnidadMedida(resolverUnidad(request.getUnidadMedidaId()));
        return producto;
    }

    // Refresca la entrada del producto en cache y, ademas, invalida el catalogo (precio,
    // nombre o stock pudieron cambiar y el catalogo los muestra).
    @CachePut(value = "productos", key = "#request.tiendaId + '-' + #id")
    @CacheEvict(value = "catalogo", allEntries = true)
    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findByIdAndTiendaId(id, request.getTiendaId())
                .orElseThrow(() -> new NotDataFoundException("Producto no encontrado"));

        producto.setNombre(request.getNombre());
        producto.setSlugProducto(request.getSlugProducto());
        producto.setDescripcionLarga(request.getDescripcionLarga());
        producto.setPrecio(request.getPrecio());
        producto.setPrecioCosto(request.getPrecioCosto());
        producto.setPrecioOferta(request.getPrecioOferta());
        producto.setOfertaInicio(request.getOfertaInicio());
        producto.setOfertaFin(request.getOfertaFin());
        producto.setStock(request.getStock());
        producto.setImagenUrl(request.getImagenUrl());
        if (request.getStockMinimo() != null) producto.setStockMinimo(request.getStockMinimo());

        if (request.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(request.getCategoriaId())
                    .orElseThrow(() -> new NotDataFoundException("Categoría no encontrada"));
            producto.setCategoria(cat);
        } else {
            producto.setCategoria(null);
        }
        producto.setUnidadMedida(resolverUnidad(request.getUnidadMedidaId()));
        return ProductoResponse.fromEntity(productoRepository.save(producto));
    }

    /** Resuelve la unidad de medida (opcional); null si no se envía. */
    private UnidadMedida resolverUnidad(Long unidadMedidaId) {
        if (unidadMedidaId == null) return null;
        return unidadMedidaRepository.findById(unidadMedidaId)
                .orElseThrow(() -> new NotDataFoundException("Unidad de medida no encontrada"));
    }

    private ProductoRequest buildRequestFromCsv(Tienda tienda, String line, char delimiter, Map<String, Integer> index) {
        Long tiendaId = tienda.getId();
        List<String> values = parseCsvLine(line, delimiter);
        ProductoRequest request = new ProductoRequest();
        request.setTiendaId(tiendaId);
        request.setNombre(required(values, index, "nombre"));
        request.setSlugProducto(optional(values, index, "slugproducto"));
        request.setDescripcionLarga(firstOptional(values, index, "descripcionlarga", "descripcion"));
        request.setPrecio(parseBigDecimal(required(values, index, "precio"), "precio"));
        request.setPrecioCosto(parseOptionalBigDecimal(firstOptional(values, index, "preciocosto", "costo"), "precioCosto"));
        request.setPrecioOferta(parseOptionalBigDecimal(firstOptional(values, index, "preciooferta", "oferta"), "precioOferta"));
        request.setOfertaInicio(parseOptionalDate(firstOptional(values, index, "ofertainicio", "iniciodeoferta"), "ofertaInicio"));
        request.setOfertaFin(parseOptionalDate(firstOptional(values, index, "ofertafin", "findeoferta"), "ofertaFin"));
        request.setStock(parseInteger(required(values, index, "stock"), "stock"));
        request.setStockMinimo(parseOptionalInteger(firstOptional(values, index, "stockminimo", "minimo"), "stockMinimo"));
        request.setImagenUrl(firstOptional(values, index, "imagenurl", "imagen", "urlimagen"));
        request.setCategoriaId(resolveCategoriaId(tienda, values, index));
        request.setUnidadMedidaId(resolveUnidadMedidaId(tienda, values, index));
        return request;
    }

    private Long resolveCategoriaId(Tienda tienda, List<String> values, Map<String, Integer> index) {
        Long id = parseOptionalLong(firstOptional(values, index, "categoriaid", "idcategoria"), "categoriaId");
        if (id != null) return id;

        String nombre = firstOptional(values, index, "categorianombre", "categoria");
        if (!StringUtils.hasText(nombre)) return null;

        String nombreNormalizado = nombre.trim();
        return categoriaRepository.findByTiendaIdAndEstadoTrue(tienda.getId()).stream()
                .filter(c -> c.getNombre().equalsIgnoreCase(nombreNormalizado))
                .findFirst()
                .map(Categoria::getId)
                // Si la categoria no existe en la tienda, se crea automaticamente durante la importacion.
                .orElseGet(() -> crearCategoria(tienda, nombreNormalizado).getId());
    }

    private Categoria crearCategoria(Tienda tienda, String nombre) {
        Categoria categoria = new Categoria();
        categoria.setTienda(tienda);
        categoria.setNombre(nombre);
        categoria.setEstado(true);
        return categoriaRepository.save(categoria);
    }

    private Long resolveUnidadMedidaId(Tienda tienda, List<String> values, Map<String, Integer> index) {
        Long id = parseOptionalLong(firstOptional(values, index, "unidadmedidaid", "idunidadmedida"), "unidadMedidaId");
        if (id != null) return id;

        String nombre = firstOptional(values, index, "unidadmedidanombre", "unidadmedida", "unidad");
        if (!StringUtils.hasText(nombre)) return null;

        String nombreNormalizado = nombre.trim();
        String abreviatura = firstOptional(values, index, "unidadmedidaabreviatura", "abreviatura", "abrev");
        return unidadMedidaRepository.findByTiendaIdAndEstadoTrue(tienda.getId()).stream()
                .filter(u -> u.getNombre().equalsIgnoreCase(nombreNormalizado))
                .findFirst()
                .map(UnidadMedida::getId)
                // Si la unidad de medida no existe en la tienda, se crea automaticamente durante la importacion.
                .orElseGet(() -> crearUnidadMedida(tienda, nombreNormalizado, abreviatura).getId());
    }

    private UnidadMedida crearUnidadMedida(Tienda tienda, String nombre, String abreviatura) {
        UnidadMedida unidad = new UnidadMedida();
        unidad.setTienda(tienda);
        unidad.setNombre(nombre);
        if (StringUtils.hasText(abreviatura)) {
            unidad.setAbreviatura(abreviatura.trim());
        }
        unidad.setEstado(true);
        return unidadMedidaRepository.save(unidad);
    }

    private char detectDelimiter(String headerLine) {
        long semicolons = headerLine.chars().filter(c -> c == ';').count();
        long commas = headerLine.chars().filter(c -> c == ',').count();
        return semicolons > commas ? ';' : ',';
    }

    private String stripBom(String value) {
        return value != null && value.startsWith("\uFEFF") ? value.substring(1) : value;
    }

    private List<String> parseCsvLine(String line, char delimiter) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    quoted = !quoted;
                }
            } else if (c == delimiter && !quoted) {
                values.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString().trim());
        return values;
    }

    private Map<String, Integer> indexHeaders(List<String> headers) {
        Map<String, Integer> index = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) {
            String key = normalizeHeader(headers.get(i));
            if (StringUtils.hasText(key)) {
                index.put(key, i);
            }
        }
        return index;
    }

    private String normalizeHeader(String value) {
        if (value == null) {
            return "";
        }
        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private void validateRequiredHeader(Map<String, Integer> index, String header) {
        if (!index.containsKey(header)) {
            throw new OperationException("Falta la columna obligatoria '" + header + "'.");
        }
    }

    private String required(List<String> values, Map<String, Integer> index, String key) {
        String value = optional(values, index, key);
        if (!StringUtils.hasText(value)) {
            throw new OperationException("El campo '" + key + "' es obligatorio.");
        }
        return value;
    }

    private String firstOptional(List<String> values, Map<String, Integer> index, String... keys) {
        for (String key : keys) {
            String value = optional(values, index, key);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private String optional(List<String> values, Map<String, Integer> index, String key) {
        Integer position = index.get(key);
        if (position == null || position >= values.size()) {
            return null;
        }
        String value = values.get(position);
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal parseBigDecimal(String value, String field) {
        try {
            BigDecimal parsed = new BigDecimal(value.replace(",", "."));
            if (parsed.compareTo(BigDecimal.ZERO) <= 0) {
                throw new OperationException("El campo '" + field + "' debe ser mayor a 0.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new OperationException("El campo '" + field + "' debe ser numerico.");
        }
    }

    private BigDecimal parseOptionalBigDecimal(String value, String field) {
        return StringUtils.hasText(value) ? parseBigDecimal(value, field) : null;
    }

    private Integer parseInteger(String value, String field) {
        try {
            int parsed = Integer.parseInt(value);
            if (parsed < 0) {
                throw new OperationException("El campo '" + field + "' no puede ser negativo.");
            }
            return parsed;
        } catch (NumberFormatException ex) {
            throw new OperationException("El campo '" + field + "' debe ser entero.");
        }
    }

    private Integer parseOptionalInteger(String value, String field) {
        return StringUtils.hasText(value) ? parseInteger(value, field) : null;
    }

    private Long parseOptionalLong(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new OperationException("El campo '" + field + "' debe ser entero.");
        }
    }

    private LocalDateTime parseOptionalDate(String value, String field) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (RuntimeException ex) {
            throw new OperationException("El campo '" + field + "' debe tener formato yyyy-MM-ddTHH:mm.");
        }
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        return StringUtils.hasText(normalized) ? normalized : "producto";
    }

    // Al eliminar (baja logica) saca el producto de su cache y ademas invalida el catalogo.
    @Caching(evict = {
            @CacheEvict(value = "productos", key = "#tiendaId + '-' + #id"),
            @CacheEvict(value = "catalogo", allEntries = true)
    })
    @Transactional
    public void eliminar(Long tiendaId, Long id) {
        Producto producto = productoRepository.findByIdAndTiendaId(id, tiendaId)
                .orElseThrow(() -> new NotDataFoundException("Producto no encontrado"));
        producto.setEstado(false);
        productoRepository.save(producto);
    }
}
