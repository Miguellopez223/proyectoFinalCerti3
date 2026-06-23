package com.upb.ecommerce.core.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;

@Component
public class MailContentBuilder {

    private final TemplateEngine templateEngine;

    @Autowired
    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String build(String message) {
        Context context = new Context();
        context.setVariable("message", message);
        return templateEngine.process("mailTemplate", context);
    }

    public String buildCarritoAbandonado(String nombreCliente, int cantidadItems, BigDecimal total) {
        Context context = new Context();
        context.setVariable("nombreCliente", nombreCliente);
        context.setVariable("cantidadItems", cantidadItems);
        context.setVariable("total", total);
        return templateEngine.process("mailCarritoAbandonado", context);
    }

    public String sendPassword(String password) {
        Context ctx = new Context();
        ctx.setVariable("password", password);
        return templateEngine.process("mailPassword", ctx);
    }
}
