import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import { Heart, X, RotateCcw } from 'lucide-react';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency } from '@/lib/format';
import type { Producto } from '@/types';

type Dir = 'like' | 'nope';

interface SwipeDeckProps {
  products: Producto[];
  /** Swipe RIGHT — added to "intereses". */
  onLike?: (product: Producto) => void;
  /** Swipe LEFT — descartado. */
  onDismiss?: (product: Producto) => void;
  /** Shown when the deck runs out; receives a reset() to start over. */
  renderEmpty?: (reset: () => void) => ReactNode;
}

/**
 * Tinder-style swipe deck. Featured products stack on top of one another; the top
 * card is draggable — fling it RIGHT to like (añade a tus intereses) or LEFT to
 * dismiss. Drag velocity and distance both trigger a decision, and the two buttons
 * below mirror the gesture for non-touch users. Fully fluid via framer-motion.
 */
export function SwipeDeck({ products, onLike, onDismiss, renderEmpty }: SwipeDeckProps) {
  const [index, setIndex] = useState(0);
  // Lets the buttons drive the current top card's fly-out animation.
  const decideRef = useRef<(dir: Dir) => void>(() => {});

  const remaining = products.length - index;
  const visible = products.slice(index, index + 3);

  const reset = useCallback(() => setIndex(0), []);

  const handleDecide = useCallback(
    (dir: Dir, product: Producto) => {
      if (dir === 'like') onLike?.(product);
      else onDismiss?.(product);
      setIndex((i) => i + 1);
    },
    [onLike, onDismiss],
  );

  return (
    <div className="mx-auto w-full max-w-md select-none">
      <div className="relative mx-auto h-[440px] w-full sm:h-[520px]">
        {remaining === 0
          ? (renderEmpty?.(reset) ?? <DeckEmpty reset={reset} />)
          : visible.map((p, i) => (
              <SwipeCard
                key={p.id}
                product={p}
                stackIndex={i}
                isTop={i === 0}
                visibleCount={visible.length}
                registerDecide={(fn) => {
                  if (i === 0) decideRef.current = fn;
                }}
                onDecide={(dir) => handleDecide(dir, p)}
              />
            ))}
      </div>

      {/* Controls + counter */}
      {remaining > 0 && (
        <div className="mt-7 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => decideRef.current('nope')}
            aria-label="No me interesa"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-400/50 text-red-300 transition-all duration-200 hover:scale-110 hover:border-red-400 hover:bg-red-500/10 active:scale-95"
          >
            <X className="h-6 w-6" />
          </button>
          <span className="min-w-[3ch] text-center font-mono text-xs uppercase tracking-widest text-white/40">
            {remaining} / {products.length}
          </span>
          <button
            type="button"
            onClick={() => decideRef.current('like')}
            aria-label="Me interesa"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/50 text-emerald-300 transition-all duration-200 hover:scale-110 hover:border-emerald-400 hover:bg-emerald-500/10 active:scale-95"
          >
            <Heart className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}

interface SwipeCardProps {
  product: Producto;
  stackIndex: number;
  isTop: boolean;
  visibleCount: number;
  onDecide: (dir: Dir) => void;
  registerDecide: (fn: (dir: Dir) => void) => void;
}

function SwipeCard({
  product: p,
  stackIndex,
  isTop,
  visibleCount,
  onDecide,
  registerDecide,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
  const [leaving, setLeaving] = useState(false);
  const agotado = p.stock <= 0;

  const fly = useCallback(
    (dir: Dir) => {
      if (leaving) return;
      setLeaving(true);
      animate(x, dir === 'like' ? 720 : -720, {
        duration: 0.34,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => onDecide(dir),
      });
    },
    [leaving, onDecide, x],
  );

  // Wire the top card to the external buttons.
  useEffect(() => {
    if (isTop) registerDecide(fly);
  }, [isTop, fly, registerDecide]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 700) fly('like');
    else if (info.offset.x < -110 || info.velocity.x < -700) fly('nope');
    else animate(x, 0, { type: 'spring', stiffness: 300, damping: 26 });
  }

  // Cards behind the top one are nudged down and scaled to peek out.
  const restScale = 1 - stackIndex * 0.05;
  const restY = stackIndex * 18;

  return (
    <motion.article
      style={{ x: isTop ? x : 0, rotate: isTop ? rotate : 0, zIndex: visibleCount - stackIndex }}
      animate={{ scale: restScale, y: restY }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      drag={isTop && !leaving ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className={`absolute inset-0 origin-bottom touch-none [&_img]:pointer-events-none [&_img]:select-none ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[32px] border-2 border-[#D7E2EA]/50 bg-[#0C0C0C] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]">
        <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />

        {/* Category + stock */}
        {p.categoriaNombre && (
          <span className="absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B600A8] backdrop-blur">
            {p.categoriaNombre}
          </span>
        )}
        {agotado && (
          <span className="absolute right-5 top-5 rounded-full bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold text-white">
            Agotado
          </span>
        )}

        {/* Bottom info */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6">
          <h3
            className="font-black uppercase leading-none tracking-tight text-[#D7E2EA]"
            style={{ fontSize: 'clamp(1.5rem, 6vw, 2.25rem)' }}
          >
            {p.nombre}
          </h3>
          <p className="mt-2 font-mono text-2xl font-black text-white">{formatCurrency(p.precio)}</p>
        </div>

        {/* Swipe verdict stamps (top card only) */}
        {isTop && (
          <>
            <motion.span
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-6 top-1/3 -rotate-[18deg] rounded-xl border-4 border-emerald-400 px-4 py-1.5 text-2xl font-black uppercase tracking-widest text-emerald-400"
            >
              Me interesa
            </motion.span>
            <motion.span
              style={{ opacity: nopeOpacity }}
              className="pointer-events-none absolute right-6 top-1/3 rotate-[18deg] rounded-xl border-4 border-red-400 px-4 py-1.5 text-2xl font-black uppercase tracking-widest text-red-400"
            >
              No
            </motion.span>
          </>
        )}
      </div>
    </motion.article>
  );
}

function DeckEmpty({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 rounded-[32px] border-2 border-dashed border-white/15 text-center">
      <p className="px-6 font-medium uppercase tracking-wide text-[#D7E2EA]/70">
        Viste todos los destacados
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-full border-2 border-[#D7E2EA]/70 px-6 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors hover:bg-[#D7E2EA]/10"
      >
        <RotateCcw className="h-4 w-4" /> Volver a empezar
      </button>
    </div>
  );
}
