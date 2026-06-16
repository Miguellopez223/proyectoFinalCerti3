import { api } from './client';
import type { DireccionEnvio, DireccionEnvioRequest } from '@/types';

export const direccionesApi = {
  listarPorUsuario: (usuarioId: number) =>
    api.get<DireccionEnvio[]>(`/api/direcciones/usuario/${usuarioId}`).then((r) => r.data),

  obtener: (id: number) => api.get<DireccionEnvio>(`/api/direcciones/${id}`).then((r) => r.data),

  crear: (body: DireccionEnvioRequest) =>
    api.post<DireccionEnvio>('/api/direcciones', body).then((r) => r.data),

  actualizar: (id: number, body: DireccionEnvioRequest) =>
    api.put<DireccionEnvio>(`/api/direcciones/${id}`, body).then((r) => r.data),

  eliminar: (id: number) => api.delete<void>(`/api/direcciones/${id}`).then((r) => r.data),
};
