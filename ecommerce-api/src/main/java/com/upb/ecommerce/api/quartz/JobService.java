package com.upb.ecommerce.api.quartz;

import java.util.Date;

public interface JobService {

    boolean existJobName(String groupName, String jobName);

    void scheduleCronJob(JobDto jobDto, Date startTime, String cronExpression,
                         Date endTime, String description);

    void scheduleSimpleJob(JobDto jobDto, Date startTime, long repeatIntervalMs,
                           int repeatCount, Date endTime, String description);

    void updateCronJob(JobDto jobDto, Date startTime, String cronExpression,
                       Date endTime, String description);

    void deleteJob(String groupName, String jobName);

    void pauseJob(String groupName, String jobName);

    void resumeJob(String groupName, String jobName);
}
