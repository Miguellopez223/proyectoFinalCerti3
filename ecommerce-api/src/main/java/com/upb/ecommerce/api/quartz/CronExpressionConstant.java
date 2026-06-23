package com.upb.ecommerce.api.quartz;

/**
 * Expresiones cron reutilizables para programar jobs de Quartz.
 *
 * <p>Formato Quartz (7 campos, el último opcional): {@code segundo minuto hora díaMes mes díaSemana [año]}.
 * Ojo: difiere del cron de Spring {@code @Scheduled} (que usa {@code *} donde Quartz exige {@code ?}
 * en día-de-mes / día-de-semana).
 */
public interface CronExpressionConstant {
    String CRON_START_NOW = "0/5 * * * * ?";
    String CRON_INIT_NOW = "0/10 * * * * ?";
    String CRON_X_15_SEG = "0/15 * * * * ?";
    String CRON_X_1_SEG = "0/1 * * * * ?";
    String CRON_X_2_SEG = "0/2 * * * * ?";
    String CRON_X_3_SEG = "0/3 * * * * ?";
    String CRON_X_30_SEG = "0/30 * * * * ?";
    String CRON_X_1_MIN = "0 0/1 * * * ?";
    String CRON_X_3_MIN = "0 0/3 * * * ?";
    String CRON_X_5_MIN = "0 0/5 * * * ?";
    String CRON_X_10_MIN = "0 0/10 * * * ?";
    String CRON_X_15_MIN = "0 0/15 * * * ?";
    String CRON_X_30_MIN = "0 0/30 * * * ?";

    String CRON_X_08_AM = "0 0 8 * * ?";
    String CRON_X_01_AM = "0 0 1 * * ?";
    String CRON_X_02_AM = "0 0 2 * * ?";
    String CRON_X_1_HR = "0 0 * ? * *";
    String CRON_LAST_DAY = "{SEGUNDO} {MINUTO} {HORA} L * ?";
    String CRON_DAYS_9_17_25 = "{SEGUNDO} {MINUTO} {HORA} {DAY} * ? *";
}
