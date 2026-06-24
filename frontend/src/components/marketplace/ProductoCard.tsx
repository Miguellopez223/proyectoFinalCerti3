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
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => navigate(`/tienda/producto/${producto.id}`)}
        className="relative block text-left"
      >
        {enOferta && producto.descuentoPorcentaje != null && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
            -{producto.descuentoPorcentaje}%
          </span>
        )}
        <ProductImage src={producto.imagenUrl ?? undefined} alt={producto.nombre} className="aspect-square w-full rounded-t-lg" />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {producto.tiendaNombre && <span className="text-xs text-slate-400">{producto.tiendaNombre}</span>}
        <button
          type="button"
          onClick={() => navigate(`/tienda/producto/${producto.id}`)}
          className="line-clamp-2 text-left text-sm font-medium text-slate-800 hover:underline"
        >
          {producto.nombre}
        </button>

        <div className="mt-1">
          {enOferta && (
            <span className="mr-2 text-xs text-slate-400 line-through">{formatCurrency(producto.precio)}</span>
          )}
          <span className="text-base font-bold text-slate-900">{formatCurrency(precioMostrar)}</span>
        </div>

        <button
          type="button"
          onClick={() => onAdd(producto)}
          disabled={agotado}
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {agotado ? 'Sin stock' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}
