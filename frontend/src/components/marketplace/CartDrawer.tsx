import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2 } from 'lucide-react';
import { carritoApi } from '@/api/carrito';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';

/** Drawer lateral del carrito (multi-tienda). Estructura mínima; el estilo lo pulirá otro. */
export function CartDrawer() {
  const { carritos, drawerOpen, closeDrawer, itemCount, refresh } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (!drawerOpen) return null;

  const total = carritos.reduce((s, c) => s + (c.totalEstimado ?? 0), 0);

  async function eliminar(carritoId: number, detalleId: number) {
    setBusyId(detalleId);
    try {
      await carritoApi.eliminarItem(carritoId, detalleId);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function ir(ruta: string) {
    closeDrawer();
    navigate(ruta);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Mi carrito ({itemCount})</h2>
          <button onClick={closeDrawer} aria-label="Cerrar"><X className="h-5 w-5 text-slate-500" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {carritos.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-500">Tu carrito está vacío.</p>
          ) : (
            carritos.map((c) => (
              <div key={c.id} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tienda #{c.tiendaId}
                </p>
                <ul className="space-y-2">
                  {c.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-800">{it.productoNombre}</p>
                        <p className="text-xs text-slate-500">
                          {it.cantidad} × {formatCurrency(it.precioUnitario)} = {formatCurrency(it.subtotal)}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminar(c.id, it.id)}
                        disabled={busyId === it.id}
                        aria-label="Eliminar"
                        className="shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-right text-sm text-slate-600">
                  Subtotal: <span className="font-semibold">{formatCurrency(c.totalEstimado)}</span>
                </p>
              </div>
            ))
          )}
        </div>

        <footer className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total ({itemCount} artículos)</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => ir('/tienda/checkout')}
            disabled={carritos.length === 0}
            className="mb-2 w-full rounded-md bg-cta-600 px-4 py-2.5 font-semibold text-white hover:bg-cta-500 disabled:opacity-50"
          >
            Ir a pagar
          </button>
          <button
            onClick={() => ir('/tienda/carrito')}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver mi carrito
          </button>
        </footer>
      </aside>
    </div>
  );
}
