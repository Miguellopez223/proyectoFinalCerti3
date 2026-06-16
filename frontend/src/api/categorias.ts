import { api } from './client';
import type { Categoria, CategoriaRequest } from '@/types';

export const categoriasApi = {
  listarPorTienda: (tiendaId: number) =>
    api.get<Categoria[]>(`/api/categorias/tienda/${tiendaId}`).then((r) => r.data),

  crear: (body: CategoriaRequest) =>
    api.post<Categoria>('/api/categorias', body).then((r) => r.data),

  actualizar: (id: number, body: CategoriaRequest) =>
    api.put<Categoria>(`/api/categorias/${id}`, body).then((r) => r.data),

  eliminar: (id: number) => api.delete<void>(`/api/categorias/${id}`).then((r) => r.data),
};
