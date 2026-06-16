// Decodificación del payload de un JWT (solo lectura, sin verificar firma).
// El backend pone: claim `sub` = email, claim `jti` (vía Claims.id()) = userId.
// Dejamos fallbacks por si en otra versión usa `id`.

interface JwtPayload {
  sub?: string; // email
  jti?: string; // userId (Claims.id() de JJWT mapea a "jti")
  id?: string | number; // fallback
  exp?: number; // segundos epoch
  [key: string]: unknown;
}

/** Decodifica el payload de un JWT. Devuelve null si el token es inválido. */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    // base64url -> base64
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Extrae el userId del JWT (claim `jti`, con fallback a `id`). */
export function getUserIdFromToken(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  const raw = payload.jti ?? payload.id;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Email del JWT (claim `sub`). */
export function getEmailFromToken(token: string): string | null {
  return decodeJwt(token)?.sub ?? null;
}

/** true si el token expiró según el claim `exp` (segundos). */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}