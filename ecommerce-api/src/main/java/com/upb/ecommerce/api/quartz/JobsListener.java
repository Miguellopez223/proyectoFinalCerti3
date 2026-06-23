package com.upb.ecommerce.api.quartz;

import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JobsListener implements JobListener {

    @Override
    public String getName() {
        return "GlobalJobListener";
    }

    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        log.debug("[Quartz] Job a ejecutar: {}.{}",
                context.getJobDetail().getKey().getGroup(),
                context.getJobDetail().getKey().getName());
    }

    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        log.warn("[Quartz] Ejecución vetada: {}.{}",
                context.getJobDetail().getKey().getGroup(),
                context.getJobDetail().getKey().getName());
    }

    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException exception) {
        if (exception != null) {
            log.error("[Quartz] Job falló: {}.{} — {}",
                    context.getJobDetail().getKey().getGroup(),
                    context.getJobDetail().getKey().getName(),
                    exception.getMessage());
        } else {
            log.debug("[Quartz] Job completado: {}.{}",
                    context.getJobDetail().getKey().getGroup(),
                    context.getJobDetail().getKey().getName());
        }
    }
}
