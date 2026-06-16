import { api } from './client';
import type { Usuario, UsuarioRequest } from '@/types';

export const usuariosApi = {
  listarPorTienda: (tiendaId: number) =>
    api.get<Usuario[]>(`/api/usuarios/tienda/${tiendaId}`).then((r) => r.data),

  obtener: (id: number) => api.get<Usuario>(`/api/usuarios/${id}`).then((r) => r.data),

  /** POST /api/usuarios/registrar — público. Siempre crea rol CLIENTE. */
  registrar: (body: UsuarioRequest) =>
    api.post<Usuario>('/api/usuarios/registrar', body).then((r) => r.data),

  /** POST /api/usuarios — ADMIN. Respeta el rol enviado. */
  crear: (body: UsuarioRequest) => api.post<Usuario>('/api/usuarios', body).then((r) => r.data),

  actualizar: (id: number, body: UsuarioRequest) =>
    api.put<Usuario>(`/api/usuarios/${id}`, body).then((r) => r.data),

  desactivar: (id: number) => api.delete<void>(`/api/usuarios/${id}`).then((r) => r.data),

  reactivar: (id: number) =>
    api.patch<Usuario>(`/api/usuarios/${id}/reactivar`).then((r) => r.data),
};
