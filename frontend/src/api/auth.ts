import { api } from './client';
import type { GoogleLoginRequest, LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  /** POST /api/auth — login multi-tienda. Body usa snake_case `tienda_id`. */
  login: (body: LoginRequest) => api.post<LoginResponse>('/api/auth', body).then((r) => r.data),

  /** POST /api/auth/google — login con Google Identity Services. */
  loginGoogle: (body: GoogleLoginRequest) =>
    api.post<LoginResponse>('/api/auth/google', body).then((r) => r.data),

  /** POST /api/auth/logout — invalida el token actual (requiere Authorization). */
  logout: () => api.post('/api/auth/logout').then((r) => r.data),
};
