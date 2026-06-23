package com.upb.ecommerce.api.quartz.service;

import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;
/**
 * Listener global de jobs de Quartz. Por ahora son ganchos vacíos: aquí se podría auditar
 * cuándo va a ejecutarse, cuándo se vetó y cuándo terminó cada job.
 */
public class JobsListener implements JobListener {
    @Override
    public String getName() {
        return "globalJob";
    }

    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
    }

    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
    }

    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
    }
}
