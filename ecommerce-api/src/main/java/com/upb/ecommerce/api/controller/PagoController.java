package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.PagoRequest;
import com.upb.ecommerce.core.dto.response.PagoResponse;
import com.upb.ecommerce.core.dto.response.VerificarQrPagoResponse;
import com.upb.ecommerce.core.service.PagoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Pagos", description = "Registro de pagos de un pedido y generación/verificación de QR de pago")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @Operation(summary = "Listar los pagos de un pedido")
    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<List<PagoResponse>> listarPorPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(pagoService.listarPorPedido(pedidoId));
    }

    @Operation(summary = "Registrar un pago de un pedido")
    @PostMapping
    public ResponseEntity<PagoResponse> registrar(@Valid @RequestBody PagoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.registrar(request));
    }

    @Operation(summary = "Verificar el estado de un QR de pago por su transactionId")
    @GetMapping("/qr/{transactionId}/verificar")
    public ResponseEntity<VerificarQrPagoResponse> verificarQr(@PathVariable String transactionId) throws Exception {
        return ResponseEntity.ok(pagoService.verificarQr(transactionId));
    }
}
