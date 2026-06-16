import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { inventarioApi } from '@/api/inventario';
import { productosApi } from '@/api/productos';
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
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { IconPlus, IconWarehouse, IconTrendUp, IconTrendDown } from '@/components/icons';
import type { Producto, TipoMovimiento } from '@/types';

export default function InventarioPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(() => inventarioApi.listarPorTienda(tiendaId), [tiendaId]);

  const [open, setOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({ productoId: '', tipo: 'ENTRADA' as TipoMovimiento, cantidad: '', referencia: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    productosApi.listarPorTienda(tiendaId).then(setProductos).catch(() => setProductos([]));
  }, [open, tiendaId]);

  function openCreate() {
    setForm({ productoId: '', tipo: 'ENTRADA', cantidad: '', referencia: '' });
    setErrors({});
    setOpen(true);
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.productoId) next.productoId = 'Selecciona un producto.';
    const cant = Number(form.cantidad);
    if (!form.cantidad || Number.isNaN(cant) || cant <= 0) next.cantidad = 'La cantidad debe ser mayor a 0.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await inventarioApi.registrar({
        tiendaId,
        productoId: Number(form.productoId),
        usuarioId: user!.userId,
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        referencia: form.referencia.trim() || undefined,
      });
      toast.success('Movimiento registrado.');
      setOpen(false);
      reload();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Registra entradas y salidas manuales de stock."
        actions={
          <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            Nuevo movimiento
          </Button>
        }
      />

      <DataState
        loading={loading}
        error={error}
        isEmpty={(data?.length ?? 0) === 0}
        onRetry={reload}
        loadingFallback={<div className="card-base p-4"><SkeletonTable rows={6} cols={5} /></div>}
        emptyFallback={
          <EmptyState
            title="Sin movimientos"
            message="Aún no se registraron movimientos de inventario."
            icon={<IconWarehouse />}
            action={<Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>Nuevo movimiento</Button>}
          />
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Producto</Th>
              <Th align="center">Tipo</Th>
              <Th align="right">Cantidad</Th>
              <Th>Referencia</Th>
            </tr>
          </thead>
          <tbody>
            {data?.map((m) => {
              const entrada = m.tipo === 'ENTRADA';
              return (
                <Tr key={m.id}>
                  <Td className="whitespace-nowrap text-slate-500">{formatDateTime(m.fecha)}</Td>
                  <Td className="font-medium text-slate-800">{m.productoNombre}</Td>
                  <Td align="center">
                    <Badge tone={entrada ? 'success' : 'warning'}>
                      {entrada ? <IconTrendUp className="h-3.5 w-3.5" /> : <IconTrendDown className="h-3.5 w-3.5" />}
                      {m.tipo}
                    </Badge>
                  </Td>
                  <Td align="right" className="font-mono font-medium text-slate-800">
                    {entrada ? '+' : '−'}
                    {m.cantidad}
                  </Td>
                  <Td className="text-slate-500">{m.referencia || '—'}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </DataState>

      <Modal
        open={open}
        onClose={submitting ? () => {} : () => setOpen(false)}
        title="Nuevo movimiento de inventario"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>Cancelar</Button>
            <Button form="mov-form" type="submit" loading={submitting}>Registrar</Button>
          </>
        }
      >
        <form id="mov-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          <Select label="Producto" value={form.productoId} onChange={(e) => setForm((f) => ({ ...f, productoId: e.target.value }))} error={errors.productoId} required>
            <option value="">Selecciona un producto</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (stock: {p.stock})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoMovimiento }))}>
              <option value="ENTRADA">Entrada (+)</option>
              <option value="SALIDA">Salida (−)</option>
            </Select>
            <Input label="Cantidad" type="number" min="1" value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} error={errors.cantidad} required />
          </div>
          <Input label="Referencia" value={form.referencia} onChange={(e) => setForm((f) => ({ ...f, referencia: e.target.value }))} placeholder="Ajuste, compra a proveedor…" />
        </form>
      </Modal>
    </>
  );
}
