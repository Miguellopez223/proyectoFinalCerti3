import { api } from './client';
import type { Pago } from '@/types';

export const pagosApi = {
  listarPorPedido: (pedidoId: number) =>
    api.get<Pago[]>(`/api/pagos/pedido/${pedidoId}`).then((r) => r.data),
};
