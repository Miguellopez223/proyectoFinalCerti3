import { api } from './client';
import type { BusquedaResponse, CategoriaPopular, HomeData, Producto } from '@/types';

export type OrdenBusqueda = 'relevante' | 'reciente' | 'precio_asc' | 'precio_desc' | 'descuento';

export interface BuscarParams {
  q: string;
  tiendaId?: number | null;
  orden?: OrdenBusqueda;
  page?: number;
  size?: number;
}

export const marketplaceApi = {
  buscar: (p: BuscarParams) =>
    api
      .get<BusquedaResponse>('/api/marketplace/buscar', {
        params: {
          q: p.q,
          tiendaId: p.tiendaId ?? undefined,
          orden: p.orden ?? 'relevante',
          page: p.page ?? 0,
          size: p.size ?? 20,
        },
      })
      .then((r) => r.data),

  sugerencias: (q: string, limit = 6) =>
    api.get<Producto[]>('/api/marketplace/sugerencias', { params: { q, limit } }).then((r) => r.data),

  categoriasPopulares: (limit = 12) =>
    api.get<CategoriaPopular[]>('/api/marketplace/categorias-populares', { params: { limit } }).then((r) => r.data),

  obtenerProducto: (id: number) =>
    api.get<Producto>(`/api/marketplace/producto/${id}`).then((r) => r.data),

  home: () => api.get<HomeData>('/api/marketplace/home').then((r) => r.data),

  recomendados: (productoId: number, limit = 5) =>
    api.get<Producto[]>(`/api/marketplace/recomendados/${productoId}`, { params: { limit } }).then((r) => r.data),
};
