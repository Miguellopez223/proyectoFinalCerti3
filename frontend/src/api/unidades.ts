import { api } from './client';
import type { UnidadMedida, UnidadMedidaRequest } from '@/types';

export const unidadesApi = {
  listarPorTienda: (tiendaId: number) =>
    api.get<UnidadMedida[]>(`/api/unidades-medida/tienda/${tiendaId}`).then((r) => r.data),

  crear: (body: UnidadMedidaRequest) =>
    api.post<UnidadMedida>('/api/unidades-medida', body).then((r) => r.data),

  actualizar: (id: number, body: UnidadMedidaRequest) =>
    api.put<UnidadMedida>(`/api/unidades-medida/${id}`, body).then((r) => r.data),

  eliminar: (tiendaId: number, id: number) =>
    api.delete<void>(`/api/unidades-medida/tienda/${tiendaId}/${id}`).then((r) => r.data),
};
