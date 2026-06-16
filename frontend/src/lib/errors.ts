import { AxiosError } from 'axios';
import type { ProblemDetails } from '@/types';

/**
 * Extrae un mensaje legible de un error de la API.
 * Prioriza el campo `detail` del Problem Details (RFC 7807), con fallbacks.
 */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;

    // 500: mensaje genérico, no exponer detalles del servidor.
    if (status && status >= 500) {
      return 'Ocurrió un error en el servidor, intenta más tarde.';
    }

    const data = error.response?.data as ProblemDetails | string | undefined;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      const msg = data.detail || data.message || data.error || data.mensaje || data.title;
      if (msg) return msg;
    }

    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. ¿Está corriendo el backend en :8081?';
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Devuelve los errores de validación por campo (propiedad `errors` del Problem Details). */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (isAxiosError(error)) {
    const data = error.response?.data as ProblemDetails | undefined;
    if (data && typeof data === 'object' && data.errors && typeof data.errors === 'object') {
      return data.errors;
    }
  }
  return {};
}

export function getStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

function isAxiosError(error: unknown): error is AxiosError {
  return Boolean(error) && (error as AxiosError).isAxiosError === true;
}
