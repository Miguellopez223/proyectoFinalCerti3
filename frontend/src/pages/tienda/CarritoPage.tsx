import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { carritoApi } from '@/api/carrito';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { IconCart, IconTrash, IconArrowLeft } from '@/components/icons';

export default function CarritoPage() {
  const { cart, loading, refresh, setCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [busyItem, setBusyItem] = useState<number | null>(null);
  const [emptying, setEmptying] = useState(false);

  async function removeItem(detalleId: number) {
    if (!cart) return;
    setBusyItem(detalleId);
    try {
      const updated = await carritoApi.eliminarItem(cart.id, detalleId);
      setCart(updated);
      toast.success('Artículo eliminado.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyItem(null);
    }
  }

  function vaciar() {
    if (!cart) return;
    confirm(
      { title: 'Vaciar carrito', message: '¿Eliminar todos los artículos del carrito?', confirmLabel: 'Vaciar' },
      async () => {
        setEmptying(true);
        try {
          const updated = await carritoApi.vaciar(cart.id);
          setCart(updated);
          toast.success('Carrito vaciado.');
        } finally {
          setEmptying(false);
        }
      },
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Cargando carrito…" />
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div>
      <button
        onClick={() => navigate('/tienda')}
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-brand-600"
      >
        <IconArrowLeft className="h-4 w-4" /> Seguir comprando
      </button>

      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Tu carrito</h1>

      {items.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          message="Agrega productos desde el catálogo para empezar."
          icon={<IconCart />}
          action={
            <Link to="/tienda">
              <Button>Ir al catálogo</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de items */}
          <div className="lg:col-span-2">
            <Card className="divide-y divide-slate-100">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{it.productoNombre}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {it.cantidad} × {formatCurrency(it.precioUnitario)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(it.subtotal)}</span>
                  <button
                    onClick={() => removeItem(it.id)}
                    disabled={busyItem === it.id}
                    aria-label={`Eliminar ${it.productoNombre}`}
                    className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    {busyItem === it.id ? <Spinner className="h-4 w-4" /> : <IconTrash className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </Card>
            <div className="mt-3">
              <Button variant="ghost" size="sm" onClick={vaciar} loading={emptying} leftIcon={<IconTrash className="h-4 w-4" />}>
                Vaciar carrito
              </Button>
            </div>
          </div>

          {/* Resumen */}
          <div>
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">Resumen</h2>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>Artículos</span>
                <span className="font-mono">{items.reduce((s, i) => s + i.cantidad, 0)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-medium text-slate-700">Total estimado</span>
                <span className="font-mono text-xl font-bold text-slate-900">{formatCurrency(cart?.totalEstimado)}</span>
              </div>
              <Button className="mt-5 w-full" size="lg" variant="cta" onClick={() => navigate('/tienda/checkout')}>
                Finalizar compra
              </Button>
              <button onClick={() => refresh()} className="mt-3 w-full cursor-pointer text-center text-xs text-slate-400 hover:text-slate-600">
                Actualizar carrito
              </button>
            </Card>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
