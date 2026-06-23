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

    public String construir(String tiendaNombre, String titulo, String saludo, String cuerpo,
                            String botonTexto, String botonUrl, String nota) {
        Context context = new Context();
        context.setVariable("tiendaNombre", tiendaNombre);
        context.setVariable("titulo", titulo);
        context.setVariable("saludo", saludo);
        context.setVariable("cuerpo", cuerpo);
        context.setVariable("botonTexto", botonTexto);
        context.setVariable("botonUrl", botonUrl);
        context.setVariable("nota", nota);
        context.setVariable("preheader", titulo);
        context.setVariable("anio", Year.now().getValue());
        return templateEngine.process("email/notificacion", context);
    }
}
