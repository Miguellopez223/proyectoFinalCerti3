import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dashboardApi } from '@/api/dashboard';
import { carritoApi } from '@/api/carrito';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataState } from '@/components/ui/DataState';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Badge, estadoPedidoTone } from '@/components/ui/Badge';
import { Th, Td, Tr } from '@/components/ui/Table';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconBox, IconWarehouse, IconReceipt, IconAlert, IconChart, IconBroom } from '@/components/icons';

export default function DashboardPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => dashboardApi.obtener(tiendaId), [tiendaId]);
  const [sweeping, setSweeping] = useState(false);

  async function barrerAbandonados() {
    setSweeping(true);
    try {
      const res = await carritoApi.barrerAbandonados();
      toast.success(res.mensaje ?? 'Barrido ejecutado.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSweeping(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de tu tienda en tiempo real."
        actions={
          <Button variant="secondary" leftIcon={<IconBroom className="h-4 w-4" />} loading={sweeping} onClick={barrerAbandonados}>
            Barrer carritos abandonados
          </Button>
        }
      />

      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        loadingFallback={
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        }
      >
        {data && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="Productos activos" value={data.totalProductos} icon={IconBox} tone="brand" />
              <Kpi label="Ventas de hoy" value={data.ventasHoy} icon={IconReceipt} tone="info" />
              <Kpi label="Ingresos de hoy" value={formatCurrency(data.ingresosHoy)} icon={IconChart} tone="success" isMoney />
              <Kpi label="Movimientos inventario" value={data.totalMovimientos} icon={IconWarehouse} tone="neutral" />
            </div>

            {/* Estado de stock */}
            <div className="grid gap-4 sm:grid-cols-2">
              <StockPill
                title="Productos agotados"
                value={data.productosAgotados}
                tone={data.productosAgotados > 0 ? 'danger' : 'success'}
              />
              <StockPill
                title="Stock bajo (≤ mínimo)"
                value={data.productosStockBajo}
                tone={data.productosStockBajo > 0 ? 'warning' : 'success'}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {/* Alertas de stock */}
              <Card>
                <CardHeader title="Alertas de stock" subtitle="Productos en estado crítico o agotado" />
                {data.alertasStock.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      title="Todo bajo control"
                      message="No hay productos en estado crítico."
                      icon={<IconAlert />}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr>
                          <Th>Producto</Th>
                          <Th align="right">Stock</Th>
                          <Th align="right">Mínimo</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.alertasStock.map((p) => (
                          <Tr key={p.id}>
                            <Td className="font-medium text-slate-800">{p.nombre}</Td>
                            <Td align="right">
                              <Badge tone={p.stock === 0 ? 'danger' : 'warning'}>{p.stock}</Badge>
                            </Td>
                            <Td align="right" className="font-mono text-slate-500">{p.stockMinimo ?? '—'}</Td>
                          </Tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Últimas ventas */}
              <Card>
                <CardHeader title="Últimas ventas" subtitle="Pedidos completados recientes" />
                {data.ultimasVentas.length === 0 ? (
                  <div className="p-5">
                    <EmptyState title="Aún no hay ventas" message="Cuando se concreten pedidos aparecerán aquí." icon={<IconReceipt />} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr>
                          <Th>Pedido</Th>
                          <Th>Estado</Th>
                          <Th align="right">Total</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.ultimasVentas.map((p) => (
                          <Tr key={p.id}>
                            <Td className="font-mono text-slate-600">{p.codigoSeguimiento ?? `#${p.id}`}</Td>
                            <Td>
                              <Badge tone={estadoPedidoTone(p.estadoPedido)}>{p.estadoPedido}</Badge>
                            </Td>
                            <Td align="right" className="font-mono font-medium text-slate-800">
                              {formatCurrency(p.total)}
                            </Td>
                          </Tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}

type KpiTone = 'brand' | 'info' | 'success' | 'neutral';
const kpiTones: Record<KpiTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  info: 'bg-blue-50 text-blue-600',
  success: 'bg-cta-50 text-cta-600',
  neutral: 'bg-slate-100 text-slate-500',
};

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  isMoney,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: KpiTone;
  isMoney?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', kpiTones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={cn('mt-3 font-mono font-bold text-slate-900', isMoney ? 'text-xl' : 'text-3xl')}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}

function StockPill({ title, value, tone }: { title: string; value: number; tone: 'danger' | 'warning' | 'success' }) {
  const tones = {
    danger: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    success: 'border-cta-100 bg-cta-50',
  };
  return (
    <div className={cn('flex items-center justify-between rounded-xl border px-5 py-4', tones[tone])}>
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <span className="font-mono text-2xl font-bold text-slate-900">{value}</span>
    </div>
  );
}
