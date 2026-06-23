package com.upb.ecommerce.api.quartz;

public final class CronExpressionConstant {

    private CronExpressionConstant() {}

    /** Cada 3 segundos: segundos 0, 3, 6, 9… de cada minuto. */
    public static final String CRON_X_3_SEG    = "0/3 * * * * ?";

    /** Cada minuto. */
    public static final String CRON_CADA_MIN   = "0 * * * * ?";

    /** Cada hora, al minuto 0. */
    public static final String CRON_CADA_HORA  = "0 0 * * * ?";

    /** Cada día a medianoche. */
    public static final String CRON_CADA_DIA   = "0 0 0 * * ?";

    /** Cada 8 horas (00:00, 08:00, 16:00) — mismo ritmo que el barrido de carritos. */
    public static final String CRON_CADA_8H    = "0 0 0/8 * * ?";
}
