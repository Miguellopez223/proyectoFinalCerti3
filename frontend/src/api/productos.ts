import { api } from './client';
import type { Page, Producto, ProductoRequest } from '@/types';

export interface ListarPaginadoParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const productosApi = {
  listarPorTienda: (tiendaId: number) =>
    api.get<Producto[]>(`/api/productos/tienda/${tiendaId}`).then((r) => r.data),

  listarPaginado: (tiendaId: number, params: ListarPaginadoParams = {}) =>
    api
      .get<Page<Producto>>(`/api/productos/tienda/${tiendaId}/paginado`, {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
          sortBy: params.sortBy ?? 'nombre',
          sortDir: params.sortDir ?? 'ASC',
        },
      })
      .then((r) => r.data),

  listarPorCategoria: (tiendaId: number, categoriaId: number) =>
    api
      .get<Producto[]>(`/api/productos/tienda/${tiendaId}/categoria/${categoriaId}`)
      .then((r) => r.data),

  obtener: (tiendaId: number, productoId: number) =>
    api.get<Producto>(`/api/productos/tienda/${tiendaId}/${productoId}`).then((r) => r.data),

  crear: (body: ProductoRequest) =>
    api.post<Producto>('/api/productos', body).then((r) => r.data),

  actualizar: (id: number, body: ProductoRequest) =>
    api.put<Producto>(`/api/productos/${id}`, body).then((r) => r.data),

  eliminar: (tiendaId: number, id: number) =>
    api.delete<void>(`/api/productos/tienda/${tiendaId}/${id}`).then((r) => r.data),
};
