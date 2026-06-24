import { api } from './client';
import type { AgregarItemCarritoRequest, Carrito } from '@/types';

export const carritoApi = {
  obtenerActivo: (tiendaId: number, usuarioId: number) =>
    api.get<Carrito>(`/api/carrito/tienda/${tiendaId}/usuario/${usuarioId}`).then((r) => r.data),

  /** Todos los carritos activos del usuario (uno por tienda) — carrito multi-tienda. */
  listarActivos: (usuarioId: number) =>
    api.get<Carrito[]>(`/api/carrito/usuario/${usuarioId}`).then((r) => r.data),

  agregarItem: (body: AgregarItemCarritoRequest) =>
    api.post<Carrito>('/api/carrito/agregar', body).then((r) => r.data),

  eliminarItem: (carritoId: number, detalleId: number) =>
    api.delete<Carrito>(`/api/carrito/${carritoId}/item/${detalleId}`).then((r) => r.data),

  vaciar: (carritoId: number) =>
    api.delete<Carrito>(`/api/carrito/${carritoId}/vaciar`).then((r) => r.data),

  /** POST /api/carrito/barrer-abandonados — solo ADMIN (demo). */
  barrerAbandonados: () =>
    api.post<{ mensaje: string }>('/api/carrito/barrer-abandonados').then((r) => r.data),
};
