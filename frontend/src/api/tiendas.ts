import { api } from './client';
import type { Tienda } from '@/types';

export const tiendasApi = {
  /** GET /api/tiendas — público. Para el selector de tienda en el login. */
  listar: () => api.get<Tienda[]>('/api/tiendas').then((r) => r.data),

  obtener: (id: number) => api.get<Tienda>(`/api/tiendas/${id}`).then((r) => r.data),

  obtenerPorSlug: (slug: string) =>
    api.get<Tienda>(`/api/tiendas/slug/${slug}`).then((r) => r.data),
};
