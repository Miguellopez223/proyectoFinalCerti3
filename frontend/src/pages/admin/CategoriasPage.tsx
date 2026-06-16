import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { categoriasApi } from '@/api/categorias';
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
import { IconPlus, IconEdit, IconTrash, IconTag } from '@/components/icons';
import type { Categoria } from '@/types';

export default function CategoriasPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const { data, loading, error, reload } = useAsync(() => categoriasApi.listarPorTienda(tiendaId), [tiendaId]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setNombre('');
    setFieldError(undefined);
    setOpen(true);
  }
  function openEdit(c: Categoria) {
    setEditing(c);
    setNombre(c.nombre);
    setFieldError(undefined);
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setFieldError('El nombre es obligatorio.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await categoriasApi.actualizar(editing.id, { tiendaId, nombre: nombre.trim() });
        toast.success('Categoría actualizada.');
      } else {
        await categoriasApi.crear({ tiendaId, nombre: nombre.trim() });
        toast.success('Categoría creada.');
      }
      setOpen(false);
      reload();
    } catch (err) {
      setFieldError(getFieldErrors(err).nombre);
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(c: Categoria) {
    confirm(
      { title: 'Eliminar categoría', message: <>¿Eliminar <strong>{c.nombre}</strong>?</>, confirmLabel: 'Eliminar' },
      async () => {
        await categoriasApi.eliminar(c.id);
        toast.success('Categoría eliminada.');
        reload();
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organiza tus productos por categoría."
        actions={
          <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            Nueva categoría
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
            title="Sin categorías"
            message="Crea categorías para clasificar tus productos."
            icon={<IconTag />}
            action={<Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>Nueva categoría</Button>}
          />
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Nombre</Th>
              <Th align="center">Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-slate-800">{c.nombre}</Td>
                <Td align="center">
                  <Badge tone={c.estado ? 'success' : 'neutral'}>{c.estado ? 'Activa' : 'Inactiva'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} aria-label="Editar" title="Editar" className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-600">
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} aria-label="Eliminar" title="Eliminar" className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
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
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button form="categoria-form" type="submit" loading={submitting}>{editing ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <form id="categoria-form" onSubmit={handleSubmit} noValidate>
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={fieldError} required autoFocus />
        </form>
      </Modal>
      {dialog}
    </>
  );
}
