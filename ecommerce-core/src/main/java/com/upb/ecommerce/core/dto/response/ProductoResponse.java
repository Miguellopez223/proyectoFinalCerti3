package com.upb.ecommerce.core.dto.response;

import com.upb.ecommerce.domain.entities.Producto;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Data
public class ProductoResponse {

    private Long id;
    private Long tiendaId;
    private String tiendaNombre;
    private String tiendaSlug;
    private Long categoriaId;
    private String categoriaNombre;
    private Long unidadMedidaId;
    private String unidadMedidaNombre;
    private String nombre;
    private String slugProducto;
    private String descripcionLarga;
    private BigDecimal precio;
    private BigDecimal precioCosto;
    private BigDecimal precioOferta;
    private LocalDateTime ofertaInicio;
    private LocalDateTime ofertaFin;
    /** Derivados (calculados en el servidor, según la vigencia de la oferta). */
    private Boolean enOferta;
    private BigDecimal precioEfectivo;
    private Integer descuentoPorcentaje;
    private Integer stock;
    private Integer stockMinimo;
    private String imagenUrl;
    private Boolean estado;

    public static ProductoResponse fromEntity(Producto p) {
        ProductoResponse r = new ProductoResponse();
        r.setId(p.getId());
        r.setTiendaId(p.getTienda().getId());
        r.setTiendaNombre(p.getTienda().getNombre());
        r.setTiendaSlug(p.getTienda().getSlug());
        if (p.getCategoria() != null) {
            r.setCategoriaId(p.getCategoria().getId());
            r.setCategoriaNombre(p.getCategoria().getNombre());
        }
        if (p.getUnidadMedida() != null) {
            r.setUnidadMedidaId(p.getUnidadMedida().getId());
            r.setUnidadMedidaNombre(p.getUnidadMedida().getNombre());
        }
        r.setNombre(p.getNombre());
        r.setSlugProducto(p.getSlugProducto());
        r.setDescripcionLarga(p.getDescripcionLarga());
        r.setPrecio(p.getPrecio());
        r.setPrecioCosto(p.getPrecioCosto());
        r.setPrecioOferta(p.getPrecioOferta());
        r.setOfertaInicio(p.getOfertaInicio());
        r.setOfertaFin(p.getOfertaFin());
        boolean enOferta = ofertaVigente(p);
        r.setEnOferta(enOferta);
        r.setPrecioEfectivo(enOferta ? p.getPrecioOferta() : p.getPrecio());
        r.setDescuentoPorcentaje(enOferta ? calcularDescuento(p.getPrecio(), p.getPrecioOferta()) : null);
        r.setStock(p.getStock());
        r.setStockMinimo(p.getStockMinimo());
        r.setImagenUrl(p.getImagenUrl());
        r.setEstado(p.getEstado());
        return r;
    }

    /** Una oferta está vigente si hay precioOferta menor al precio y la fecha actual cae en su ventana. */
    private static boolean ofertaVigente(Producto p) {
        if (p.getPrecioOferta() == null || p.getPrecio() == null) return false;
        if (p.getPrecioOferta().compareTo(p.getPrecio()) >= 0) return false;
        LocalDateTime ahora = LocalDateTime.now();
        if (p.getOfertaInicio() != null && ahora.isBefore(p.getOfertaInicio())) return false;
        if (p.getOfertaFin() != null && ahora.isAfter(p.getOfertaFin())) return false;
        return true;
    }

    /** Porcentaje de descuento redondeado: (precio - oferta) / precio * 100. */
    private static Integer calcularDescuento(BigDecimal precio, BigDecimal oferta) {
        if (precio == null || oferta == null || precio.signum() <= 0) return null;
        return precio.subtract(oferta)
                .multiply(BigDecimal.valueOf(100))
                .divide(precio, 0, RoundingMode.HALF_UP)
                .intValue();
    }
}
