package com.upb.ecommerce.api.quartz;

import org.quartz.impl.triggers.CronTriggerImpl;
import org.springframework.scheduling.quartz.CronTriggerFactoryBean;

import java.text.ParseException;

/**
 * CronTriggerFactoryBean con política de misfire MISFIRE_INSTRUCTION_DO_NOTHING,
 * necesaria para que el trigger persista en la base de datos sin dispararse
 * inmediatamente cuando la aplicación arranca después de un período de inactividad.
 */
public class PersistableCronTriggerFactoryBean extends CronTriggerFactoryBean {

    @Override
    public void afterPropertiesSet() throws ParseException {
        super.afterPropertiesSet();
        // getObject() devuelve la interfaz CronTrigger; la impl concreta es CronTriggerImpl
        ((CronTriggerImpl) getObject())
                .setMisfireInstruction(CronTriggerImpl.MISFIRE_INSTRUCTION_DO_NOTHING);
    }
}
