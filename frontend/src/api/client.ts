import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const STORAGE_KEY = 'multitienda.session';

/** Lee el token de la sesión guardada en localStorage. */
function readToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Callback invocado cuando la API responde 401. El AuthProvider lo registra
 * para limpiar la sesión y redirigir a /login sin acoplar axios al router.
 */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyecta Authorization: Bearer <token> en cada request si hay sesión.
api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante un 401: limpia sesión y redirige a /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    // No disparar el logout global durante el propio login (ahí el 401 es
    // "credenciales incorrectas" y se maneja en la pantalla de login).
    const isAuthAttempt = url.includes('/api/auth') && !url.includes('/logout');
    if (status === 401 && !isAuthAttempt) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export { STORAGE_KEY };
