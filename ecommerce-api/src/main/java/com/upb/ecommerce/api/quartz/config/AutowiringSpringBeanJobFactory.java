package com.upb.ecommerce.api.quartz.config;

import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

/**
 * JobFactory que permite usar {@code @Autowired} dentro de un Job de Quartz.
 *
 * <p>Quartz instancia los Jobs por su cuenta (no son beans de Spring), así que por defecto
 * no se les inyectan dependencias. Esta fábrica engancha el {@link AutowireCapableBeanFactory}
 * de Spring para autoconectar el Job recién creado antes de ejecutarlo.
 */
public final class AutowiringSpringBeanJobFactory extends SpringBeanJobFactory implements
        ApplicationContextAware {

    private transient AutowireCapableBeanFactory beanFactory;

    @Override
    public void setApplicationContext(final ApplicationContext context) {
        beanFactory = context.getAutowireCapableBeanFactory();
    }

    @Override
    protected Object createJobInstance(final TriggerFiredBundle bundle) throws Exception {
        final Object job = super.createJobInstance(bundle);
        beanFactory.autowireBean(job);
        return job;
    }
}
