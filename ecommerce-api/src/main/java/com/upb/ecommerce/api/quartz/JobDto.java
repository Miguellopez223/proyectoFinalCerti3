package com.upb.ecommerce.api.quartz;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.quartz.Job;
import org.quartz.JobDataMap;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDto {

    private String jobName;
    private String groupName;
    private Class<? extends Job> jobClass;
    private JobDataMap jobDataMap;
}
