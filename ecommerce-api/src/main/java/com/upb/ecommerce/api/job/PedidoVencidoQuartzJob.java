package com.upb.ecommerce.api.job;

import com.upb.ecommerce.api.quartz.service.JobDto;
import com.upb.ecommerce.core.service.PedidoService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

@Slf4j
@DisallowConcurrentExecution
public class PedidoVencidoQuartzJob extends QuartzJobBean {

    public static final String NAME_JOB = "PedidoVencidoJob";
    private static final String NAME_TRIGGER = "PedidoVencidoJob-trigger";

    @Autowired
    private PedidoService pedidoService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        pedidoService.cancelarPedidosNoPagados();
    }

    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(PedidoVencidoQuartzJob.class);
        return jobDto;
    }
}
