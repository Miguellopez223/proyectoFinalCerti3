package com.upb.ecommerce.core.config;

import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.Year;

@Component
public class MailContentBuilder {

    private final TemplateEngine templateEngine;

    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String construir(String tiendaNombre, String titulo, String saludo,
                            String cuerpo, String botonTexto, String botonUrl, String nota) {
        Context ctx = new Context();
        ctx.setVariable("tiendaNombre", tiendaNombre);
        ctx.setVariable("titulo", titulo);
        ctx.setVariable("saludo", saludo);
        ctx.setVariable("cuerpo", cuerpo);
        ctx.setVariable("botonTexto", botonTexto);
        ctx.setVariable("botonUrl", botonUrl);
        ctx.setVariable("nota", nota);
        ctx.setVariable("preheader", titulo);
        ctx.setVariable("anio", Year.now().getValue());
        return templateEngine.process("email/notificacion", ctx);
    }
}
