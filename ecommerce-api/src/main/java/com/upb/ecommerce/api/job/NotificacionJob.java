package com.upb.ecommerce.api.job;

import com.upb.ecommerce.api.quartz.service.JobDto;
import com.upb.ecommerce.api.quartz.service.JobService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.InterruptableJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobKey;
import org.quartz.PersistJobDataAfterExecution;
import org.quartz.UnableToInterruptJobException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

/**
 * Job demostrativo de Quartz (equivalente al {@code EmailSenderJob} del proyecto del docente).
 *
 * <p>Se registra como job cron persistente desde {@link com.upb.ecommerce.api.QuartzJobInitializer}
 * y, por ahora, solo deja una traza en el log cada vez que se dispara. Es el esqueleto donde se
 * colocaría la lógica real (envío de notificaciones, etc.).
 *
 * <ul>
 *   <li>{@code @PersistJobDataAfterExecution}: guarda el JobDataMap tras cada ejecución
 *       (útil para contadores de reintento).</li>
 *   <li>{@code @DisallowConcurrentExecution}: evita que dos instancias del mismo job corran a la vez.</li>
 *   <li>Implementa {@code InterruptableJob} para poder detenerlo vía {@code JobService.stopJob(...)}.</li>
 * </ul>
 *
 * <p>No es un bean de Spring: lo instancia Quartz. Las dependencias {@code @Autowired} se inyectan
 * gracias al {@code AutowiringSpringBeanJobFactory} (job factory de Spring Boot).
 */
@Slf4j
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class NotificacionJob extends QuartzJobBean implements InterruptableJob {
    public static final String NAME_JOB = "NotificacionJob";
    private static final String NAME_TRIGGER = "NotificacionJob-trigger";

    @Autowired
    private JobService jobService;

    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        JobKey key = jobExecutionContext.getJobDetail().getKey();
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        log.info("[Quartz] Ejecutando job [{}] del grupo [{}] ...", key.getName(), key.getGroup());
    }

    /** Construye el {@link JobDto} que identifica este job dentro del grupo dado. */
    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(NotificacionJob.class);
        return jobDto;
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        log.info("[Quartz] Deteniendo el job {}", NAME_JOB);
    }
}
