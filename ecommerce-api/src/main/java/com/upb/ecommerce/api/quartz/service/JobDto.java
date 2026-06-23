package com.upb.ecommerce.api.quartz.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.io.Serializable;
import java.util.Date;

/**
 * DTO que describe un job de Quartz: identifica el job (grupo + nombre + trigger) y expone
 * su estado y tiempos. Se usa tanto para registrar un job como para consultarlo.
 */
@Getter
@Setter
public class JobDto implements Serializable {
    /** Grupo del job (también se usa al registrarlo). */
    private String groupName;
    /** Nombre del job (también se usa al registrarlo). */
    private String jobName;

    private String triggerName;

    private Date scheduleTime;
    private Date lastFiredTime;
    private Date nextFireTime;
    private String jobStatus;
    private String description;
    private String cronExpression;

    /** Parámetro auxiliar usado al registrar un job. */
    private String triggerKey;
    /** Parámetro auxiliar usado al registrar un job (la clase del Job a ejecutar). */
    private Class<? extends QuartzJobBean> jobClass;
}
