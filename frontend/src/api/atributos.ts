import { api } from './client';
import type { AtributoProducto, AtributoProductoRequest } from '@/types';

export const atributosApi = {
  listarPorProducto: (productoId: number) =>
    api.get<AtributoProducto[]>(`/api/atributos/producto/${productoId}`).then((r) => r.data),

  agregar: (body: AtributoProductoRequest) =>
    api.post<AtributoProducto>('/api/atributos', body).then((r) => r.data),

  actualizar: (id: number, body: AtributoProductoRequest) =>
    api.put<AtributoProducto>(`/api/atributos/${id}`, body).then((r) => r.data),

  eliminar: (id: number) => api.delete<void>(`/api/atributos/${id}`).then((r) => r.data),
};
