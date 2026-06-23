package com.upb.ecommerce.api.quartz;

import org.quartz.SimpleTrigger;
import org.quartz.impl.triggers.SimpleTriggerImpl;
import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;

/**
 * SimpleTriggerFactoryBean con política de misfire
 * MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT, para que un trigger
 * de disparo único persista correctamente y no se re-ejecute al reiniciar.
 */
public class PersistableSingleTriggerFactoryBean extends SimpleTriggerFactoryBean {

    @Override
    public void afterPropertiesSet() {
        super.afterPropertiesSet();
        // getObject() devuelve la interfaz SimpleTrigger; la impl concreta es SimpleTriggerImpl
        ((SimpleTriggerImpl) getObject())
                .setMisfireInstruction(
                        SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT);
    }
}
