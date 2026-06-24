package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.api.job.CarritoAbandonadoQuartzJob;
import com.upb.ecommerce.api.quartz.service.JobService;
import com.upb.ecommerce.api.quartz.service.JobUtil;
import com.upb.ecommerce.core.dto.request.AgregarItemCarritoRequest;
import com.upb.ecommerce.core.dto.response.CarritoResponse;
import com.upb.ecommerce.core.service.CarritoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Carrito", description = "Carrito de compras: ver, agregar/quitar ítems y vaciar")
@SecurityRequirement(name = "bearerToken")
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

    @Operation(summary = "Obtener el carrito activo de un usuario en una tienda")
    @GetMapping("/tienda/{tiendaId}/usuario/{usuarioId}")
    public ResponseEntity<CarritoResponse> obtenerCarrito(@PathVariable Long tiendaId,
                                                          @PathVariable Long usuarioId) {
        return ResponseEntity.ok(carritoService.obtenerCarritoActivo(tiendaId, usuarioId));
    }

    @Operation(summary = "Listar los carritos activos de un usuario (todas las tiendas)")
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<java.util.List<CarritoResponse>> carritosActivos(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(carritoService.listarActivosPorUsuario(usuarioId));
    }

    @Operation(summary = "Agregar un ítem al carrito")
    @PostMapping("/agregar")
    public ResponseEntity<CarritoResponse> agregarItem(@Valid @RequestBody AgregarItemCarritoRequest request) {
        return ResponseEntity.ok(carritoService.agregarItem(request));
    }

    @Operation(summary = "Eliminar un ítem del carrito")
    @DeleteMapping("/{carritoId}/item/{detalleId}")
    public ResponseEntity<CarritoResponse> eliminarItem(@PathVariable Long carritoId,
                                                        @PathVariable Long detalleId) {
        return ResponseEntity.ok(carritoService.eliminarItem(carritoId, detalleId));
    }

    @Operation(summary = "Vaciar el carrito")
    @DeleteMapping("/{carritoId}/vaciar")
    public ResponseEntity<CarritoResponse> vaciar(@PathVariable Long carritoId) {
        return ResponseEntity.ok(carritoService.vaciarCarrito(carritoId));
    }

    /**
     * Dispara manualmente el barrido de carritos abandonados (el mismo job de Quartz que corre por
     * cron). Usa {@code JobService.startJobNow(...)} para ejecutarlo de inmediato, sin esperar al
     * cron. El job corre en un hilo de Quartz, así que la respuesta vuelve enseguida. Solo ADMIN.
     */
    @Operation(summary = "Disparar el barrido de carritos abandonados",
            description = "Ejecuta de inmediato el job de Quartz que notifica los carritos abandonados, sin esperar al cron. Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/barrer-abandonados")
    public ResponseEntity<Map<String, String>> barrerAbandonados() {
        jobService.startJobNow(CarritoAbandonadoQuartzJob.getJobDto(JobUtil.GROUP_NAME), null);
        return ResponseEntity.ok(Map.of("mensaje",
                "Barrido de carritos abandonados disparado vía Quartz. Revisa los logs."));
    }
}
