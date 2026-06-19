package com.upb.ecommerce.api.quartz.config;

import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;

/**
 * Versión del {@link SimpleTriggerFactoryBean} para Quartz con {@code useProperties=true}.
 * Igual que {@link PersistableCronTriggerFactoryBean} pero para triggers simples (one-time /
 * con repeticiones): elimina del JobDataMap la referencia al JobDetail que no se puede persistir.
 *
 * @see <a href="http://site.trimplement.com/using-spring-and-quartz-with-jobstore-properties/">Referencia</a>
 */
public class PersistableSingleTriggerFactoryBean extends SimpleTriggerFactoryBean {
    public static final String JOB_DETAIL_KEY = "jobDetail";

    @Override
    public void afterPropertiesSet() {
        super.afterPropertiesSet();
        getJobDataMap().remove(JOB_DETAIL_KEY);
    }
}
