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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeDrawer} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d0d10] shadow-2xl animate-slide-in">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-bold text-white">Mi carrito <span className="text-slate-500">({itemCount})</span></h2>
          <button onClick={closeDrawer} aria-label="Cerrar" className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {carritos.length === 0 ? (
            <p className="mt-12 text-center text-sm text-slate-500">Tu carrito está vacío.</p>
          ) : (
            carritos.map((c) => (
              <div key={c.id} className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-300/80">
                  Tienda #{c.tiendaId}
                </p>
                <ul className="space-y-2">
                  {c.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{it.productoNombre}</p>
                        <p className="text-xs text-slate-400">
                          {it.cantidad} × {formatCurrency(it.precioUnitario)} = <span className="text-slate-300">{formatCurrency(it.subtotal)}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => eliminar(c.id, it.id)}
                        disabled={busyId === it.id}
                        aria-label="Eliminar"
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-sm text-slate-400">
                  Subtotal: <span className="font-semibold text-white">{formatCurrency(c.totalEstimado)}</span>
                </p>
              </div>
            ))
          )}
        </div>

        <footer className="border-t border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">Total ({itemCount} artículos)</span>
            <span className="text-xl font-black text-white">{formatCurrency(total)}</span>
          </div>
          <button
            onClick={() => ir('/tienda/checkout')}
            disabled={carritos.length === 0}
            className="mk-btn-cta mb-2 w-full"
          >
            Ir a pagar
          </button>
          <button
            onClick={() => ir('/tienda/carrito')}
            className="mk-btn-ghost w-full py-2 text-sm"
          >
            Ver mi carrito
          </button>
        </footer>
      </aside>
    </div>
  );
}
