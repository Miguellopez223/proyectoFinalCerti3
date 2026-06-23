import { ShoppingCart, Loader2 } from 'lucide-react';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency } from '@/lib/format';
import { FadeIn } from './FadeIn';
import type { Producto } from '@/types';

interface ProductCardProps {
  product: Producto;
  index: number;
  addingId: number | null;
  onAddToCart: (id: number) => void;
  onNavigate: (id: number) => void;
}

/** Grid product card with a hover-revealed action layer. */
export function ProductCard({
  product: p,
  index,
  addingId,
  onAddToCart,
  onNavigate,
}: ProductCardProps) {
  const agotado = p.stock <= 0;

  return (
    <FadeIn delay={(index % 4) * 0.08} y={36} className="h-full">
      <article
        onClick={() => onNavigate(p.id)}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] transition-colors duration-300 hover:border-[#D7E2EA]/40"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
          <ProductImage
            src={p.imagenUrl}
            alt={p.nombre}
            className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {agotado && (
            <span className="absolute right-3 top-3 rounded-full bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold text-white">
              Agotado
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {p.categoriaNombre && (
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B600A8]">
              {p.categoriaNombre}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-medium uppercase tracking-wide text-[#D7E2EA]">
            {p.nombre}
          </h3>
          <p className="mt-2 font-mono text-lg font-black text-white">
            {formatCurrency(p.precio)}
          </p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(p.id);
            }}
            disabled={agotado || addingId === p.id}
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 py-2.5 text-xs font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:border-[#D7E2EA]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingId === p.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5" />
            )}
            {agotado ? 'Sin stock' : 'Agregar'}
          </button>
        </div>
      </article>
    </FadeIn>
  );
}
