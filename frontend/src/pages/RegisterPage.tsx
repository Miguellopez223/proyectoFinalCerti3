import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
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
        <h2 className="text-2xl font-semibold text-slate-900">Crear cuenta de cliente</h2>
        <p className="mt-1 text-sm text-slate-500">Regístrate para comprar en tu tienda.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Select
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
        </Select>

        <Input label="Nombre completo" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} error={errors.nombre} required />
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} required />
        <Input label="Contraseña" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} hint="Mínimo 6 caracteres." required />
        <Input label="WhatsApp (opcional)" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+591 7xxxxxxx" />

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
