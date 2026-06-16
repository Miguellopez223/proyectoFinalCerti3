import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homePathForRol } from '@/context/AuthContext';
import type { Rol } from '@/types';

/** Exige sesión y, opcionalmente, un rol concreto. */
export function ProtectedRoute({ rol }: { rol?: Rol }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Si el rol no corresponde a esta sección, lo mandamos a su home.
  if (rol && user.rol !== rol) {
    return <Navigate to={homePathForRol(user.rol)} replace />;
  }

  return <Outlet />;
}
