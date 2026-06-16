import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { pedidosApi } from '@/api/pedidos';
import { useAsync } from '@/hooks/useAsync';
import { DataState } from '@/components/ui/DataState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge, estadoPedidoTone } from '@/components/ui/Badge';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EstadoStepper } from '@/components/EstadoStepper';
import { PedidoItems } from '@/components/PedidoItems';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { IconReceipt } from '@/components/icons';
import type { Pedido } from '@/types';

// Estados en los que el cliente todavía puede cancelar (no enviado/entregado/cancelado).
const CANCELABLES = ['PENDIENTE', 'PAGADO', 'PREPARANDO'];

export default function MisPedidosPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const { data, loading, error, reload, setData } = useAsync(
    () => pedidosApi.listarPorUsuario(tiendaId, user!.userId),
    [tiendaId],
  );

  const [selected, setSelected] = useState<Pedido | null>(null);

  function cancelar(pedido: Pedido) {
    confirm(
      {
        title: 'Cancelar pedido',
        message: <>¿Cancelar el pedido #{pedido.id}? Se repondrá el stock.</>,
        confirmLabel: 'Cancelar pedido',
      },
      async () => {
        const updated = await pedidosApi.cancelar(tiendaId, pedido.id);
        setData((prev) => (prev ? prev.map((p) => (p.id === updated.id ? updated : p)) : prev));
        setSelected((s) => (s && s.id === updated.id ? updated : s));
        toast.success('Pedido cancelado.');
      },
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Mis pedidos</h1>

      <DataState
        loading={loading}
        error={error}
        isEmpty={(data?.length ?? 0) === 0}
        onRetry={reload}
        loadingFallback={
          <div className="card-base p-4">
            <SkeletonTable rows={5} cols={4} />
          </div>
        }
        emptyFallback={
          <EmptyState
            title="Aún no tienes pedidos"
            message="Cuando completes una compra aparecerá aquí."
            icon={<IconReceipt />}
            action={
              <Link to="/tienda">
                <Button>Ir al catálogo</Button>
              </Link>
            }
          />
        }
      >
        <div className="space-y-3">
          {data?.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <IconReceipt />
                </span>
                <div>
                  <p className="font-medium text-slate-800">Pedido #{p.id}</p>
                  <p className="font-mono text-xs text-slate-400">{p.codigoSeguimiento ?? 'sin código'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge tone={estadoPedidoTone(p.estadoPedido)}>{p.estadoPedido}</Badge>
                <span className="font-mono font-semibold text-slate-900">{formatCurrency(p.total)}</span>
                <Button size="sm" variant="secondary" onClick={() => setSelected(p)}>
                  Ver detalle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </DataState>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pedido #${selected.id}` : ''}
        description={selected?.codigoSeguimiento ? `Seguimiento: ${selected.codigoSeguimiento}` : undefined}
        size="lg"
        footer={
          <>
            {selected && CANCELABLES.includes(selected.estadoPedido) && (
              <Button variant="danger" onClick={() => cancelar(selected)}>
                Cancelar pedido
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-6">
            <EstadoStepper estado={selected.estadoPedido} />
            <PedidoItems pedido={selected} />
          </div>
        )}
      </Modal>
      {dialog}
    </div>
  );
}
