import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency } from '@/lib/format';
import type { Producto } from '@/types';

/**
 * Tarjeta de producto del marketplace (estructura mínima; el estilo lo pulirá un colaborador).
 * Muestra imagen, badge de descuento, nombre de la TIENDA, nombre, precio (con oferta) y
 * botón de agregar. Click en la tarjeta -> detalle del producto.
 */
export function ProductoCard({ producto, onAdd }: { producto: Producto; onAdd: (p: Producto) => void }) {
  const navigate = useNavigate();
  const enOferta = !!producto.enOferta;
  const precioMostrar = producto.precioEfectivo ?? producto.precio;
  const agotado = producto.stock <= 0;

  return (
    <div className="mk-card group flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => navigate(`/tienda/producto/${producto.id}`)}
        className="relative block overflow-hidden text-left"
      >
        {enOferta && producto.descuentoPorcentaje != null && (
          <span className="mk-badge-disc absolute left-2.5 top-2.5 z-10">
            -{producto.descuentoPorcentaje}%
          </span>
        )}
        {agotado && (
          <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-200 backdrop-blur">
            Agotado
          </span>
        )}
        <ProductImage
          src={producto.imagenUrl ?? undefined}
          alt={producto.nombre}
          className="aspect-square w-full bg-white/5 transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {producto.tiendaNombre && (
          <span className="truncate text-xs font-medium uppercase tracking-wide text-brand-300/80">{producto.tiendaNombre}</span>
        )}
        <button
          type="button"
          onClick={() => navigate(`/tienda/producto/${producto.id}`)}
          className="line-clamp-2 text-left text-sm font-medium text-slate-100 transition-colors hover:text-white"
        >
          {producto.nombre}
        </button>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-white">{formatCurrency(precioMostrar)}</span>
          {enOferta && (
            <span className="text-xs text-slate-500 line-through">{formatCurrency(producto.precio)}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAdd(producto)}
          disabled={agotado}
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-cta-500/60 hover:bg-cta-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/15 disabled:hover:bg-transparent"
        >
          <ShoppingCart className="h-4 w-4" />
          {agotado ? 'Sin stock' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}
