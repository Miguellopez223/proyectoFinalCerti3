package com.upb.ecommerce.api.quartz;

import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Date;

@Slf4j
@Service
public class JobServiceImpl implements JobService {

    private final Scheduler scheduler;

    public JobServiceImpl(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    @Override
    public boolean existJobName(String groupName, String jobName) {
        try {
            return scheduler.checkExists(new JobKey(jobName, groupName));
        } catch (SchedulerException e) {
            log.error("[Quartz] Error verificando job {}.{}: {}", groupName, jobName, e.getMessage());
            return false;
        }
    }

    @Override
    public void scheduleCronJob(JobDto jobDto, Date startTime, String cronExpression,
                                Date endTime, String description) {
        try {
            JobDetail jobDetail = buildJobDetail(jobDto, description);
            CronTrigger trigger = buildCronTrigger(jobDto, startTime, cronExpression, endTime);
            scheduler.scheduleJob(jobDetail, Collections.singleton(trigger), true);
            log.info("[Quartz] Job cron registrado: {}.{} → '{}'",
                    jobDto.getGroupName(), jobDto.getJobName(), cronExpression);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo programar el job cron "
                    + jobDto.getGroupName() + "." + jobDto.getJobName(), e);
        }
    }

    @Override
    public void scheduleSimpleJob(JobDto jobDto, Date startTime, long repeatIntervalMs,
                                  int repeatCount, Date endTime, String description) {
        try {
            JobDetail jobDetail = buildJobDetail(jobDto, description);
            SimpleTrigger trigger = buildSimpleTrigger(jobDto, startTime, repeatIntervalMs, repeatCount, endTime);
            scheduler.scheduleJob(jobDetail, Collections.singleton(trigger), true);
            log.info("[Quartz] Job simple registrado: {}.{} (intervalo={}ms, repeticiones={})",
                    jobDto.getGroupName(), jobDto.getJobName(), repeatIntervalMs, repeatCount);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo programar el job simple "
                    + jobDto.getGroupName() + "." + jobDto.getJobName(), e);
        }
    }

    @Override
    public void updateCronJob(JobDto jobDto, Date startTime, String cronExpression,
                               Date endTime, String description) {
        try {
            TriggerKey triggerKey = TriggerKey.triggerKey(
                    jobDto.getJobName() + "Trigger", jobDto.getGroupName());
            CronTrigger newTrigger = buildCronTrigger(jobDto, startTime, cronExpression, endTime);
            scheduler.rescheduleJob(triggerKey, newTrigger);
            log.info("[Quartz] Job cron actualizado: {}.{} → '{}'",
                    jobDto.getGroupName(), jobDto.getJobName(), cronExpression);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo actualizar el job "
                    + jobDto.getGroupName() + "." + jobDto.getJobName(), e);
        }
    }

    @Override
    public void deleteJob(String groupName, String jobName) {
        try {
            scheduler.deleteJob(new JobKey(jobName, groupName));
            log.info("[Quartz] Job eliminado: {}.{}", groupName, jobName);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo eliminar el job " + groupName + "." + jobName, e);
        }
    }

    @Override
    public void pauseJob(String groupName, String jobName) {
        try {
            scheduler.pauseJob(new JobKey(jobName, groupName));
            log.info("[Quartz] Job pausado: {}.{}", groupName, jobName);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo pausar el job " + groupName + "." + jobName, e);
        }
    }

    @Override
    public void resumeJob(String groupName, String jobName) {
        try {
            scheduler.resumeJob(new JobKey(jobName, groupName));
            log.info("[Quartz] Job reanudado: {}.{}", groupName, jobName);
        } catch (SchedulerException e) {
            throw new RuntimeException("No se pudo reanudar el job " + groupName + "." + jobName, e);
        }
    }

    // ── helpers privados ──────────────────────────────────────────────────────

    private JobDetail buildJobDetail(JobDto dto, String description) {
        JobDataMap dataMap = dto.getJobDataMap() != null ? dto.getJobDataMap() : new JobDataMap();
        return JobBuilder.newJob(dto.getJobClass())
                .withIdentity(dto.getJobName(), dto.getGroupName())
                .withDescription(description)
                .usingJobData(dataMap)
                .storeDurably()
                .build();
    }

    private CronTrigger buildCronTrigger(JobDto dto, Date startTime,
                                          String cronExpression, Date endTime) {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder
                .cronSchedule(cronExpression)
                .withMisfireHandlingInstructionDoNothing();

        TriggerBuilder<CronTrigger> builder = TriggerBuilder.<CronTrigger>newTrigger()
                .withIdentity(dto.getJobName() + "Trigger", dto.getGroupName())
                .forJob(dto.getJobName(), dto.getGroupName())
                .startAt(startTime)
                .withSchedule(scheduleBuilder);

        if (endTime != null) {
            builder.endAt(endTime);
        }
        return builder.build();
    }

    private SimpleTrigger buildSimpleTrigger(JobDto dto, Date startTime, long repeatIntervalMs,
                                              int repeatCount, Date endTime) {
        SimpleScheduleBuilder scheduleBuilder = SimpleScheduleBuilder.simpleSchedule()
                .withIntervalInMilliseconds(repeatIntervalMs)
                .withRepeatCount(repeatCount)
                .withMisfireHandlingInstructionNextWithRemainingCount();

        TriggerBuilder<SimpleTrigger> builder = TriggerBuilder.<SimpleTrigger>newTrigger()
                .withIdentity(dto.getJobName() + "Trigger", dto.getGroupName())
                .forJob(dto.getJobName(), dto.getGroupName())
                .startAt(startTime)
                .withSchedule(scheduleBuilder);

        if (endTime != null) {
            builder.endAt(endTime);
        }
        return builder.build();
    }
}
