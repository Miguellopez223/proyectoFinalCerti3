package com.upb.ecommerce.core.service;

import com.upb.ecommerce.core.dto.response.BusquedaResponse;
import com.upb.ecommerce.core.dto.response.CategoriaPopularResponse;
import com.upb.ecommerce.core.dto.response.FacetaTienda;
import com.upb.ecommerce.core.dto.response.HomeResponse;
import com.upb.ecommerce.core.dto.response.ProductoResponse;
import com.upb.ecommerce.core.dto.response.TiendaResponse;
import com.upb.ecommerce.data.repository.ProductoRepository;
import com.upb.ecommerce.data.repository.TiendaRepository;
import com.upb.ecommerce.domain.entities.Producto;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lógica del marketplace (cross-store): búsqueda con facetas por comercio, categorías
 * populares, secciones del home y recomendados. Todo público (sin login).
 */
@Service
public class MarketplaceService {

    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;

    public MarketplaceService(ProductoRepository productoRepository, TiendaRepository tiendaRepository) {
        this.productoRepository = productoRepository;
        this.tiendaRepository = tiendaRepository;
    }

    /**
     * Busca productos por coincidencia (normalizada) en nombre de producto, categoría o tienda.
     * Las facetas por tienda se calculan sobre TODAS las coincidencias (sin aplicar el filtro de
     * tienda), de modo que el usuario ve todas las tiendas con sus conteos y puede filtrar.
     */
    @Transactional(readOnly = true)
    public BusquedaResponse buscar(String q, Long tiendaId, String orden, int page, int size) {
        String termino = q == null ? "" : q.trim();
        int tam = size <= 0 ? 20 : size;
        int pag = Math.max(page, 0);

        List<ProductoResponse> coincidencias = termino.isEmpty()
                ? List.of()
                : productoRepository.buscarCoincidencias(termino).stream()
                        .map(ProductoResponse::fromEntity)
                        .toList();

        List<FacetaTienda> facetas = construirFacetas(coincidencias);

        List<ProductoResponse> filtrados = tiendaId == null
                ? new ArrayList<>(coincidencias)
                : coincidencias.stream().filter(p -> tiendaId.equals(p.getTiendaId())).toList();

        List<ProductoResponse> ordenados = ordenar(new ArrayList<>(filtrados), orden, termino);

        long total = ordenados.size();
        int desde = Math.min(pag * tam, ordenados.size());
        int hasta = Math.min(desde + tam, ordenados.size());

        BusquedaResponse resp = new BusquedaResponse();
        resp.setProductos(new ArrayList<>(ordenados.subList(desde, hasta)));
        resp.setTotal(total);
        resp.setPage(pag);
        resp.setSize(tam);
        resp.setTotalPaginas((int) Math.ceil((double) total / tam));
        resp.setFacetasTiendas(facetas);
        return resp;
    }

    /** Sugerencias del dropdown (typeahead): primeros N productos coincidentes por relevancia. */
    @Transactional(readOnly = true)
    public List<ProductoResponse> sugerencias(String q, int limit) {
        String termino = q == null ? "" : q.trim();
        if (termino.isEmpty()) return List.of();
        List<ProductoResponse> coincidencias = productoRepository.buscarCoincidencias(termino).stream()
                .map(ProductoResponse::fromEntity)
                .toList();
        return ordenar(new ArrayList<>(coincidencias), "relevante", termino).stream()
                .limit(Math.max(limit, 1))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoriaPopularResponse> categoriasPopulares(int limit) {
        return productoRepository.categoriasPopulares(Math.max(limit, 1)).stream()
                .map(r -> new CategoriaPopularResponse((String) r[0], ((Number) r[1]).longValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public HomeResponse home() {
        HomeResponse h = new HomeResponse();
        h.setMasBuscados(mapear(productoRepository.findRecientes(PageRequest.of(0, 10))));
        h.setOfertas(mapear(productoRepository.findOfertasVigentes(PageRequest.of(0, 10))));
        h.setDestacados(mapear(productoRepository.findDestacados(PageRequest.of(0, 10))));
        h.setTiendas(tiendaRepository.findByEstadoTrue().stream().map(TiendaResponse::fromEntity).toList());
        return h;
    }

    @Transactional(readOnly = true)
    public List<ProductoResponse> recomendados(Long productoId, int limit) {
        int n = Math.max(limit, 1);
        List<Producto> rec = productoRepository.recomendadosPorCategoria(productoId, n);
        if (rec.isEmpty()) {
            // Sin categoría o sin pares: caer a productos recientes, excluyendo el actual.
            return productoRepository.findRecientes(PageRequest.of(0, n + 1)).stream()
                    .filter(p -> !p.getId().equals(productoId))
                    .limit(n)
                    .map(ProductoResponse::fromEntity)
                    .toList();
        }
        return mapear(rec);
    }

    // ─── helpers ────────────────────────────────────────────────────────────────

    private static List<ProductoResponse> mapear(List<Producto> productos) {
        return productos.stream().map(ProductoResponse::fromEntity).toList();
    }

    private static List<FacetaTienda> construirFacetas(List<ProductoResponse> productos) {
        Map<Long, FacetaTienda> porTienda = new LinkedHashMap<>();
        for (ProductoResponse p : productos) {
            FacetaTienda f = porTienda.computeIfAbsent(
                    p.getTiendaId(), id -> new FacetaTienda(id, p.getTiendaNombre(), 0));
            f.setCantidad(f.getCantidad() + 1);
        }
        return porTienda.values().stream()
                .sorted(Comparator.comparingLong(FacetaTienda::getCantidad).reversed())
                .toList();
    }

    private static List<ProductoResponse> ordenar(List<ProductoResponse> productos, String orden, String termino) {
        String o = orden == null ? "relevante" : orden.toLowerCase();
        switch (o) {
            case "reciente" -> productos.sort(Comparator.comparing(ProductoResponse::getId, Comparator.reverseOrder()));
            case "precio_asc" -> productos.sort(Comparator.comparing(
                    ProductoResponse::getPrecioEfectivo, Comparator.nullsLast(Comparator.naturalOrder())));
            case "precio_desc" -> productos.sort(Comparator.comparing(
                    ProductoResponse::getPrecioEfectivo, Comparator.nullsLast(Comparator.reverseOrder())));
            case "descuento" -> productos.sort(Comparator.comparingInt(
                    (ProductoResponse p) -> p.getDescuentoPorcentaje() == null ? 0 : p.getDescuentoPorcentaje()).reversed());
            default -> { // relevante: coincidencia en el nombre primero, luego más reciente
                String t = norm(termino);
                productos.sort(Comparator
                        .comparingInt((ProductoResponse p) -> relevanciaNombre(p.getNombre(), t))
                        .thenComparing(ProductoResponse::getId, Comparator.reverseOrder()));
            }
        }
        return productos;
    }

    /** 0 = el nombre empieza con el término, 1 = lo contiene, 2 = no (match vino por categoría/tienda). */
    private static int relevanciaNombre(String nombre, String terminoNorm) {
        String n = norm(nombre);
        if (terminoNorm.isEmpty()) return 2;
        if (n.startsWith(terminoNorm)) return 0;
        if (n.contains(terminoNorm)) return 1;
        return 2;
    }

    /** Normaliza en Java (minúsculas + sin tildes) para el ranking de relevancia. */
    private static String norm(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }
}
