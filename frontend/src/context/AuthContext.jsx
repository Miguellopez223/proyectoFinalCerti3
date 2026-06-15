import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearStoredSession, getStoredSession, storeSession } from "../services/authStorage";
import { decodeJwtPayload, normalizeLoginResponse } from "../utils/normalizers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    if (session.expiresAt && Date.now() >= session.expiresAt) {
      clearStoredSession();
      setSession(null);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.token),
      session,
      signIn(loginResponse, storeId) {
        const normalized = normalizeLoginResponse(loginResponse);
        const payload = decodeJwtPayload(normalized.accessToken);
        const nextSession = {
          token: normalized.accessToken,
          tokenType: normalized.tokenType,
          expiresAt: normalized.expiresAt,
          storeId: Number(storeId),
          userId: payload?.id ? Number(payload.id) : null,
          email: payload?.sub ?? null
        };
        storeSession(nextSession);
        setSession(nextSession);
        return nextSession;
      },
      signOut() {
        clearStoredSession();
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

