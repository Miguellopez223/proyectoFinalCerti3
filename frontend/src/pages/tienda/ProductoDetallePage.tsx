import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ShieldCheck, RotateCcw, Store, Truck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { marketplaceApi } from '@/api/marketplace';
import { carritoApi } from '@/api/carrito';
import { atributosApi } from '@/api/atributos';
import { useAsync } from '@/hooks/useAsync';
import { useAddToCart } from '@/hooks/useAddToCart';
import { ProductoCard } from '@/components/marketplace/ProductoCard';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import type { AtributoProducto, Producto } from '@/types';

const FEATURES = [
  { icon: ShieldCheck, label: 'Pago seguro' },
  { icon: RotateCcw, label: 'Aplica política de devolución' },
  { icon: Store, label: 'Recojo en tienda' },
  { icon: Truck, label: 'Envío a domicilio' },
];

export default function ProductoDetallePage() {
  const { productoId = '' } = useParams();
  const id = Number(productoId);
  const { user } = useAuth();
  const { refresh } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const addToCart = useAddToCart();

  const { data: producto, loading, error } = useAsync<Producto | null>(
    () => (id ? marketplaceApi.obtenerProducto(id) : Promise.resolve(null)),
    [id],
  );
  const { data: recomendados } = useAsync<Producto[]>(
    () => (id ? marketplaceApi.recomendados(id, 5) : Promise.resolve([])),
    [id],
  );
  // Atributos solo si hay sesión (endpoint protegido; evita 401 -> redirect a login).
  const { data: atributos } = useAsync<AtributoProducto[]>(
    () => (user && id ? atributosApi.listarPorProducto(id) : Promise.resolve([])),
    [user?.userId, id],
  );

  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);

  if (loading) return <p className="py-16 text-center text-slate-400">Cargando…</p>;
  if (error || !producto) return <p className="py-16 text-center text-red-500">{error ?? 'Producto no encontrado.'}</p>;

  const enOferta = !!producto.enOferta;
  const precioMostrar = producto.precioEfectivo ?? producto.precio;
  const agotado = producto.stock <= 0;
  const max = producto.stock || 1;

  async function comprarAhora() {
    if (!producto) return;
    if (!user || user.rol !== 'CLIENTE') {
      navigate('/login', { state: { from: `/tienda/producto/${producto.id}` } });
      return;
    }
    setComprando(true);
    try {
      await carritoApi.agregarItem({ tiendaId: producto.tiendaId, usuarioId: user.userId, productoId: producto.id, cantidad });
      await refresh();
      navigate('/tienda/checkout');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setComprando(false);
    }
  }

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-slate-400 transition-colors hover:text-white">← Volver</button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr_320px]">
        {/* Imagen (una sola) */}
        <div className="mk-surface h-fit p-3">
          <ProductImage src={producto.imagenUrl ?? undefined} alt={producto.nombre} className="aspect-square w-full rounded-xl bg-white/5" />
        </div>

        {/* Info central */}
        <div>
          {producto.tiendaSlug ? (
            <Link to={`/tienda/comercio/${producto.tiendaSlug}`} className="text-sm font-medium uppercase tracking-wide text-brand-300 transition-colors hover:text-brand-200">
              {producto.tiendaNombre}
            </Link>
          ) : (
            <span className="text-sm font-medium uppercase tracking-wide text-brand-300">{producto.tiendaNombre}</span>
          )}
          <h1 className="mt-1.5 text-3xl font-black tracking-tight text-white">{producto.nombre}</h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-black text-white">{formatCurrency(precioMostrar)}</span>
            {enOferta && <span className="text-base text-slate-500 line-through">{formatCurrency(producto.precio)}</span>}
            {enOferta && producto.descuentoPorcentaje != null && (
              <span className="mk-badge-disc text-sm">-{producto.descuentoPorcentaje}%</span>
            )}
          </div>
          <p className="mt-1.5 text-sm">
            {agotado ? <span className="font-semibold text-rose-400">Sin stock</span> : <span className="text-slate-400">{producto.stock} disponibles</span>}
          </p>

          <ul className="mt-5 grid grid-cols-2 gap-2.5">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-slate-300">
                <Icon className="h-4 w-4 text-brand-300" /> {label}
              </li>
            ))}
          </ul>

          {producto.descripcionLarga && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Detalles del producto</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{producto.descripcionLarga}</p>
            </div>
          )}

          {(atributos?.length ?? 0) > 0 && (
            <dl className="mt-5 grid grid-cols-2 gap-2.5">
              {atributos?.map((a) => (
                <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <dt className="text-xs text-slate-500">{a.nombre}</dt>
                  <dd className="text-sm text-slate-200">{a.valor}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Panel de compra */}
        <div className="mk-surface h-fit p-5">
          <p className="text-3xl font-black text-white">{formatCurrency(precioMostrar)}</p>

          {!agotado && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center rounded-full border border-white/15 bg-white/5">
                <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} className="rounded-l-full p-2.5 text-slate-300 transition-colors hover:text-white" aria-label="Menos"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center text-sm font-bold text-white">{cantidad}</span>
                <button onClick={() => setCantidad((c) => Math.min(max, c + 1))} className="rounded-r-full p-2.5 text-slate-300 transition-colors hover:text-white" aria-label="Más"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          <button
            onClick={() => addToCart(producto, cantidad)}
            disabled={agotado}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-cta-500/50 px-4 py-2.5 font-semibold text-cta-300 transition-colors hover:bg-cta-500/10 hover:text-cta-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="h-5 w-5" /> Agregar al carrito
          </button>
          <button
            onClick={comprarAhora}
            disabled={agotado || comprando}
            className="mk-btn-cta mt-2 w-full"
          >
            {comprando ? 'Procesando…' : `Comprar ahora ${formatCurrency(precioMostrar)}`}
          </button>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-1 text-sm font-semibold text-white">Medios de pago</p>
            <p className="text-xs text-slate-400">QR (Stereum) · VISA · Mastercard</p>
          </div>
        </div>
      </div>

      {/* La combinación perfecta */}
      {(recomendados?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="mk-section-title mb-4">La combinación perfecta</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {recomendados?.map((p) => (
              <ProductoCard key={p.id} producto={p} onAdd={addToCart} />
            ))}
          </div>
        </section>
      )}

      {/* Value props */}
      <section className="mt-12 grid grid-cols-2 gap-4 border-t border-white/10 pt-8 text-sm text-slate-300 sm:grid-cols-4">
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-300" /> Entrega segura</span>
        <span className="flex items-center gap-2"><Store className="h-4 w-4 text-brand-300" /> Recogida en tienda</span>
        <span className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-brand-300" /> Garantía de precios</span>
        <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-300" /> Lo último en tecnología</span>
      </section>

      <div className="mt-6">
        <Link to="/tienda" className="text-sm text-slate-400 transition-colors hover:text-white">← Seguir comprando</Link>
      </div>
    </div>
  );
}
