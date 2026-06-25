import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { AuthInput, AuthSelect } from '@/components/AuthField';
import { GradientPill } from '@/components/landing/PillButton';
import { tiendasApi } from '@/api/tiendas';
import { usuariosApi } from '@/api/usuarios';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import type { Tienda } from '@/types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);

  const [form, setForm] = useState({ tiendaId: '', nombre: '', email: '', password: '', whatsapp: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    tiendasApi
      .listar()
      .then((data) => active && setTiendas(data))
      .catch((err) => active && toast.error(getErrorMessage(err)))
      .finally(() => active && setLoadingTiendas(false));
    return () => {
      active = false;
    };
  }, [toast]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.tiendaId) next.tiendaId = 'Selecciona una tienda.';
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) next.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email no válido.';
    if (!form.password) next.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 6) next.password = 'Mínimo 6 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await usuariosApi.registrar({
        tiendaId: Number(form.tiendaId),
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: 'CLIENTE',
        numeroWhatsapp: form.whatsapp.trim() || undefined,
      });
      toast.success('Cuenta creada. Ahora puedes iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      toast.error(getErrorMessage(err, 'No se pudo crear la cuenta.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Crear cuenta</h2>
        <p className="mt-1.5 text-sm text-slate-400">Regístrate para comprar en tu tienda.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthSelect
          label="Tienda"
          required
          value={form.tiendaId}
          onChange={(e) => set('tiendaId', e.target.value)}
          error={errors.tiendaId}
          disabled={loadingTiendas}
        >
          <option value="">{loadingTiendas ? 'Cargando tiendas…' : 'Selecciona una tienda'}</option>
          {tiendas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </AuthSelect>

        <AuthInput label="Nombre completo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} error={errors.nombre} required />
        <AuthInput label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} required />
        <AuthInput label="Contraseña" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} hint="Mínimo 6 caracteres." required />
        <AuthInput label="WhatsApp (opcional)" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+591 7xxxxxxx" />

        <GradientPill type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Creando…' : 'Crear cuenta'}
        </GradientPill>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-[#e7a149] transition-colors hover:text-[#f4c178]">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
