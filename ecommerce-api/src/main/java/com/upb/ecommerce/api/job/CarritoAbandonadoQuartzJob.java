package com.upb.ecommerce.api.job;

import com.upb.ecommerce.api.quartz.service.JobDto;
import com.upb.ecommerce.core.service.CarritoService;
import com.upb.ecommerce.data.repository.CarritoRepository;
import com.upb.ecommerce.domain.entities.Carrito;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
import org.quartz.InterruptableJob;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.PersistJobDataAfterExecution;
import org.quartz.UnableToInterruptJobException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;

/**
 * Barrido de carritos abandonados implementado como job de Quartz (estilo del proyecto del docente).
 *
 * <p>Migra el antiguo {@code @Scheduled} a Quartz: el job se registra de forma persistente en la BD
 * desde {@link com.upb.ecommerce.api.QuartzJobInitializer} y se dispara según su cron, o a demanda
 * vía {@code JobService.startJobNow(...)} (lo usa el endpoint de administración del carrito).
 *
 * <p>Lógica: cada disparo busca carritos que sigan ACTIVO pero sin cambios desde hace más de
 * {@code carrito.abandono.horas}. Los procesa por lotes y, por cada carrito, lanza un trabajador
 * {@code @Async} ({@link CarritoService#procesarCarritoAbandonado(Long)}) que envía el recordatorio
 * por correo y lo marca como ABANDONADO.
 *
 * <ul>
 *   <li>{@code @DisallowConcurrentExecution}: evita que dos barridos corran a la vez (p. ej. el cron
 *       y un disparo manual simultáneos).</li>
 *   <li>Implementa {@code InterruptableJob}: {@code JobService.stopJob(...)} puede cortar el barrido
 *       entre lotes.</li>
 * </ul>
 *
 * <p>No es un bean de Spring: lo instancia Quartz. Las dependencias {@code @Autowired}/{@code @Value}
 * se inyectan gracias al job factory autoconfigurado por Spring Boot.
 */
@Slf4j
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class CarritoAbandonadoQuartzJob extends QuartzJobBean implements InterruptableJob {

    public static final String NAME_JOB = "CarritoAbandonadoJob";
    private static final String NAME_TRIGGER = "CarritoAbandonadoJob-trigger";

    /** Tamaño de cada lote/página que se procesa de una vez. */
    private static final int TAMANIO_LOTE = 50;
    /** Tope de seguridad de lotes por ejecución (evita un bucle infinito ante errores). */
    private static final int MAX_LOTES = 1000;

    @Autowired
    private CarritoRepository carritoRepository;
    @Autowired
    private CarritoService carritoService;

    @Value("${carrito.abandono.horas:1}")
    private long horasAbandono;

    /**
     * Override para pruebas: si es mayor a 0, el umbral de abandono se calcula en SEGUNDOS
     * en vez de horas (más fácil de probar manualmente). En producción déjalo en 0.
     */
    @Value("${carrito.abandono.segundos:0}")
    private long segundosAbandono;

    /** Lo activa {@link #interrupt()} para cortar el barrido de forma ordenada entre lotes. */
    private volatile boolean interrumpido = false;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        LocalDateTime limite = segundosAbandono > 0
                ? LocalDateTime.now().minusSeconds(segundosAbandono)
                : LocalDateTime.now().minusHours(horasAbandono);
        log.info("[Quartz] Barrido de carritos abandonados: ACTIVO sin cambios desde antes de {}", limite);

        // Ordenamos por el más antiguo primero. Siempre leemos la página 0 porque, al marcar
        // cada carrito como ABANDONADO, deja de cumplir el filtro (sale del conjunto ACTIVO),
        // así que el siguiente lote vuelve a quedar al inicio.
        Pageable pageable = PageRequest.of(0, TAMANIO_LOTE, Sort.by("fechaActualizacion").ascending());

        int lote = 0;
        int totalProcesados = 0;
        Page<Carrito> pagina;
        do {
            if (interrumpido) {
                log.info("[Quartz] Barrido interrumpido tras procesar {} carritos", totalProcesados);
                break;
            }
            pagina = carritoRepository.findByEstadoAndFechaActualizacionBefore("ACTIVO", limite, pageable);
            if (pagina.isEmpty()) {
                break;
            }
            log.info("[Quartz] Procesando lote {} ({} carritos)", lote, pagina.getNumberOfElements());

            // Lanza un trabajador @Async por carrito y guarda su Future.
            List<Future<Long>> trabajadores = new ArrayList<>();
            for (Carrito carrito : pagina.getContent()) {
                trabajadores.add(carritoService.procesarCarritoAbandonado(carrito.getId()));
            }

            // Espera a que todos los trabajadores del lote terminen antes de seguir.
            for (Future<Long> trabajador : trabajadores) {
                try {
                    Long id = trabajador.get();
                    totalProcesados++;
                    log.info("[Quartz] Carrito {} procesado", id);
                } catch (Exception e) {
                    log.warn("[Quartz] Error procesando un carrito del lote {}: {}", lote, e.getMessage());
                }
            }
            lote++;
        } while (lote < MAX_LOTES);

        log.info("[Quartz] Barrido finalizado. Carritos procesados: {}", totalProcesados);
    }

    /** Construye el {@link JobDto} que identifica este job dentro del grupo dado. */
    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(CarritoAbandonadoQuartzJob.class);
        return jobDto;
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        log.info("[Quartz] Solicitada interrupción del barrido de carritos abandonados");
        this.interrumpido = true;
    }
}
