import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { catalogoApi } from '@/api/catalogo';
import { productosApi } from '@/api/productos';
import { atributosApi } from '@/api/atributos';
import { carritoApi } from '@/api/carrito';
import { tiendasApi } from '@/api/tiendas';
import { useAsync } from '@/hooks/useAsync';
import { DataState } from '@/components/ui/DataState';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { IconArrowLeft, IconCart, IconPlus, IconMinus, IconBox } from '@/components/icons';

export default function ProductoDetallePage() {
  const { productoId = '' } = useParams();
  const id = Number(productoId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useCart();

  const tiendasState = useAsync(() => tiendasApi.listar(), []);
  const tiendaPublica = tiendasState.data?.[0] ?? null;
  const tiendaId = user?.tiendaId ?? tiendaPublica?.id;
  const tiendaSlug = tiendaPublica?.slug;
  const catalogoState = useAsync(
    () => (user || !tiendaSlug ? Promise.resolve(null) : catalogoApi.porSlug(tiendaSlug)),
    [user?.userId, tiendaSlug],
  );
  const productoState = useAsync(
    () => (user && tiendaId ? productosApi.obtener(tiendaId, id) : Promise.resolve(null)),
    [user?.userId, tiendaId, id],
  );
  const atributosState = useAsync(
    () => (user ? atributosApi.listarPorProducto(id) : Promise.resolve([])),
    [user?.userId, id],
  );

  const [cantidad, setCantidad] = useState(1);
  const [adding, setAdding] = useState(false);

  const producto = user
    ? productoState.data
    : catalogoState.data?.productos.find((p) => p.id === id) ?? null;
  const loading = tiendasState.loading || catalogoState.loading || Boolean(user && productoState.loading);
  const error = tiendasState.error || catalogoState.error || productoState.error;
  const agotado = (producto?.stock ?? 0) <= 0;
  const max = producto?.stock ?? 1;

  async function addToCart() {
    if (!producto) return;
    if (!user || !tiendaId) {
      navigate('/login', { state: { from: `/tienda/producto/${producto.id}`, tiendaId } });
      return;
    }
    setAdding(true);
    try {
      await carritoApi.agregarItem({ tiendaId, usuarioId: user.userId, productoId: producto.id, cantidad });
      await refresh();
      toast.success('Agregado al carrito.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="pt-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/tienda')}
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-brand-300"
      >
        <IconArrowLeft className="h-4 w-4" /> Volver al catálogo
      </button>

      {/* Glass panel */}
      <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8">
        <DataState
          loading={loading}
          error={error}
          onRetry={() => {
            tiendasState.reload();
            catalogoState.reload();
            productoState.reload();
          }}
          loadingFallback={
            <div className="grid gap-8 lg:grid-cols-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          }
        >
          {producto && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Image */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <ProductImage src={producto.imagenUrl} alt={producto.nombre} className="aspect-square w-full" />
              </div>

              {/* Info */}
              <div>
                {producto.categoriaNombre && <Badge tone="brand">{producto.categoriaNombre}</Badge>}
                <h1 className="mt-3 text-2xl font-bold text-slate-900">{producto.nombre}</h1>
                <p className="mt-3 font-mono text-3xl font-bold text-slate-900">{formatCurrency(producto.precio)}</p>
                <p className="mt-1 text-sm">
                  {agotado ? (
                    <span className="font-medium text-red-600">Sin stock disponible</span>
                  ) : (
                    <span className="text-slate-500">
                      {producto.stock} disponibles
                      {producto.unidadMedidaNombre ? ` · ${producto.unidadMedidaNombre}` : ''}
                    </span>
                  )}
                </p>

                {producto.descripcionLarga && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {producto.descripcionLarga}
                  </p>
                )}

                {/* Atributos */}
                {(atributosState.data?.length ?? 0) > 0 && (
                  <div className="mt-5">
                    <h2 className="mb-2 text-sm font-semibold text-slate-700">Características</h2>
                    <dl className="grid grid-cols-2 gap-2">
                      {atributosState.data?.map((a) => (
                        <div key={a.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <dt className="text-xs text-slate-400">{a.nombre}</dt>
                          <dd className="text-sm font-medium text-slate-700">{a.valor}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* Cantidad + Agregar */}
                {!agotado && (
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                      <button
                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        className="cursor-pointer rounded-l-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        disabled={cantidad <= 1}
                        aria-label="Disminuir"
                      >
                        <IconMinus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-mono text-sm font-semibold text-slate-900">{cantidad}</span>
                      <button
                        onClick={() => setCantidad((c) => Math.min(max, c + 1))}
                        className="cursor-pointer rounded-r-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
                        disabled={cantidad >= max}
                        aria-label="Aumentar"
                      >
                        <IconPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <Button
                      variant="cta"
                      size="lg"
                      className="flex-1"
                      loading={adding}
                      leftIcon={<IconCart className="h-5 w-5" />}
                      onClick={addToCart}
                    >
                      Agregar al carrito
                    </Button>
                  </div>
                )}

                {agotado && (
                  <div className="mt-6">
                    <EmptyState
                      title="Producto agotado"
                      message="Vuelve más tarde o explora otros productos."
                      icon={<IconBox />}
                      action={
                        <Link to="/tienda">
                          <Button variant="secondary">Ver catálogo</Button>
                        </Link>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}
