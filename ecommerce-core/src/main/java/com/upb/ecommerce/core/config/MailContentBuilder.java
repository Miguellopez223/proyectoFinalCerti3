package com.upb.ecommerce.core.config;

import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Year;

/**
 * Construye el cuerpo HTML de los correos renderizando plantillas Thymeleaf
 * (mismo patrón que el {@code MailContentBuilder} del proyecto de referencia del docente).
 *
 * <p>La plantilla {@code templates/email/notificacion.html} es genérica y reutilizable:
 * recibe título, saludo, cuerpo, un botón opcional y una nota opcional.
 */
@Component
public class MailContentBuilder {

    private final TemplateEngine templateEngine;

    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /**
     * Renderiza la plantilla de notificación con los datos dados.
     *
     * @param tiendaNombre nombre de la tienda (encabezado y pie)
     * @param titulo       título principal
     * @param saludo       línea de saludo (ej. "Hola Ana,")
     * @param cuerpoHtml   cuerpo del mensaje (admite HTML)
     * @param botonTexto   texto del botón (o null/"" para ocultarlo)
     * @param botonUrl     URL del botón (o null/"" para ocultarlo)
     * @param nota         nota secundaria en la caja informativa (o null/"" para ocultarla)
     * @return el HTML final del correo
     */
    public String construir(String tiendaNombre, String titulo, String saludo, String cuerpoHtml,
                            String botonTexto, String botonUrl, String nota) {
        Context ctx = new Context();
        ctx.setVariable("preheader", titulo);
        ctx.setVariable("tiendaNombre", tiendaNombre);
        ctx.setVariable("titulo", titulo);
        ctx.setVariable("saludo", saludo);
        ctx.setVariable("cuerpo", cuerpoHtml);
        ctx.setVariable("botonTexto", botonTexto);
        ctx.setVariable("botonUrl", botonUrl);
        ctx.setVariable("nota", nota);
        ctx.setVariable("anio", String.valueOf(Year.now().getValue()));
        return templateEngine.process("email/notificacion", ctx);
    }
}
