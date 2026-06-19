package com.upb.ecommerce.api.quartz.service;

import com.upb.ecommerce.core.exception.OperationException;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.quartz.Trigger.TriggerState;
import org.quartz.impl.matchers.GroupMatcher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.text.ParseException;
import java.util.*;

/**
 * Implementación de {@link JobService} sobre el {@code Scheduler} de Quartz que Spring Boot
 * autoconfigura a partir del {@link SchedulerFactoryBean}.
 */
@Slf4j
@Service
public class JobServiceImpl implements JobService {
    @Autowired
    @Lazy
    private SchedulerFactoryBean schedulerFactoryBean;
    @Autowired
    private ApplicationContext context;

    private JobKey getJobKey(String groupName, String paramJobName) throws SchedulerException {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                String jobName = jobKey.getName();
                if (jobName != null && jobName.equals(paramJobName))
                    return jobKey;
            }
        } catch (Exception e) {
            log.error("Error inesperado al obtener el jobKey, causa:[{}] ", e.getMessage(), e);
            throw e;
        }
        return null;
    }

    @Override
    public String getJobNameStartWith(String groupName, String paramJobName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                if (jobKey.getName() != null && jobKey.getName().startsWith(paramJobName))
                    return jobKey.getName();
            }
        } catch (Exception e) {
            log.error("Error inesperado al obtener el jobName, causa:[{}] ", e.getMessage());
        }
        return null;
    }

    @Override
    public boolean existJobName(String groupName, String paramJobName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                if (jobKey.getName() != null && jobKey.getName().equals(paramJobName))
                    return true;
            }
        } catch (Exception e) {
            log.error("Error inesperado al obtener el jobName. ", e);
        }
        return false;
    }

    @Override
    public boolean existJobName(String groupName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            Set<JobKey> jobKeySet = scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName));
            return !jobKeySet.isEmpty();
        } catch (Exception e) {
            log.error("Error inesperado al obtener el jobName. ", e);
        }
        return false;
    }

    @Override
    public boolean existJobNameStartWith(String groupName, String paramJobNameStartWith) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                if (jobKey.getName() != null && jobKey.getName().startsWith(paramJobNameStartWith))
                    return true;
            }
        } catch (Exception e) {
            log.error("Error inesperado al obtener el jobName. ", e);
        }
        return false;
    }

    @Override
    public boolean createJob(String groupName, String jobName, Class<? extends QuartzJobBean> jobClass, Map<String, String> data, String description) {
        log.info("[{}] [{}] Creando job ", groupName, jobName);
        JobDetail jobDetail = JobUtil.createJob(jobClass, true, context, jobName, groupName, data, description);
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            scheduler.addJob(jobDetail, true);
        } catch (SchedulerException e) {
            log.error("Error al crear el job", e);
        }
        return true;
    }

    @Override
    public boolean scheduleOneTimeJob(JobDto jobDto, Date startTime, Map<String, String> data, int repeatCount, long repeatInterval, String description) {
        return scheduleOneTimeJob(jobDto.getGroupName(), jobDto.getJobName(), jobDto.getTriggerKey(), jobDto.getJobClass(), startTime, data, repeatCount, repeatInterval, description);
    }

    /**
     * Programa un job de ejecución única (con posibles repeticiones) para una fecha dada.
     */
    @Override
    public boolean scheduleOneTimeJob(String groupName, String jobName, String triggerKey, Class<? extends QuartzJobBean> jobClass, Date startTime, Map<String, String> data, int repeatCount, long repeatInterval, String description) {
        log.info("[{}] [{}] Creando job", groupName, jobName);
        data.put(JobUtil.KEY_ATTEMPT, String.valueOf(0));
        data.put(JobUtil.KEY_MAX_ATTEMPT, String.valueOf(repeatCount));

        JobDetail jobDetail = JobUtil.createJob(jobClass, false, context, jobName, groupName, data, description);
        log.info("[{}] [{}] Creando trigger con nombre: [{}] ", groupName, jobName, triggerKey);
        Date st = new Date(startTime.getTime() - repeatInterval);
        Trigger cronTriggerBean = JobUtil.createSingleTrigger(null, triggerKey, st, SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NOW_WITH_REMAINING_REPEAT_COUNT, repeatCount, repeatInterval, data);
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            Date dt = scheduler.scheduleJob(jobDetail, cronTriggerBean);
            log.info("[{}] [{}] Job creado exitosamente para ejecutarse en : [{}]", groupName, jobName, dt);
            return true;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al crear el job", groupName, jobName, e);
        }
        return false;
    }

    @Override
    public boolean createTriggerOneTimeJob(String groupName, String jobName, String triggerKey, Date startTime, Map<String, String> data, int repeatCount, long repeatInterval) {
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            JobKey jkey = new JobKey(jobName, groupName);
            JobDetail jobDetail = scheduler.getJobDetail(jkey);
            JobUtil.createSingleTrigger(jobDetail, triggerKey, startTime, SimpleTrigger.MISFIRE_INSTRUCTION_RESCHEDULE_NEXT_WITH_REMAINING_COUNT, repeatCount, repeatInterval, data);
            return true;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al crear el trigger:[{}] ", groupName, jobName, triggerKey, e);
        }
        return false;
    }

    @Override
    public void scheduleCronJob(JobDto jobDto, Date startTime, String cronExpression, Map<String, String> data, String description) {
        scheduleCronJob(jobDto.getGroupName(), jobDto.getJobName(), jobDto.getTriggerKey(), jobDto.getJobClass(), startTime, cronExpression, data, description);
    }

    /**
     * Programa un job cron con la expresión dada.
     */
    @Override
    public void scheduleCronJob(String groupName, String jobName, String triggerKey, Class<? extends QuartzJobBean> jobClass, Date startTime, String cronExpression, Map<String, String> data, String description) {
        JobDetail jobDetail = JobUtil.createJob(jobClass, false, context, jobName, groupName, data, description);
        try {
            Trigger cronTriggerBean = JobUtil.createCronTrigger(null, triggerKey, startTime, cronExpression, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW, data);
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            scheduler.scheduleJob(jobDetail, cronTriggerBean);
        } catch (ObjectAlreadyExistsException e) {
            log.error("[{}] [{}] Ya existe el cronJob [{}]", groupName, jobName, triggerKey);
            // NO se lanza ninguna excepción
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error SchedulerException al crear cronJob:[{}] ", groupName, jobName, triggerKey, e);
            throw new OperationException("Error al crear cronJob.");
        } catch (ParseException e) {
            log.error("[{}] [{}] Error  ParseException al crear cronJob:[{}] ", groupName, jobName, triggerKey, e);
            throw new OperationException("Error al crear cronJob.");
        }
    }

    @Override
    public void createTrigger(String groupName, String jobName, String triggerKey, Date date, String cronExpression, Map<String, String> data) {
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            JobKey jkey = new JobKey(jobName, groupName);
            JobDetail jobDetail = scheduler.getJobDetail(jkey);
            Trigger cronTriggerBean = JobUtil.createCronTrigger(jobDetail, triggerKey, date, cronExpression, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW, data);
            scheduler.scheduleJob(cronTriggerBean);
            log.info("[{}] [{}] Se ha creado exitosamente el trigger:[{}] ", groupName, jobName, triggerKey);
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error SchedulerException al crear cronTrigger:[{}] ", groupName, jobName, triggerKey, e);
            throw new OperationException("Error al crear cronJob.");
        } catch (ParseException e) {
            log.error("[{}] [{}] Error  ParseException al crear cronTrigger:[{}] ", groupName, jobName, triggerKey, e);
            throw new OperationException("Error al crear cronJob.");
        }
    }

    /**
     * Reprograma un job de ejecución única.
     */
    @Override
    public boolean updateOneTimeJob(String jobKey, Date date) {
        try {
            Trigger newTrigger = JobUtil.createSingleTrigger(jobKey, date, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW);
            schedulerFactoryBean.getScheduler().rescheduleJob(TriggerKey.triggerKey(jobKey), newTrigger);
            return true;
        } catch (Exception e) {
            log.error("SchedulerException while updating one time job with key :" + jobKey, e);
            return false;
        }
    }

    @Override
    public boolean updateOneTimeJob(String groupName, String jobName, Date date) {
        if (jobName == null || jobName.trim().length() == 0) {
            log.error("[{}] [{}] Error jobName no valido", groupName, jobName);
            return false;
        }
        JobKey jobKey = new JobKey(jobName, groupName);
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);

            SimpleTrigger simpleTrigger = null;
            for (Trigger trigger : triggers) {
                log.info("Nombre de Trigger: [{}]", trigger.getKey().getName());
                if (trigger instanceof SimpleTrigger) {
                    log.info("Se encontro cronTrigger:[{}]", trigger.getKey().getName());
                    simpleTrigger = (SimpleTrigger) trigger;
                    break;
                }
            }
            if (simpleTrigger == null) {
                log.error("No se encontro ningun cronTrigger");
                throw new OperationException("No se encontro ningun trigger");
            }

            JobDetail jobDetail = scheduler.getJobDetail(jobKey);
            Map<String, String> data = JobUtil.getMap(jobDetail.getJobDataMap());

            TriggerKey oldTriggerKey = triggers.get(0).getKey();
            Trigger newTrigger = JobUtil.createSingleTrigger(oldTriggerKey.getName(), date, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW, data);
            Date dt = schedulerFactoryBean.getScheduler().rescheduleJob(oldTriggerKey, newTrigger);
            log.info("updateCronJob jobKey :" + jobKey.getName() + " rescheduled successfully for date :" + dt);
            return false;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] SchedulerException. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ] revise los intervalos");
        } catch (Exception e) {
            log.error("[{}] [{}] Exception. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]");
        }
    }

    @Override
    public boolean updateCronJob(String groupName, String jobName, Date startTime, String cronExpression) {
        if (jobName == null || jobName.trim().isEmpty()) {
            log.error("[{}] [{}] Error jobName no valido", groupName, jobName);
            return false;
        }
        JobKey jobKey = new JobKey(jobName, groupName);
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
            if (cronExpression == null) {
                cronExpression = ((CronTrigger) triggers.get(0)).getCronExpression();
            } else {
                CronTrigger cronTrigger = null;
                for (Trigger trigger : triggers) {
                    if (trigger instanceof CronTrigger) {
                        cronTrigger = (CronTrigger) trigger;
                        break;
                    }
                }
                if (cronTrigger == null) {
                    log.error("[{}, {} ] No se encontro ningun cronTrigger", groupName, jobName);
                    throw new OperationException("No se encontro ningun trigger");
                }
                String oldCronExpresion = cronTrigger.getCronExpression();
                if (oldCronExpresion.equals(cronExpression)) {
                    return false;
                }
            }
            JobDetail jobDetail = scheduler.getJobDetail(jobKey);
            Map<String, String> data = JobUtil.getMap(jobDetail.getJobDataMap());
            JobDetail newJobDetail = JobUtil.createJob((Class<? extends QuartzJobBean>) jobDetail.getJobClass(), false, context, jobName, jobKey.getGroup(), data, jobDetail.getDescription());

            TriggerKey oldTriggerKey = triggers.get(0).getKey();

            Trigger newTrigger = JobUtil.createCronTrigger(newJobDetail, oldTriggerKey.getName(), startTime, cronExpression, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW, data);
            return false;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] SchedulerException. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]. Considere revisar la expresion cron [" + cronExpression + "]");
        } catch (ParseException e) {
            log.error("[{}] [{}] ParseException. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]");
        } catch (Exception e) {
            log.error("[{}] [{}] Exception. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]");
        }
    }

    @Override
    public boolean updateCronJob(String groupName, String jobName, String triggerName, Date date, String cronExpression) {
        JobKey jobKey = new JobKey(jobName, groupName);
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
            if (cronExpression == null) {
                cronExpression = ((CronTrigger) triggers.get(0)).getCronExpression();
            } else {
                CronTrigger cronTrigger = null;
                for (Trigger trigger : triggers) {
                    if (trigger instanceof CronTrigger && trigger.getKey().getName().equals(triggerName)) {
                        cronTrigger = (CronTrigger) trigger;
                    }
                }
                if (cronTrigger == null) {
                    log.error("No se encontro ningun cronTrigger");
                    throw new OperationException("No se encontro ningun trigger");
                }
                String oldCronExpresion = cronTrigger.getCronExpression();
                if (oldCronExpresion.equals(cronExpression)) {
                    return true; // no es necesario actualizar, misma CronExpression
                }
            }
            JobDetail jobDetail = scheduler.getJobDetail(jobKey);
            Map<String, String> data = JobUtil.getMap(jobDetail.getJobDataMap());
            JobDetail newJobDetail = JobUtil.createJob((Class<? extends QuartzJobBean>) jobDetail.getJobClass(), false, context, jobName, jobKey.getGroup(), data, jobDetail.getDescription());

            TriggerKey oldTriggerKey = triggers.get(0).getKey();

            Trigger newTrigger = JobUtil.createCronTrigger(newJobDetail, oldTriggerKey.getName(), date, cronExpression, SimpleTrigger.MISFIRE_INSTRUCTION_FIRE_NOW, data);

            Date dt = schedulerFactoryBean.getScheduler().rescheduleJob(oldTriggerKey, newTrigger);
            log.info("updateCronJob jobKey :" + jobKey.getName() + " rescheduled successfully for date :" + dt);
            return false;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] SchedulerException. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]. Considere revisar la expresion cron [" + cronExpression + "]");
        } catch (ParseException e) {
            log.error("[{}] [{}] ParseException. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]");
        } catch (Exception e) {
            log.error("[{}] [{}] Exception. Error al reprogramar el job", groupName, jobName, e);
            throw new OperationException("Excepcion al reprogramar el job: [" + groupName + " , " + jobName + " ]");
        }
    }

    @Override
    public boolean jobWillStartIn(String groupName, String jobName, Integer secondsToStart) {
        try {
            if (jobName == null) {
                return false;
            } else if (!existJobName(groupName, jobName)) {
                return false;
            }
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            JobKey jobKey = getJobKey(groupName, jobName);
            if (jobKey == null) return false;
            List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
        } catch (Exception e) {
            log.error("jobWillStartIn exception with key: " + jobName + ", message: " + e.getMessage(), e);
        }
        return false;
    }

    /**
     * Quita el trigger indicado del scheduler. Si el job no tiene más triggers y no es durable,
     * también se elimina.
     */
    @Override
    public boolean unScheduleJob(String jobName) {
        log.info("Request received for Unscheduleding job.");
        TriggerKey tkey = new TriggerKey(jobName);
        log.info("Parameters received for unscheduling job : tkey :" + jobName);
        try {
            boolean status = schedulerFactoryBean.getScheduler().unscheduleJob(tkey);
            log.info("Trigger associated with jobKey :" + jobName + " unscheduled with status :" + status);
            return status;
        } catch (SchedulerException e) {
            log.error("SchedulerException while unscheduling job with key :" + jobName + " message :" + e.getMessage());
            log.error("{}", e);
            return false;
        }
    }

    /**
     * Elimina el job identificado del scheduler y los triggers asociados.
     */
    @Override
    public boolean deleteJob(String jobName, String groupName) {
        JobKey jkey = new JobKey(jobName, groupName);
        log.info("[{}] [{}] Eliminando job", groupName, jobName);
        try {
            boolean status = schedulerFactoryBean.getScheduler().deleteJob(jkey);
            log.info("[{}] [{}] Job eliminado satisfactoriamente", groupName, jobName);
            return status;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al eliminanar job", groupName, jobName, e);
            return false;
        }
    }

    /**
     * Pausa un job.
     */
    @Override
    public boolean pauseJob(String groupKey, String jobName) {
        log.info("[{}] [{}] Pausando el job", groupKey, jobName);
        JobKey jkey = new JobKey(jobName, groupKey);
        try {
            schedulerFactoryBean.getScheduler().pauseJob(jkey);
            log.info("[{}] [{}] Se pauso correctamente el job", groupKey, jobName);
            return true;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al pausar el job. causa: {}", groupKey, jobName, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean pauseJob(JobDto jobDto) {
        return pauseJob(jobDto.getGroupName(), jobDto.getJobName());
    }

    /**
     * Reanuda un job pausado.
     */
    @Override
    public boolean resumeJob(String groupKey, String jobName) {
        log.info("[{}] [{}] Reiniciando el job", groupKey, jobName);
        JobKey jKey = new JobKey(jobName, groupKey);
        try {
            schedulerFactoryBean.getScheduler().resumeJob(jKey);
            log.info("[{}] [{}] Job reiniciado correctamente", groupKey, jobName);
            return true;
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al reiniciar el job. causa: {}", groupKey, jobName, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean resumeJob(JobDto jobDto) {
        return resumeJob(jobDto.getGroupName(), jobDto.getJobName());
    }

    /**
     * Ejecuta un job inmediatamente creando un trigger de ejecución inmediata.
     *
     * @throws OperationException si el job no se encuentra o si ocurre cualquier error.
     */
    @Override
    public void startJobNow(String groupKey, String jobKey, JobDataMap data) throws OperationException {
        try {
            JobKey jKey = getJobKey(groupKey, jobKey);
            log.info("[{}] [{}] Ejecutando la funcion startNow", groupKey, jobKey);
            schedulerFactoryBean.getScheduler().triggerJob(jKey);
            log.info("[{}] [{}] El Job se ejecutó de manera correcta", groupKey, jobKey);
        } catch (SchedulerException e) {
            log.error("[{}] [{}] El job no se logró ejecutar de manera correcta. causa:{}", groupKey, jobKey, e.getMessage());
            throw new OperationException("Se generó una excepción al ejecutar el job:" + jobKey);
        }
    }

    @Override
    public void startJobNow(JobDto jobDto, JobDataMap data) throws OperationException {
        JobKey jKey = new JobKey(jobDto.getJobName(), jobDto.getGroupName());
        log.info("[{}] [{}] Ejecutando la funcion startNow", jobDto.getGroupName(), jobDto.getJobName());
        try {
            if (data != null) {
                schedulerFactoryBean.getScheduler().triggerJob(jKey, data);
            } else {
                schedulerFactoryBean.getScheduler().triggerJob(jKey);
            }
            log.info("[{}] [{}] El Job se ejecutó de manera correcta", jobDto.getGroupName(), jobDto.getJobName());
        } catch (SchedulerException e) {
            log.error("[{}] [{}] El job no se logró ejecutar de manera correcta. causa:{}", jobDto.getGroupName(), jobDto.getJobName(), e.getMessage());
            throw new OperationException("Se generó una excepción al ejecutar el job:" + jobDto.getJobName());
        }
    }

    /**
     * Indica si el job se está ejecutando en este momento.
     */
    @Override
    public boolean isJobRunning(String groupKey, String jobName) {
        log.info("[{}] [{}] Verificando si se está ejecutando", groupKey, jobName);
        try {
            List<JobExecutionContext> currentJobs = schedulerFactoryBean.getScheduler().getCurrentlyExecutingJobs();
            if (currentJobs != null) {
                for (JobExecutionContext jobCtx : currentJobs) {
                    String jobNameDB = jobCtx.getJobDetail().getKey().getName();
                    String groupNameDB = jobCtx.getJobDetail().getKey().getGroup();
                    if (jobName.equalsIgnoreCase(jobNameDB) && groupKey.equalsIgnoreCase(groupNameDB)) {
                        return true;
                    }
                }
            }
        } catch (SchedulerException e) {
            log.error("[{}] [{}] Error al verificar si se está ejecutando un job", groupKey, jobName);
            return false;
        }
        return false;
    }

    /**
     * Lista todos los jobs de un grupo.
     */
    @Override
    public List<JobDto> getAllJobs(String groupName) {
        List<JobDto> list = new ArrayList<>();
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                JobDetail jobDetail = scheduler.getJobDetail(jobKey);
                String jobName = jobKey.getName();
                List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
                Date scheduleTime = triggers.get(0).getStartTime();
                Date nextFireTime = triggers.get(0).getNextFireTime();
                Date lastFiredTime = triggers.get(0).getPreviousFireTime();
                JobDto jobDto = new JobDto();
                jobDto.setGroupName(groupName);
                jobDto.setJobName(jobName);
                jobDto.setScheduleTime(scheduleTime);
                jobDto.setLastFiredTime(lastFiredTime);
                jobDto.setNextFireTime(nextFireTime);
                jobDto.setDescription(jobDetail.getDescription());
                if (triggers.get(0) instanceof CronTrigger) {
                    CronTrigger cronTrigger = (CronTrigger) triggers.get(0);
                    jobDto.setCronExpression(cronTrigger.getCronExpression());
                }

                if (isJobRunning(jobKey.getGroup(), jobName)) {
                    jobDto.setJobStatus("RUNNING");
                } else {
                    String jobState = getJobState(jobKey.getGroup(), jobName);
                    jobDto.setJobStatus(jobState);
                }
                list.add(jobDto);
            }

        } catch (SchedulerException e) {
            log.error("SchedulerException. Error al listar todos los job. causa: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error al listar todos los job. causa:", e);
        }
        return list;
    }

    @Override
    public List<JobDto> getJobInfo(String groupName, String jobName) {
        List<JobDto> list = new ArrayList<>();
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                if (jobKey.getName().equals(jobName)) {
                    String jobGroup = jobKey.getGroup();
                    List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
                    Date scheduleTime = triggers.get(0).getStartTime();
                    Date nextFireTime = triggers.get(0).getNextFireTime();
                    Date lastFiredTime = triggers.get(0).getPreviousFireTime();
                    String description = triggers.get(0).getDescription();
                    String cronExpression = "";
                    if (triggers.get(0) instanceof CronTrigger) {
                        CronTrigger cronTrigger = (CronTrigger) triggers.get(0);
                        cronExpression = cronTrigger.getCronExpression();
                    }

                    JobDto jobDto = new JobDto();
                    jobDto.setGroupName(groupName);
                    jobDto.setJobName(jobName);
                    jobDto.setScheduleTime(scheduleTime);
                    jobDto.setLastFiredTime(lastFiredTime);
                    jobDto.setNextFireTime(nextFireTime);
                    jobDto.setDescription(description);
                    jobDto.setCronExpression(cronExpression);
                    if (isJobRunning(jobGroup, jobName)) {
                        jobDto.setJobStatus("RUNNING");
                    } else {
                        String jobState = getJobState(jobGroup, jobName);
                        jobDto.setJobStatus(jobState);
                    }
                    list.add(jobDto);
                }
            }

        } catch (SchedulerException e) {
            log.error("Error al listar  los job por GroupName:{} y JobName:{}. causa: {}", groupName, jobName, e.getMessage());
        }
        return list;
    }

    /**
     * Indica si existe un job con el nombre dado.
     */
    @Override
    public boolean isJobWithNamePresent(String groupName, String jobName) {
        try {
            JobKey jobKey = new JobKey(jobName, groupName);
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            if (scheduler.checkExists(jobKey)) {
                return true;
            }
        } catch (SchedulerException e) {
            log.error("SchedulerException while checking job with name and group exist:" + e.getMessage());
        }
        return false;
    }

    /**
     * Obtiene el estado actual del job.
     */
    public String getJobState(String groupKey, String jobName) {
        log.info("[{}][{}] Verificando el estado del job", groupKey, jobName);
        try {
            JobKey jobKey = new JobKey(jobName, groupKey);
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            JobDetail jobDetail = scheduler.getJobDetail(jobKey);
            List<? extends Trigger> triggers = scheduler.getTriggersOfJob(jobDetail.getKey());
            if (triggers != null && triggers.size() > 0) {
                for (Trigger trigger : triggers) {
                    TriggerState triggerState = scheduler.getTriggerState(trigger.getKey());
                    if (TriggerState.PAUSED.equals(triggerState)) {
                        return "PAUSED";
                    } else if (TriggerState.BLOCKED.equals(triggerState)) {
                        return "BLOCKED";
                    } else if (TriggerState.COMPLETE.equals(triggerState)) {
                        return "COMPLETE";
                    } else if (TriggerState.ERROR.equals(triggerState)) {
                        return "ERROR";
                    } else if (TriggerState.NONE.equals(triggerState)) {
                        return "NONE";
                    } else if (TriggerState.NORMAL.equals(triggerState)) {
                        return "SCHEDULED";
                    }
                }
            }
        } catch (SchedulerException e) {
            log.error("[{}][{}] Error al verificar el estado del job. causa: {}", groupKey, jobName, e.getMessage());
        }
        return null;
    }

    /**
     * Detiene (interrumpe) un job en ejecución.
     */
    @Override
    public boolean stopJob(String groupName, String jobName) {
        log.info("JobServiceImpl.stopJob()");
        try {
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            JobKey jkey = new JobKey(jobName, groupName);
            return scheduler.interrupt(jkey);
        } catch (SchedulerException e) {
            log.error("SchedulerException while stopping job. error message :" + e.getMessage());
        }
        return false;
    }

    @Override
    public boolean stopJob(JobDto jobDto) {
        return stopJob(jobDto.getGroupName(), jobDto.getJobName());
    }

    /**
     * Obtiene un job por su nombre y grupo.
     */
    public JobDetail getJobDetail(String jobName, String groupKey) {
        try {
            JobKey jobKey = new JobKey(jobName, groupKey);
            Scheduler scheduler = schedulerFactoryBean.getScheduler();
            return scheduler.getJobDetail(jobKey);
        } catch (SchedulerException e) {
            log.info("[{}] [{}] No se logro obtener el job", groupKey, jobName, e);
        }
        return null;
    }

    @Override
    public boolean isValidExpression(String cronExpression) {
        Assert.notNull(cronExpression, "La expresión cron no puede ser nulo");
        return true;
    }

    @Override
    public void pause(String groupName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                schedulerFactoryBean.getScheduler().pauseJob(jobKey);
            }
        } catch (SchedulerException e) {
            log.error("Error al pausar los job del grupo:{}", groupName, e);
        }
    }

    @Override
    public void resume(String groupName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                schedulerFactoryBean.getScheduler().resumeJob(jobKey);
            }
        } catch (SchedulerException e) {
            log.error("Error al reiniciando los job del grupo:{}", groupName, e);
        }
    }

    @Override
    public void delete(String groupName) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            for (JobKey jobKey : scheduler.getJobKeys(GroupMatcher.jobGroupEquals(groupName))) {
                schedulerFactoryBean.getScheduler().deleteJob(jobKey);
            }
        } catch (SchedulerException e) {
            log.error("Error al Eliminando los job del grupo:{}", groupName, e);
        }
    }

    @Override
    public void deleteJob(String jobName, String groupName, String triggerName) {

    }

    @Override
    public void updateDataMapCronJob(String groupName, String jobName, Map<String, String> parametros) {
        JobKey jobKey = new JobKey(jobName, groupName);
        try {
            JobDetail jobDetail = this.schedulerFactoryBean.getScheduler().getJobDetail(jobKey);
            for (Map.Entry<String, String> item : parametros.entrySet())
                jobDetail.getJobDataMap().put(item.getKey(), item.getValue());

            this.schedulerFactoryBean.getScheduler().addJob(jobDetail, true, true);
        } catch (SchedulerException e) {
            log.error("Error al actualizar data map de job: nombre: [{}], grupo: [{}]", jobName, groupName);
        }
    }

    @Override
    public void removeItemsDataMap(String jobName, String groupName, List<String> lista) {
        JobKey jobKey = new JobKey(jobName, groupName);
        try {
            JobDetail jobDetail = this.schedulerFactoryBean.getScheduler().getJobDetail(jobKey);
            for (String key : lista) jobDetail.getJobDataMap().remove(key);

            this.schedulerFactoryBean.getScheduler().addJob(jobDetail, true, true);
        } catch (SchedulerException e) {
            log.error("Error al actualizar data map de job: nombre: [{}], grupo: [{}]", jobName, groupName);
        }
    }

    private Trigger getTrigger(JobKey jobKey, String triggerKey) {
        Scheduler scheduler = schedulerFactoryBean.getScheduler();
        try {
            List<Trigger> triggers = (List<Trigger>) scheduler.getTriggersOfJob(jobKey);
            for (Trigger trigger : triggers) {
                if (trigger.getKey().getName().equals(triggerKey)) {
                    return trigger;
                }
            }
        } catch (SchedulerException e) {
            log.error("Error al obtener trigger", e);
        }
        return null;
    }
}
