package com.upb.ecommerce.api.quartz;

public final class JobUtil {

    private JobUtil() {}

    /** Nombre del grupo que agrupa todos los jobs de envío de correos. */
    public static final String GROUP_NAME = "EMAIL_JOB_GROUP";
}
