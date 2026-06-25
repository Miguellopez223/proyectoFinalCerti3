import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthShell } from '@/components/AuthShell';
import { AuthInput } from '@/components/AuthField';
import { GradientPill } from '@/components/landing/PillButton';
import { useAuth, homePathForRol } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const loginState = location.state as { from?: string } | null;
  const requestedPath = loginState?.from;

  function destinationFor(rol: 'ADMIN' | 'CLIENTE') {
    return requestedPath && rol === 'CLIENTE' ? requestedPath : homePathForRol(rol);
  }

  // Si ya hay sesión, redirige.
  useEffect(() => {
    if (isAuthenticated && user) navigate(destinationFor(user.rol), { replace: true });
  }, [isAuthenticated, user, navigate, requestedPath]);

  function validate() {
    const next: typeof errors = {};
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
      const rol = await login(email.trim(), password);
      toast.success('Bienvenido de vuelta.');
      navigate(destinationFor(rol), { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Email o contraseña incorrectos.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(idToken?: string) {
    if (!idToken) return;
    setSubmitting(true);
    try {
      const rol = await loginWithGoogle(idToken);
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Iniciar sesión</h2>
        <p className="mt-1.5 text-sm text-slate-400">Ingresa tus credenciales para continuar.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="admin@comercio1.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <AuthInput
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />

        <GradientPill type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Entrando…' : 'Entrar'}
        </GradientPill>
      </form>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-medium uppercase tracking-wide text-white/35">o</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {googleClientId ? (
          <div className="flex justify-center [color-scheme:light]">
            <GoogleLogin
              onSuccess={(credentialResponse) =>
                void handleGoogleCredential(credentialResponse.credential)
              }
              onError={() => toast.error('Google no pudo autenticar la cuenta.')}
              useOneTap={false}
              theme="filled_black"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full border border-white/12 bg-white/5 py-3 text-sm font-medium uppercase tracking-widest text-white/40"
            >
              Continuar con Google
            </button>
            <p className="text-center text-xs text-white/40">
              Falta configurar VITE_GOOGLE_CLIENT_ID.
            </p>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Eres cliente nuevo?{' '}
        <Link to="/registro" className="font-semibold text-[#e7a149] transition-colors hover:text-[#f4c178]">
          Crea tu cuenta
        </Link>
      </p>
    </AuthShell>
  );
}
