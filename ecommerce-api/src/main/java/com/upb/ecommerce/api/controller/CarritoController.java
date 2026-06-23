package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.api.job.CarritoAbandonadoQuartzJob;
import com.upb.ecommerce.api.quartz.service.JobService;
import com.upb.ecommerce.api.quartz.service.JobUtil;
import com.upb.ecommerce.core.dto.request.AgregarItemCarritoRequest;
import com.upb.ecommerce.core.dto.response.CarritoResponse;
import com.upb.ecommerce.core.service.CarritoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/carrito")
public class CarritoController {

    private final CarritoService carritoService;
    private final JobService jobService;

    public CarritoController(CarritoService carritoService,
                             JobService jobService) {
        this.carritoService = carritoService;
        this.jobService = jobService;
    }

    @GetMapping("/tienda/{tiendaId}/usuario/{usuarioId}")
    public ResponseEntity<CarritoResponse> obtenerCarrito(@PathVariable Long tiendaId,
                                                          @PathVariable Long usuarioId) {
        return ResponseEntity.ok(carritoService.obtenerCarritoActivo(tiendaId, usuarioId));
    }

    @PostMapping("/agregar")
    public ResponseEntity<CarritoResponse> agregarItem(@Valid @RequestBody AgregarItemCarritoRequest request) {
        return ResponseEntity.ok(carritoService.agregarItem(request));
    }

    @DeleteMapping("/{carritoId}/item/{detalleId}")
    public ResponseEntity<CarritoResponse> eliminarItem(@PathVariable Long carritoId,
                                                        @PathVariable Long detalleId) {
        return ResponseEntity.ok(carritoService.eliminarItem(carritoId, detalleId));
    }

    @DeleteMapping("/{carritoId}/vaciar")
    public ResponseEntity<CarritoResponse> vaciar(@PathVariable Long carritoId) {
        return ResponseEntity.ok(carritoService.vaciarCarrito(carritoId));
    }

    /**
     * Dispara manualmente el barrido de carritos abandonados (el mismo job de Quartz que corre por
     * cron). Usa {@code JobService.startJobNow(...)} para ejecutarlo de inmediato, sin esperar al
     * cron. El job corre en un hilo de Quartz, así que la respuesta vuelve enseguida. Solo ADMIN.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/barrer-abandonados")
    public ResponseEntity<Map<String, String>> barrerAbandonados() {
        jobService.startJobNow(CarritoAbandonadoQuartzJob.getJobDto(JobUtil.GROUP_NAME), null);
        return ResponseEntity.ok(Map.of("mensaje",
                "Barrido de carritos abandonados disparado vía Quartz. Revisa los logs."));
    }
}
