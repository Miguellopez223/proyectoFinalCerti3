package com.upb.ecommerce.api.quartz;

import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.Trigger;
import org.quartz.TriggerListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TriggerListner implements TriggerListener {

    @Override
    public String getName() {
        return "GlobalTriggerListener";
    }

    @Override
    public void triggerFired(Trigger trigger, JobExecutionContext context) {
        log.debug("[Quartz] Trigger disparado: {}", trigger.getKey().getName());
    }

    @Override
    public boolean vetoJobExecution(Trigger trigger, JobExecutionContext context) {
        return false;
    }

    @Override
    public void triggerMisfired(Trigger trigger) {
        log.warn("[Quartz] Trigger con misfire: {} — próxima ejecución: {}",
                trigger.getKey().getName(), trigger.getNextFireTime());
    }

    @Override
    public void triggerComplete(Trigger trigger, JobExecutionContext context,
                                Trigger.CompletedExecutionInstruction triggerInstructionCode) {
        log.debug("[Quartz] Trigger completado: {}", trigger.getKey().getName());
    }
}
