import { useEffect, useState } from 'react';
import { pagosApi } from '@/api/pagos';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/format';
import type { Pago, Pedido } from '@/types';

/** Tabla de ítems del pedido + sus pagos. Reutilizado por admin y cliente. */
export function PedidoItems({ pedido }: { pedido: Pedido }) {
  const [pagos, setPagos] = useState<Pago[] | null>(null);
  const [loadingPagos, setLoadingPagos] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingPagos(true);
    pagosApi
      .listarPorPedido(pedido.id)
      .then((p) => active && setPagos(p))
      .catch(() => active && setPagos([]))
      .finally(() => active && setLoadingPagos(false));
    return () => {
      active = false;
    };
  }, [pedido.id]);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Productos</h4>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                <th className="px-3 py-2 text-right font-semibold">P. unit.</th>
                <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.items?.map((it) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{it.productoNombre}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">{it.cantidad}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">{formatCurrency(it.precioUnitario)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium text-slate-800">{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-3 py-2 font-semibold text-slate-700" colSpan={3}>
                  Total
                </td>
                <td className="px-3 py-2 text-right font-mono text-base font-bold text-slate-900">
                  {formatCurrency(pedido.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Pagos</h4>
        {loadingPagos ? (
          <Spinner label="Cargando pagos…" />
        ) : !pagos || pagos.length === 0 ? (
          <p className="text-sm text-slate-500">Sin pagos registrados.</p>
        ) : (
          <ul className="space-y-2">
            {pagos.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{p.metodo}</span>
                  {p.transaccionPasarelaId && (
                    <span className="ml-2 font-mono text-xs text-slate-400">{p.transaccionPasarelaId}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(p.monto)}</span>
                  <Badge tone={p.estadoPago === 'APROBADO' || p.estadoPago === 'PAGADO' ? 'success' : 'warning'}>
                    {p.estadoPago}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
