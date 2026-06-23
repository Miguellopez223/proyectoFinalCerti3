package com.upb.ecommerce.api.jobs;

import com.upb.ecommerce.api.quartz.JobDto;
import com.upb.ecommerce.core.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

@Slf4j
public class EmailSenderJob implements Job {

    private static final String JOB_NAME = "EmailSenderJob";

    /** Inyectado por AutowiringSpringBeanJobFactory en cada ejecución. */
    @Autowired
    private EmailService emailService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        log.info("[Quartz] EmailSenderJob ejecutado: {}", LocalDateTime.now());
        // TODO: procesar cola de correos pendientes vía emailService
        // Ejemplo: emailService.procesarPendientes();
    }

    /** Retorna el descriptor de este job para ser registrado por JobInitializer. */
    public static JobDto getJobDto(String groupName) {
        return JobDto.builder()
                .jobName(JOB_NAME)
                .groupName(groupName)
                .jobClass(EmailSenderJob.class)
                .build();
    }
}
