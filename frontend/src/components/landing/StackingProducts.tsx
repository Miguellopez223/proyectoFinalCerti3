import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingCart, ArrowUpRight, Loader2 } from 'lucide-react';
import { ProductImage } from '@/components/ProductImage';
import { GradientPill } from './PillButton';
import { formatCurrency } from '@/lib/format';
import type { Producto } from '@/types';

interface StackingProductsProps {
  products: Producto[];
  /** Cart flow — when provided, renders the gradient "Agregar al carrito" CTA. */
  addingId?: number | null;
  onAddToCart?: (id: number) => void;
  /** Top-right "Ver producto" jump — omit to hide it (e.g. public catalog). */
  onNavigate?: (id: number) => void;
  /** Replaces the default action button (e.g. a WhatsApp link on public pages). */
  renderAction?: (product: Producto) => ReactNode;
}

/**
 * Sticky-stacking product showcase. Each card pins to the top of the viewport
 * and scales down as the next one scrolls over it, so the products overlap and
 * settle into a layered stack — the storefront's signature scroll moment.
 */
export function StackingProducts({
  products,
  addingId,
  onAddToCart,
  onNavigate,
  renderAction,
}: StackingProductsProps) {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  const total = products.length;

  return (
    <div ref={container} className="relative">
      {products.map((product, i) => {
        const targetScale = 1 - (total - 1 - i) * 0.04;
        const range: [number, number] = [i / total, 1];
        return (
          <StackCard
            key={product.id}
            product={product}
            index={i}
            range={range}
            targetScale={targetScale}
            progress={scrollYProgress}
            addingId={addingId}
            onAddToCart={onAddToCart}
            onNavigate={onNavigate}
            renderAction={renderAction}
          />
        );
      })}
    </div>
  );
}

interface StackCardProps {
  product: Producto;
  index: number;
  range: [number, number];
  targetScale: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  addingId?: number | null;
  onAddToCart?: (id: number) => void;
  onNavigate?: (id: number) => void;
  renderAction?: (product: Producto) => ReactNode;
}

function StackCard({
  product: p,
  index,
  range,
  targetScale,
  progress,
  addingId,
  onAddToCart,
  onNavigate,
  renderAction,
}: StackCardProps) {
  const scale = useTransform(progress, range, [1, targetScale]);
  const agotado = p.stock <= 0;
  const num = String(index + 1).padStart(2, '0');

  return (
    <div className="sticky top-24 flex items-center justify-center md:top-28">
      <motion.article
        style={{ scale, top: `${index * 22}px` }}
        className="relative mx-auto w-full max-w-4xl origin-top overflow-hidden rounded-[26px] border-2 border-[#D7E2EA]/60 bg-[#0C0C0C] p-3.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:rounded-[32px] sm:p-5"
      >
        {/* Top row — number + name, compact */}
        <div className="mb-3.5 flex items-center justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
            <span
              className="font-black leading-none text-white/85"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 56px)' }}
            >
              {num}
            </span>
            <div className="min-w-0">
              {p.categoriaNombre && (
                <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#B600A8] sm:text-[10px]">
                  {p.categoriaNombre}
                </p>
              )}
              <h3
                className="truncate font-bold uppercase leading-tight tracking-tight text-[#D7E2EA]"
                style={{ fontSize: 'clamp(1rem, 2.6vw, 1.7rem)' }}
              >
                {p.nombre}
              </h3>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate(p.id)}
              aria-label="Ver producto"
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#D7E2EA]/70 px-4 py-2 text-[11px] font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10"
            >
              Ver <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Bottom row — image + minimal details */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(360px,1fr)_minmax(220px,300px)] lg:grid-cols-[minmax(480px,1fr)_minmax(240px,310px)]">
          <div className="aspect-square overflow-hidden rounded-[20px] bg-black/40 sm:rounded-[24px]">
            <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-full w-full" />
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[24px]">
            <div>
              {p.descripcionLarga && (
                <p className="mb-3 line-clamp-3 text-sm font-light leading-relaxed text-[#D7E2EA]/65">
                  {p.descripcionLarga}
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-2xl font-black text-white sm:text-[1.7rem]">
                  {formatCurrency(p.precio)}
                </p>
                {agotado && (
                  <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-medium text-red-300">
                    Agotado
                  </span>
                )}
              </div>
            </div>

            {renderAction ? (
              renderAction(p)
            ) : onAddToCart ? (
              <GradientPill
                onClick={() => onAddToCart(p.id)}
                disabled={agotado || addingId === p.id}
                className="w-full !px-5 !py-3 sm:!text-xs"
              >
                {addingId === p.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {agotado ? 'Sin stock' : 'Agregar'}
              </GradientPill>
            ) : null}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
