package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.core.dto.request.GenerarQrPagoRequest;
import com.upb.ecommerce.core.dto.request.PagoRequest;
import com.upb.ecommerce.core.dto.response.GenerarQrPagoResponse;
import com.upb.ecommerce.core.dto.response.PagoResponse;
import com.upb.ecommerce.core.dto.response.VerificarQrPagoResponse;
import com.upb.ecommerce.core.service.PagoService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<List<PagoResponse>> listarPorPedido(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(pagoService.listarPorPedido(pedidoId));
    }

    @GetMapping("/pedido/{pedidoId}/paginado")
    public ResponseEntity<Page<PagoResponse>> listarPorPedidoPaginado(
            @PathVariable Long pedidoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction sortDir) {
        return ResponseEntity.ok(pagoService.listarPorPedidoPaginado(
                pedidoId,
                PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
    }

    @PostMapping
    public ResponseEntity<PagoResponse> registrar(@Valid @RequestBody PagoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.registrar(request));
    }

    @PostMapping("/qr")
    public ResponseEntity<GenerarQrPagoResponse> generarQr(@Valid @RequestBody GenerarQrPagoRequest request) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.generarQr(request));
    }

    @GetMapping("/qr/{transactionId}/verificar")
    public ResponseEntity<VerificarQrPagoResponse> verificarQr(@PathVariable String transactionId) throws Exception {
        return ResponseEntity.ok(pagoService.verificarQr(transactionId));
    }
}
