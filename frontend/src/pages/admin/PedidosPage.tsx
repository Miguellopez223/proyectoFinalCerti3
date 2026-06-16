import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { pedidosApi } from '@/api/pedidos';
import { usuariosApi } from '@/api/usuarios';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Badge, estadoPedidoTone } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EstadoStepper } from '@/components/EstadoStepper';
import { PedidoItems } from '@/components/PedidoItems';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { IconReceipt, IconSearch } from '@/components/icons';
import type { EstadoPedido, Pedido, Usuario } from '@/types';

const ESTADOS: EstadoPedido[] = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

export default function PedidosPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [lookupId, setLookupId] = useState('');
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [updating, setUpdating] = useState(false);

  // Carga clientes para el selector.
  useEffect(() => {
    usuariosApi
      .listarPorTienda(tiendaId)
      .then((all) => setClientes(all))
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [tiendaId, toast]);

  // Carga pedidos del cliente seleccionado.
  useEffect(() => {
    if (!clienteId) {
      setPedidos([]);
      return;
    }
    setLoadingPedidos(true);
    setListError(null);
    pedidosApi
      .listarPorUsuario(tiendaId, Number(clienteId))
      .then(setPedidos)
      .catch((err) => setListError(getErrorMessage(err)))
      .finally(() => setLoadingPedidos(false));
  }, [clienteId, tiendaId]);

  const clienteNombre = useMemo(
    () => clientes.find((c) => String(c.id) === clienteId)?.nombre ?? '',
    [clientes, clienteId],
  );

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    const id = Number(lookupId);
    if (!id) return;
    try {
      const pedido = await pedidosApi.obtener(tiendaId, id);
      setSelected(pedido);
    } catch (err) {
      toast.error(getErrorMessage(err, `No se encontró el pedido #${id}.`));
    }
  }

  async function refreshSelected(id: number) {
    const fresh = await pedidosApi.obtener(tiendaId, id);
    setSelected(fresh);
    setPedidos((list) => list.map((p) => (p.id === fresh.id ? fresh : p)));
  }

  async function changeEstado(estado: EstadoPedido) {
    if (!selected) return;
    setUpdating(true);
    try {
      await pedidosApi.actualizarEstado(tiendaId, selected.id, estado);
      await refreshSelected(selected.id);
      toast.success(`Estado cambiado a ${estado}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  function cancelar() {
    if (!selected) return;
    confirm(
      {
        title: 'Cancelar pedido',
        message: 'Esto repondrá el stock automáticamente. ¿Continuar?',
        confirmLabel: 'Cancelar pedido',
      },
      async () => {
        await pedidosApi.cancelar(tiendaId, selected.id);
        await refreshSelected(selected.id);
        toast.success('Pedido cancelado.');
      },
    );
  }

  return (
    <>
      <PageHeader title="Pedidos" description="Consulta y gestiona las ventas de tu tienda." />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Select label="Ver pedidos de un cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecciona un cliente</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} — {c.email}
            </option>
          ))}
        </Select>
        <form onSubmit={handleLookup} className="flex items-end gap-2">
          <Input
            label="Buscar pedido por #"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            type="number"
            min="1"
            placeholder="Ej. 12"
            className="flex-1"
          />
          <Button type="submit" variant="secondary" leftIcon={<IconSearch className="h-4 w-4" />}>
            Buscar
          </Button>
        </form>
      </div>

      {!clienteId ? (
        <EmptyState
          title="Selecciona un cliente"
          message="Elige un cliente para ver sus pedidos, o busca uno por su número."
          icon={<IconReceipt />}
        />
      ) : loadingPedidos ? (
        <div className="flex justify-center py-12">
          <Spinner label="Cargando pedidos…" />
        </div>
      ) : listError ? (
        <EmptyState title="No se pudo cargar" message={listError} icon={<IconReceipt />} />
      ) : pedidos.length === 0 ? (
        <EmptyState title="Sin pedidos" message={`${clienteNombre} aún no tiene pedidos.`} icon={<IconReceipt />} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Seguimiento</Th>
              <Th align="center">Estado</Th>
              <Th align="right">Total</Th>
              <Th align="right">Acción</Th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <Tr key={p.id}>
                <Td className="font-mono text-slate-600">#{p.id}</Td>
                <Td className="font-mono text-xs text-slate-500">{p.codigoSeguimiento ?? '—'}</Td>
                <Td align="center">
                  <Badge tone={estadoPedidoTone(p.estadoPedido)}>{p.estadoPedido}</Badge>
                </Td>
                <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(p.total)}</Td>
                <Td align="right">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(p)}>
                    Ver / gestionar
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido #${selected.id}` : ''}
        description={selected?.codigoSeguimiento ? `Seguimiento: ${selected.codigoSeguimiento}` : undefined}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Cerrar
          </Button>
        }
      >
        {selected && (
          <div className="space-y-6">
            <EstadoStepper estado={selected.estadoPedido} />

            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex-1">
                <label className="label-base">Cambiar estado</label>
                <Select
                  value={selected.estadoPedido}
                  onChange={(e) => changeEstado(e.target.value as EstadoPedido)}
                  disabled={updating || selected.estadoPedido === 'CANCELADO'}
                >
                  {ESTADOS.map((es) => (
                    <option key={es} value={es}>
                      {es}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="danger"
                onClick={cancelar}
                disabled={updating || selected.estadoPedido === 'CANCELADO' || selected.estadoPedido === 'ENTREGADO'}
              >
                Cancelar pedido
              </Button>
            </div>

            <PedidoItems pedido={selected} />
          </div>
        )}
      </Modal>
      {dialog}
    </>
  );
}
