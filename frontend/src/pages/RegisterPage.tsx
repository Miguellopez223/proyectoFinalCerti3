import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { AuthInput } from '@/components/AuthField';
import { GradientPill } from '@/components/landing/PillButton';
import { usuariosApi } from '@/api/usuarios';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ nombre: '', email: '', password: '', whatsapp: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) next.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email no valido.';
    if (!form.password) next.password = 'La contrasena es obligatoria.';
    else if (form.password.length < 6) next.password = 'Minimo 6 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await usuariosApi.registrar({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: 'CLIENTE',
        numeroWhatsapp: form.whatsapp.trim() || undefined,
      });
      toast.success('Cuenta creada. Ahora puedes iniciar sesion.');
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
        <p className="mt-1.5 text-sm text-slate-400">Registrate para comprar en Klikea.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthInput label="Nombre completo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} error={errors.nombre} required />
        <AuthInput label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} required />
        <AuthInput label="Contrasena" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} hint="Minimo 6 caracteres." required />
        <AuthInput label="WhatsApp (opcional)" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+591 7xxxxxxx" />

        <GradientPill type="submit" disabled={submitting} className="mt-2 w-full">
          {submitting ? 'Creando...' : 'Crear cuenta'}
        </GradientPill>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-[#e7a149] transition-colors hover:text-[#f4c178]">
          Inicia sesion
        </Link>
      </p>
    </AuthShell>
  );
}
