import { FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usuariosApi } from '@/api/usuarios';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { DataState } from '@/components/ui/DataState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { IconPlus, IconEdit, IconUsers, IconCheck, IconClose } from '@/components/icons';
import type { Rol, Usuario, UsuarioRequest } from '@/types';

type Filtro = 'TODOS' | Rol;

export default function ClientesPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const { data, loading, error, reload } = useAsync(() => usuariosApi.listarPorTienda(tiendaId), [tiendaId]);

  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'CLIENTE' as Rol, numeroWhatsapp: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const filtrados = useMemo(
    () => (data ?? []).filter((u) => (filtro === 'TODOS' ? true : u.rol === filtro)),
    [data, filtro],
  );

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', email: '', password: '', rol: 'CLIENTE', numeroWhatsapp: '' });
    setErrors({});
    setOpen(true);
  }
  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, numeroWhatsapp: u.numeroWhatsapp ?? '' });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.email.trim()) next.email = 'El email es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email no válido.';
    if (!editing && !form.password) next.password = 'La contraseña es obligatoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const body: UsuarioRequest = {
      tiendaId,
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      // Al editar sin cambiar contraseña, reenviamos la actual vacía no es válido;
      // el backend exige password, por eso al editar mandamos lo que el admin escriba
      // (si lo deja vacío, se reusa un placeholder que el backend rechazará -> avisamos).
      password: form.password,
      rol: form.rol,
      numeroWhatsapp: form.numeroWhatsapp.trim() || undefined,
    };
    try {
      if (editing) {
        await usuariosApi.actualizar(editing.id, body);
        toast.success('Usuario actualizado.');
      } else {
        await usuariosApi.crear(body);
        toast.success('Usuario creado.');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleEstado(u: Usuario) {
    if (u.estado) {
      confirm(
        { title: 'Desactivar usuario', message: <>¿Desactivar a <strong>{u.nombre}</strong>?</>, confirmLabel: 'Desactivar' },
        async () => {
          await usuariosApi.desactivar(u.id);
          toast.success('Usuario desactivado.');
          reload();
        },
      );
    } else {
      confirm(
        { title: 'Reactivar usuario', message: <>¿Reactivar a <strong>{u.nombre}</strong>?</>, confirmLabel: 'Reactivar', variant: 'primary' },
        async () => {
          await usuariosApi.reactivar(u.id);
          toast.success('Usuario reactivado.');
          reload();
        },
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Clientes y usuarios"
        description="Gestiona compradores y administradores de tu tienda."
        actions={
          <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            Nuevo usuario
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['TODOS', 'CLIENTE', 'ADMIN'] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={
              'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
              (filtro === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')
            }
          >
            {f === 'TODOS' ? 'Todos' : f === 'CLIENTE' ? 'Clientes' : 'Administradores'}
          </button>
        ))}
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={filtrados.length === 0}
        onRetry={reload}
        loadingFallback={<div className="card-base p-4"><SkeletonTable rows={6} cols={5} /></div>}
        emptyFallback={
          <EmptyState
            title="Sin usuarios"
            message="No hay usuarios que coincidan con el filtro."
            icon={<IconUsers />}
            action={<Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>Nuevo usuario</Button>}
          />
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Email</Th>
              <Th align="center">Rol</Th>
              <Th align="center">Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <p className="font-medium text-slate-800">{u.nombre}</p>
                  {u.numeroWhatsapp && <p className="text-xs text-slate-400">{u.numeroWhatsapp}</p>}
                </Td>
                <Td className="text-slate-600">{u.email}</Td>
                <Td align="center">
                  <Badge tone={u.rol === 'ADMIN' ? 'brand' : 'info'}>{u.rol}</Badge>
                </Td>
                <Td align="center">
                  <Badge tone={u.estado ? 'success' : 'neutral'}>{u.estado ? 'Activo' : 'Inactivo'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} aria-label="Editar" title="Editar" className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600">
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleEstado(u)}
                      aria-label={u.estado ? 'Desactivar' : 'Reactivar'}
                      title={u.estado ? 'Desactivar' : 'Reactivar'}
                      className={
                        'cursor-pointer rounded-lg p-2 transition-colors ' +
                        (u.estado ? 'text-slate-500 hover:bg-red-50 hover:text-red-600' : 'text-slate-500 hover:bg-cta-50 hover:text-cta-600')
                      }
                    >
                      {u.estado ? <IconClose className="h-4 w-4" /> : <IconCheck className="h-4 w-4" />}
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </DataState>

      <Modal
        open={open}
        onClose={submitting ? () => {} : () => setOpen(false)}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button form="usuario-form" type="submit" loading={submitting}>{editing ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <form id="usuario-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} error={errors.nombre} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} required />
          <Input
            label={editing ? 'Nueva contraseña' : 'Contraseña'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            hint={editing ? 'El backend requiere contraseña al actualizar.' : undefined}
            required={!editing}
          />
          <Select label="Rol" value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value as Rol }))}>
            <option value="CLIENTE">Cliente</option>
            <option value="ADMIN">Administrador</option>
          </Select>
          <Input label="WhatsApp" value={form.numeroWhatsapp} onChange={(e) => setForm((f) => ({ ...f, numeroWhatsapp: e.target.value }))} placeholder="+591 7xxxxxxx" />
        </form>
      </Modal>
      {dialog}
    </>
  );
}
