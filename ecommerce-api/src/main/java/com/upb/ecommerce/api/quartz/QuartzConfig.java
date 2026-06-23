package com.upb.ecommerce.api.quartz;

import org.springframework.boot.quartz.autoconfigure.SchedulerFactoryBeanCustomizer;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuartzConfig {

    /**
     * Customiza el SchedulerFactoryBean que Spring Boot auto-configura con las
     * propiedades spring.quartz.*:
     *   • registra AutowiringSpringBeanJobFactory para que Quartz pueda inyectar
     *     beans de Spring en los Jobs.
     *   • registra los listeners globales de jobs y triggers.
     */
    @Bean
    public SchedulerFactoryBeanCustomizer schedulerCustomizer(ApplicationContext ctx,
                                                               JobsListener jobsListener,
                                                               TriggerListner triggerListner) {
        return factoryBean -> {
            AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
            jobFactory.setApplicationContext(ctx);
            factoryBean.setJobFactory(jobFactory);
            factoryBean.setGlobalJobListeners(jobsListener);
            factoryBean.setGlobalTriggerListeners(triggerListner);
        };
    }
}
