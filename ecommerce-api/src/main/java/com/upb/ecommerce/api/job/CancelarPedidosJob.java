package com.upb.ecommerce.api.job;

import com.upb.ecommerce.api.quartz.service.JobDto;
import com.upb.ecommerce.core.service.EmailService;
import com.upb.ecommerce.data.repository.PedidoRepository;
import com.upb.ecommerce.domain.entities.Pedido;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.time.LocalDateTime;
import java.util.List;

// --- PREGUNTA 6-A ---
// Job de Quartz que CANCELA automaticamente los pedidos que no fueron pagados.
// Se ejecuta cada 5 segundos (el cron se define en QuartzJobInitializer).
//
// si un pedido sigue en "PENDIENTE" (no pagado) y ya paso 1 minuto
// desde que se creo, se cambia su estado a "CANCELADO" y se envia un correo.
//
@Slf4j
@DisallowConcurrentExecution
public class CancelarPedidosJob extends QuartzJobBean {

    public static final String NAME_JOB = "CancelarPedidosJob";
    private static final String NAME_TRIGGER = "CancelarPedidosJob-trigger";

    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private EmailService emailService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        // 1) Calculo la fecha limite: hace 1 minuto. Un pedido creado ANTES de esta hora
        //    significa que ya paso mas de 1 minuto desde que se creo.
        LocalDateTime haceUnMinuto = LocalDateTime.now().minusMinutes(1);

        // 2) Busco todos los pedidos que siguen en PENDIENTE (no pagados) y son mas viejos que 1 minuto.
        List<Pedido> pedidos = pedidoRepository.findByEstadoPedidoAndFechaCreacionBefore("PENDIENTE", haceUnMinuto);

        // 3) Recorro la lista uno por uno: cancelo el pedido y mando el correo.
        for (Pedido pedido : pedidos) {
            pedido.setEstadoPedido("CANCELADO");
            pedidoRepository.save(pedido);
            log.info("[Quartz] Pedido {} cancelado automaticamente por falta de pago", pedido.getId());

            // Correo:
            emailService.enviarCorreoSimple("rllayus@gmail.com", "Pregunta 6-A", "Pedido cancelado");
        }
    }

    /** Construye el JobDto que identifica este job dentro del grupo dado. */
    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(CancelarPedidosJob.class);
        return jobDto;
    }
}
