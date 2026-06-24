package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.CrearPedidoRequest;
import com.upb.ecommerce.core.dto.request.GenerarQrRequest;
import com.upb.ecommerce.core.dto.response.PedidoResponse;
import com.upb.ecommerce.core.integracion.StereumCreateChargeResponse;
import com.upb.ecommerce.core.service.PedidoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Tag(name = "Pedidos", description = "Pedidos: creación desde el carrito, consulta, cambio de estado, cancelación y QR de pago")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @Operation(summary = "Listar los pedidos de un usuario en una tienda")
    @GetMapping("/tienda/{tiendaId}/usuario/{usuarioId}")
    public ResponseEntity<List<PedidoResponse>> listarPorUsuario(@PathVariable Long tiendaId,
                                                                 @PathVariable Long usuarioId) {
        return ResponseEntity.ok(pedidoService.listarPorUsuario(tiendaId, usuarioId));
    }

    @Operation(summary = "Listar todos los pedidos de un usuario (todas las tiendas)")
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PedidoResponse>> listarTodosPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(pedidoService.listarTodosPorUsuario(usuarioId));
    }

    @Operation(summary = "Checkout multi-tienda: crea un pedido por cada carrito activo del usuario")
    @PostMapping("/checkout/usuario/{usuarioId}")
    public ResponseEntity<List<PedidoResponse>> checkout(@PathVariable Long usuarioId,
                                                         @RequestParam(value = "direccionId", required = false) Long direccionId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crearDesdeCarritos(usuarioId, direccionId));
    }

    @Operation(summary = "Obtener un pedido por su id")
    @GetMapping("/tienda/{tiendaId}/{pedidoId}")
    public ResponseEntity<PedidoResponse> obtenerPorId(@PathVariable Long tiendaId,
                                                       @PathVariable Long pedidoId) {
        return ResponseEntity.ok(pedidoService.obtenerPorId(tiendaId, pedidoId));
    }

    @Operation(summary = "Crear un pedido a partir del carrito activo")
    @PostMapping
    public ResponseEntity<PedidoResponse> crearDesdeCarrito(@Valid @RequestBody CrearPedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoService.crearDesdeCarrito(request));
    }

    @Operation(summary = "Actualizar el estado de un pedido",
            description = "Cambia el estado del pedido (PENDIENTE, PAGADO, ENVIADO, etc.). Requiere rol ADMIN.")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/tienda/{tiendaId}/{pedidoId}/estado")
    public ResponseEntity<PedidoResponse> actualizarEstado(@PathVariable Long tiendaId,
                                                           @PathVariable Long pedidoId,
                                                           @RequestParam String estado) {
        return ResponseEntity.ok(pedidoService.actualizarEstado(tiendaId, pedidoId, estado));
    }

    @Operation(summary = "Cancelar un pedido")
    @PatchMapping("/tienda/{tiendaId}/{pedidoId}/cancelar")
    public ResponseEntity<PedidoResponse> cancelar(@PathVariable Long tiendaId,
                                                   @PathVariable Long pedidoId) {
        return ResponseEntity.ok(pedidoService.cancelarPedido(tiendaId, pedidoId));
    }

    /**
     * Genera el QR de pago (Stereum) para el pedido. El monto se toma del total
     * del pedido; el body es opcional (país, moneda, red, documento del pagador).
     */
    @Operation(summary = "Generar el QR de pago (Stereum) de un pedido",
            description = "El monto se toma del total del pedido. El body es opcional (país, moneda, red, documento del pagador).")
    @PostMapping("/tienda/{tiendaId}/{pedidoId}/qr")
    public ResponseEntity<StereumCreateChargeResponse> generarQr(
            @PathVariable Long tiendaId,
            @PathVariable Long pedidoId,
            @RequestBody(required = false) GenerarQrRequest request) {
        try {
            GenerarQrRequest req = request != null ? request : new GenerarQrRequest();
            return ResponseEntity.ok(pedidoService.generarQrPago(tiendaId, pedidoId, req));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "No se pudo generar el QR de pago: " + e.getMessage());
        }
    }
}
