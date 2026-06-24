package com.upb.ecommerce.core.dto.response;

import com.upb.ecommerce.domain.entities.Tienda;
import lombok.Data;

@Data
public class TiendaResponse {

    private Long id;
    private String nombre;
    private String slug;
    private String descripcion;
    private String bannerUrl;
    private String telefonoContacto;
    private String emailContacto;
    private String logoUrl;
    private Boolean estado;

    public static TiendaResponse fromEntity(Tienda t) {
        TiendaResponse r = new TiendaResponse();
        r.setId(t.getId());
        r.setNombre(t.getNombre());
        r.setSlug(t.getSlug());
        r.setDescripcion(t.getDescripcion());
        r.setBannerUrl(t.getBannerUrl());
        r.setTelefonoContacto(t.getTelefonoContacto());
        r.setEmailContacto(t.getEmailContacto());
        r.setLogoUrl(t.getLogoUrl());
        r.setEstado(t.getEstado());
        return r;
    }
}
