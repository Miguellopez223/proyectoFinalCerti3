import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { unidadesApi } from '@/api/unidades';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { DataState } from '@/components/ui/DataState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { IconPlus, IconEdit, IconTrash, IconRuler } from '@/components/icons';
import type { UnidadMedida } from '@/types';

export default function UnidadesPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const { data, loading, error, reload } = useAsync(() => unidadesApi.listarPorTienda(tiendaId), [tiendaId]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadMedida | null>(null);
  const [form, setForm] = useState({ nombre: '', abreviatura: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ nombre: '', abreviatura: '' });
    setErrors({});
    setOpen(true);
  }
  function openEdit(u: UnidadMedida) {
    setEditing(u);
    setForm({ nombre: u.nombre, abreviatura: u.abreviatura ?? '' });
    setErrors({});
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrors({ nombre: 'El nombre es obligatorio.' });
      return;
    }
    setSubmitting(true);
    const body = { tiendaId, nombre: form.nombre.trim(), abreviatura: form.abreviatura.trim() || undefined };
    try {
      if (editing) {
        await unidadesApi.actualizar(editing.id, body);
        toast.success('Unidad actualizada.');
      } else {
        await unidadesApi.crear(body);
        toast.success('Unidad creada.');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(u: UnidadMedida) {
    confirm(
      { title: 'Eliminar unidad', message: <>¿Eliminar <strong>{u.nombre}</strong>?</>, confirmLabel: 'Eliminar' },
      async () => {
        await unidadesApi.eliminar(tiendaId, u.id);
        toast.success('Unidad eliminada.');
        reload();
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Unidades de medida"
        description="Define cómo se mide cada producto (unidad, kg, litro…)."
        actions={
          <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            Nueva unidad
          </Button>
        }
      />

      <DataState
        loading={loading}
        error={error}
        isEmpty={(data?.length ?? 0) === 0}
        onRetry={reload}
        loadingFallback={<div className="card-base p-4"><SkeletonTable rows={5} cols={3} /></div>}
        emptyFallback={
          <EmptyState
            title="Sin unidades"
            message="Agrega unidades de medida para tus productos."
            icon={<IconRuler />}
            action={<Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>Nueva unidad</Button>}
          />
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th>Abreviatura</Th>
              <Th align="center">Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u) => (
              <Tr key={u.id}>
                <Td className="font-medium text-slate-800">{u.nombre}</Td>
                <Td className="font-mono text-slate-500">{u.abreviatura || '—'}</Td>
                <Td align="center">
                  <Badge tone={u.estado ? 'success' : 'neutral'}>{u.estado ? 'Activa' : 'Inactiva'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(u)} aria-label="Editar" title="Editar" className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600">
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(u)} aria-label="Eliminar" title="Eliminar" className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
                      <IconTrash className="h-4 w-4" />
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
        title={editing ? 'Editar unidad' : 'Nueva unidad'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button form="unidad-form" type="submit" loading={submitting}>{editing ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <form id="unidad-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} error={errors.nombre} required autoFocus />
          <Input label="Abreviatura" value={form.abreviatura} onChange={(e) => setForm((f) => ({ ...f, abreviatura: e.target.value }))} placeholder="kg, lt, un…" />
        </form>
      </Modal>
      {dialog}
    </>
  );
}
