import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { usuariosApi } from '@/api/usuarios';
import { setUnauthorizedHandler, STORAGE_KEY } from '@/api/client';
import { getUserIdFromToken, isTokenExpired } from '@/lib/jwt';
import type { Rol, SessionUser } from '@/types';

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  initializing: boolean;
  /** Login multi-tienda: valida, decodifica JWT, obtiene rol y redirige por rol. */
  login: (tiendaId: number, email: string, password: string) => Promise<Rol>;
  loginWithGoogle: (tiendaId: number, idToken: string) => Promise<Rol>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed.token || isTokenExpired(parsed.token)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(user: SessionUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<SessionUser | null>(() => readSession());
  const [initializing, setInitializing] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // El interceptor de axios llama esto ante un 401.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
      navigate('/login', { replace: true });
    });
  }, [clearSession, navigate]);

  const login = useCallback(
    async (tiendaId: number, email: string, password: string): Promise<Rol> => {
      setInitializing(true);
      try {
        // 1. Autenticar (snake_case tienda_id).
        const res = await authApi.login({ tienda_id: tiendaId, email, password });
        const token = res.access_token;

        // 2. Decodificar el JWT para sacar el userId (claim jti).
        const userId = getUserIdFromToken(token);
        if (!userId) {
          throw new Error('No se pudo leer el usuario del token.');
        }

        // Guardamos un usuario provisional para que el interceptor adjunte el token
        // en la llamada de perfil que viene a continuación.
        const provisional: SessionUser = {
          token,
          userId,
          tiendaId,
          rol: 'CLIENTE',
          nombre: email,
          email,
          expiresAt: res.expires_at,
        };
        writeSession(provisional);

        // 3. Obtener el perfil para conocer el rol y el nombre real.
        const perfil = await usuariosApi.obtener(userId);
        const session: SessionUser = {
          token,
          userId,
          tiendaId: perfil.tiendaId ?? tiendaId,
          rol: perfil.rol,
          nombre: perfil.nombre,
          email: perfil.email,
          expiresAt: res.expires_at,
        };

        // 4. Persistir + estado.
        writeSession(session);
        setUser(session);
        return session.rol;
      } catch (err) {
        clearSession();
        throw err;
      } finally {
        setInitializing(false);
      }
    },
    [clearSession],
  );

  const loginWithGoogle = useCallback(
    async (tiendaId: number, idToken: string): Promise<Rol> => {
      setInitializing(true);
      try {
        const res = await authApi.loginGoogle({ tienda_id: tiendaId, id_token: idToken });
        const token = res.access_token;
        const userId = getUserIdFromToken(token);
        if (!userId) {
          throw new Error('No se pudo leer el usuario del token.');
        }

        const provisional: SessionUser = {
          token,
          userId,
          tiendaId,
          rol: 'CLIENTE',
          nombre: 'Google',
          email: '',
          expiresAt: res.expires_at,
        };
        writeSession(provisional);

        const perfil = await usuariosApi.obtener(userId);
        const session: SessionUser = {
          token,
          userId,
          tiendaId: perfil.tiendaId ?? tiendaId,
          rol: perfil.rol,
          nombre: perfil.nombre,
          email: perfil.email,
          expiresAt: res.expires_at,
        };

        writeSession(session);
        setUser(session);
        return session.rol;
      } catch (err) {
        clearSession();
        throw err;
      } finally {
        setInitializing(false);
      }
    },
    [clearSession],
  );

  const logout = useCallback(async () => {
    clearSession();
    navigate('/tienda', { replace: true });

    try {
      await authApi.logout();
    } catch {
      // aunque falle el backend, la sesion local ya quedo cerrada.
    }
  }, [clearSession, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      initializing,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, initializing, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** Helper: ruta home según rol. */
export function homePathForRol(rol: Rol): string {
  return rol === 'ADMIN' ? '/admin' : '/tienda';
}
