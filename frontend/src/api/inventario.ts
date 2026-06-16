import { api } from './client';
import type { MovimientoInventario, MovimientoInventarioRequest } from '@/types';

export const inventarioApi = {
  listarPorTienda: (tiendaId: number) =>
    api.get<MovimientoInventario[]>(`/api/inventario/tienda/${tiendaId}`).then((r) => r.data),

  listarPorProducto: (productoId: number) =>
    api.get<MovimientoInventario[]>(`/api/inventario/producto/${productoId}`).then((r) => r.data),

  registrar: (body: MovimientoInventarioRequest) =>
    api.post<MovimientoInventario>('/api/inventario', body).then((r) => r.data),
};
