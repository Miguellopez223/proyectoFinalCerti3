package com.upb.ecommerce.api.quartz.service;

import com.upb.ecommerce.core.exception.OperationException;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Fachada sobre el {@code Scheduler} de Quartz. Permite registrar, reprogramar, pausar,
 * reanudar, detener, eliminar y consultar jobs (tanto cron como de ejecución única) sin
 * tener que tratar directamente con la API de bajo nivel de Quartz.
 */
public interface JobService {

    boolean createJob(String groupName, String jobName, Class<? extends QuartzJobBean> jobClass, Map<String, String> data, String description);

    boolean scheduleOneTimeJob(JobDto jobDto, Date startTime, Map<String, String> data, int repeatCount, long repeatInterval, String description);

    boolean scheduleOneTimeJob(String groupName, String jobName, String triggerKey, Class<? extends QuartzJobBean> jobClass, Date date, Map<String, String> data, int repeatCount, long repeatInterval, String description);

    boolean createTriggerOneTimeJob(String groupName, String jobName, String triggerKey, Date date, Map<String, String> data, int repeatCount, long repeatInterval);

    void scheduleCronJob(JobDto jobDto, Date date, String cronExpression, Map<String, String> data, String description);

    void scheduleCronJob(String groupName, String jobName, String triggerKey, Class<? extends QuartzJobBean> jobClass, Date date, String cronExpression, Map<String, String> data, String description);

    void createTrigger(String groupName, String jobName, String triggerKey, Date date, String cronExpression, Map<String, String> data);

    boolean updateOneTimeJob(String jobName, Date date);

    boolean updateOneTimeJob(String groupName, String jobName, Date date);

    boolean updateCronJob(String groupName, String jobName, Date date, String cronExpression);

    boolean updateCronJob(String groupName, String jobName, String triggerName, Date date, String cronExpression);

    boolean jobWillStartIn(String groupName, String jobName, Integer secondsToStart);

    boolean unScheduleJob(String jobName);

    boolean deleteJob(String jobName, String groupName);

    boolean pauseJob(String groupKey, String jobName);

    boolean pauseJob(JobDto jobDto);

    boolean resumeJob(String groupKey, String jobName);

    boolean resumeJob(JobDto jobDto);

    void startJobNow(String groupKey, String jobKey, JobDataMap data) throws OperationException;

    void startJobNow(JobDto jobDto, JobDataMap data) throws OperationException;

    boolean isJobRunning(String groupKey, String jobName);

    List<JobDto> getAllJobs(String groupName);

    List<JobDto> getJobInfo(String groupName, String jobName);

    boolean isJobWithNamePresent(String groupName, String jobName);

    String getJobState(String groupKey, String jobName);

    boolean stopJob(String groupName, String jobName);

    boolean stopJob(JobDto jobDto);

    JobDetail getJobDetail(String groupName, String jobName);

    String getJobNameStartWith(String groupName, String paramJobName);

    boolean existJobName(String groupName, String paramJobName);

    boolean existJobName(String groupName);

    boolean existJobNameStartWith(String groupName, String paramJobNameStartWith);

    boolean isValidExpression(String cronExpression);

    void pause(String groupName);

    void resume(String groupName);

    void delete(String groupName);

    void deleteJob(String name, String group, String triggerName);

    void updateDataMapCronJob(String groupName, String jobName, Map<String, String> parametros);

    void removeItemsDataMap(String jobName, String groupName, List<String> lista);
}
