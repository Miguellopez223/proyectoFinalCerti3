package com.upb.ecommerce.core.integracion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;

/**
 * Cuerpo (JSON plano) que Stereum/BISA envía por POST al webhook cuando se confirma un
 * pago por QR (red CLS). Es el formato REAL observado en producción, distinto del que
 * asumía la versión anterior.
 *
 * <p>{@code transactionId} (igual que {@code alias}) es el identificador del cargo en
 * Stereum: coincide con {@code Pago.transaccionPasarelaId} y permite localizar el pago.
 * {@code username}/{@code password} son las credenciales de callback con las que Stereum
 * autentica el aviso.
 *
 * <p>{@code @JsonIgnoreProperties(ignoreUnknown = true)} para no romper si Stereum agrega
 * campos nuevos.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@ToString
public class StereumPagoCallback {

    /** Identificador del cargo en Stereum (= Pago.transaccionPasarelaId). */
    private String transactionId;

    /** Igual que transactionId en los avisos observados; se usa como respaldo. */
    private String alias;

    /** Credenciales de callback que envía Stereum para autenticar el aviso. */
    private String username;
    private String password;

    /** Estado reportado (puede venir null: el solo hecho del callback implica pago exitoso). */
    private String status;

    private BigDecimal amount;
    private String monto;
    private String moneda;
    private String source;

    /** Epoch en milisegundos del pago (>0 cuando el pago se concretó). */
    private Long paymentDate;

    private String nombreCliente;
    private String documentoCliente;
    private String numeroOrdenOriginante;
}
