import { api } from './client';
import type {
  CrearPedidoRequest,
  EstadoPedido,
  GenerarQrRequest,
  Pedido,
  StereumCharge,
} from '@/types';

export const pedidosApi = {
  listarPorUsuario: (tiendaId: number, usuarioId: number) =>
    api.get<Pedido[]>(`/api/pedidos/tienda/${tiendaId}/usuario/${usuarioId}`).then((r) => r.data),

  obtener: (tiendaId: number, pedidoId: number) =>
    api.get<Pedido>(`/api/pedidos/tienda/${tiendaId}/${pedidoId}`).then((r) => r.data),

  crearDesdeCarrito: (body: CrearPedidoRequest) =>
    api.post<Pedido>('/api/pedidos', body).then((r) => r.data),

  /** PATCH .../estado?estado=ENVIADO — solo ADMIN. */
  actualizarEstado: (tiendaId: number, pedidoId: number, estado: EstadoPedido) =>
    api
      .patch<Pedido>(`/api/pedidos/tienda/${tiendaId}/${pedidoId}/estado`, null, {
        params: { estado },
      })
      .then((r) => r.data),

  cancelar: (tiendaId: number, pedidoId: number) =>
    api.patch<Pedido>(`/api/pedidos/tienda/${tiendaId}/${pedidoId}/cancelar`).then((r) => r.data),

  /** POST .../qr — genera el QR Stereum. Devuelve datos en snake_case. */
  generarQr: (tiendaId: number, pedidoId: number, body?: GenerarQrRequest) =>
    api
      .post<StereumCharge>(`/api/pedidos/tienda/${tiendaId}/${pedidoId}/qr`, body ?? {})
      .then((r) => r.data),
};
