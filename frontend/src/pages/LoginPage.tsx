import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { tiendasApi } from '@/api/tiendas';
import { useAuth, homePathForRol } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import type { Tienda } from '@/types';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);
  const [tiendaError, setTiendaError] = useState<string | null>(null);

  const [tiendaId, setTiendaId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ tiendaId?: string; email?: string; password?: string }>({});
  const loginState = location.state as { from?: string; tiendaId?: number } | null;
  const requestedPath = loginState?.from;
  const requestedTiendaId = loginState?.tiendaId;

  function destinationFor(rol: 'ADMIN' | 'CLIENTE') {
    return requestedPath && rol === 'CLIENTE' ? requestedPath : homePathForRol(rol);
  }

  // Si ya hay sesión, redirige.
  useEffect(() => {
    if (isAuthenticated && user) navigate(destinationFor(user.rol), { replace: true });
  }, [isAuthenticated, user, navigate, requestedPath]);

  // Carga el catálogo de tiendas para el selector.
  useEffect(() => {
    let active = true;
    tiendasApi
      .listar()
      .then((data) => {
        if (!active) return;
        setTiendas(data);
        const tiendaFromState = data.find((tienda) => tienda.id === requestedTiendaId);
        if (tiendaFromState) setTiendaId(String(tiendaFromState.id));
        else if (data.length >= 1) setTiendaId(String(data[0].id));
      })
      .catch((err) => active && setTiendaError(getErrorMessage(err)))
      .finally(() => active && setLoadingTiendas(false));
    return () => {
      active = false;
    };
  }, [requestedTiendaId]);

  function validate() {
    const next: typeof errors = {};
    if (!tiendaId) next.tiendaId = 'Selecciona una tienda.';
    if (!email.trim()) next.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Email no válido.';
    if (!password) next.password = 'La contraseña es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const rol = await login(Number(tiendaId), email.trim(), password);
      toast.success('Bienvenido de vuelta.');
      navigate(destinationFor(rol), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Email o contraseña incorrectos.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(idToken?: string) {
    const next: typeof errors = {};
    if (!tiendaId) next.tiendaId = 'Selecciona una tienda.';
    setErrors(next);
    if (!idToken || Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const rol = await loginWithGoogle(Number(tiendaId), idToken);
      toast.success('Bienvenido con Google.');
      navigate(destinationFor(rol), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo iniciar sesion con Google.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-slate-500">Elige tu tienda e ingresa tus credenciales.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Select
          label="Tienda"
          required
          value={tiendaId}
          onChange={(e) => setTiendaId(e.target.value)}
          error={errors.tiendaId}
          disabled={loadingTiendas || !!tiendaError}
        >
          <option value="">{loadingTiendas ? 'Cargando tiendas…' : 'Selecciona una tienda'}</option>
          {tiendas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </Select>
        {tiendaError && (
          <p className="-mt-2 text-xs text-red-600">No se pudieron cargar las tiendas: {tiendaError}</p>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="admin@comercio1.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Entrar
        </Button>
      </form>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">o</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {googleClientId ? (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) =>
                void handleGoogleCredential(credentialResponse.credential)
              }
              onError={() => toast.error('Google no pudo autenticar la cuenta.')}
              useOneTap={false}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Button type="button" variant="secondary" className="w-full" size="lg" disabled>
              Continuar con Google
            </Button>
            <p className="text-center text-xs text-slate-500">
              Falta configurar VITE_GOOGLE_CLIENT_ID.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Eres cliente nuevo?{' '}
        <Link to="/registro" className="font-medium text-brand-600 hover:text-brand-700">
          Crea tu cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
