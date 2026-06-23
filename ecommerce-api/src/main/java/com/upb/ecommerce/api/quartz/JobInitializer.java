package com.upb.ecommerce.api.quartz;

import com.upb.ecommerce.api.jobs.EmailSenderJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
public class JobInitializer {

    private final JobService jobService;

    public JobInitializer(JobService jobService) {
        this.jobService = jobService;
    }

    /**
     * Se ejecuta una sola vez, cuando la aplicación termina de arrancar.
     * Registra los jobs en Quartz sólo si no existen ya en el store JDBC
     * (idempotente: seguro ante reinicios).
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initJobs() {
        log.info("[Quartz] Inicializando jobs de Quartz...");

        JobDto jobDto = EmailSenderJob.getJobDto(JobUtil.GROUP_NAME);
        if (!jobService.existJobName(jobDto.getGroupName(), jobDto.getJobName())) {
            jobService.scheduleCronJob(
                    jobDto,
                    new Date(),
                    CronExpressionConstant.CRON_CADA_HORA,
                    null,
                    "Este Job envia correos");
            log.info("[Quartz] EmailSenderJob registrado exitosamente.");
        } else {
            log.info("[Quartz] EmailSenderJob ya existía en el store, omitiendo registro.");
        }
    }
}
