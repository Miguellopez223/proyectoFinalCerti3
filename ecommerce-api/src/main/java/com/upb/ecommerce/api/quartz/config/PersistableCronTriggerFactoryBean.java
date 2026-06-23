package com.upb.ecommerce.api.quartz.config;

import org.springframework.scheduling.quartz.CronTriggerFactoryBean;

import java.text.ParseException;

/**
 * Necesario para usar Quartz con {@code useProperties=true} junto con clases de Spring,
 * porque Spring deja en el JobDataMap una referencia a un objeto (el JobDetail) que no es
 * un String y no se puede persistir. Aquí se elimina esa entrada del mapa.
 *
 * @see <a href="http://site.trimplement.com/using-spring-and-quartz-with-jobstore-properties/">Referencia</a>
 */
public class PersistableCronTriggerFactoryBean extends CronTriggerFactoryBean {

    public static final String JOB_DETAIL_KEY = "jobDetail";

    @Override
    public void afterPropertiesSet() throws ParseException {
        super.afterPropertiesSet();

        // Quita el elemento JobDetail (objeto no serializable como String)
        getJobDataMap().remove(JOB_DETAIL_KEY);
    }
}
