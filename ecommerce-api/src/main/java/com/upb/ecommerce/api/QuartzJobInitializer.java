package com.upb.ecommerce.api;

import com.upb.ecommerce.api.job.CarritoAbandonadoQuartzJob;
import com.upb.ecommerce.api.job.NotificacionJob;
import com.upb.ecommerce.api.job.PedidoVencidoQuartzJob;
import com.upb.ecommerce.api.quartz.service.JobDto;
import com.upb.ecommerce.api.quartz.service.JobService;
import com.upb.ecommerce.api.quartz.service.JobUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Date;


@Slf4j
@Component
@Order(2)
public class QuartzJobInitializer implements CommandLineRunner {

    private final JobService jobService;

    @Value("${job.notificacion.group:Ecommerce}")
    private String grupoNotificacion;

    @Value("${job.notificacion.cron:0 0/1 * * * ?}")
    private String cronNotificacion;

    @Value("${job.carrito-abandonado.cron:0 0 0/8 * * ?}")
    private String cronCarritoAbandonado;

    // Cada 5
    @Value("${job.pedido-vencido.cron:0/5 * * * * ?}")
    private String cronPedidoVencido;

    public QuartzJobInitializer(JobService jobService) {
        this.jobService = jobService;
    }

    @Override
    public void run(String... args) {
        // Job demostrativo (traza periódica)
        registrarJob(NotificacionJob.getJobDto(grupoNotificacion), cronNotificacion,
                "Job demostrativo de Quartz que registra una traza periódica");

        // Barrido de carritos abandonados (migrado de @Scheduled a Quartz)
        registrarJob(CarritoAbandonadoQuartzJob.getJobDto(JobUtil.GROUP_NAME), cronCarritoAbandonado,
                "Barrido de carritos abandonados: envía recordatorios y marca los carritos como ABANDONADO");

        // Cancelación automática de pedidos no pagados
        registrarJob(PedidoVencidoQuartzJob.getJobDto(JobUtil.GROUP_NAME), cronPedidoVencido,
                "Cancela pedidos PENDIENTE de más de 1 minuto y envía corre para que le de un aviso");
    }

    /** Programa el job como cron solo si no estaba ya registrado (idempotente entre reinicios). */
    private void registrarJob(JobDto jobDto, String cronExpression, String descripcion) {
        if (!jobService.existJobName(jobDto.getGroupName(), jobDto.getJobName())) {
            jobService.scheduleCronJob(jobDto, new Date(), cronExpression, null, descripcion);
            log.info("Job de Quartz [{}] programado con cron [{}]", jobDto.getJobName(), cronExpression);
        } else {
            log.info("Job de Quartz [{}] ya estaba registrado; no se vuelve a programar", jobDto.getJobName());
        }
    }
}
