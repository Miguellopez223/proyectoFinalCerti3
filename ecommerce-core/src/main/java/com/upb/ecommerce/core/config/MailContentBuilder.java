package com.upb.ecommerce.core.config;

import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class MailContentBuilder {

    private final TemplateEngine templateEngine;

    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String sendPassword(String password) {
        Context context = new Context();
        context.setVariable("password", password);
        context.setVariable("imageResourceName", "banner");
        context.setVariable("imageX", "imageX");
        context.setVariable("imageLinkedin", "imageLinkedin");
        return templateEngine.process("mailPassword", context);
    }
}
