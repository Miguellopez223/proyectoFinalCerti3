import { useEffect, useRef, useState } from 'react';
import { ProductImage } from '@/components/ProductImage';
import type { Producto } from '@/types';

/**
 * Two rows of product imagery that drift in opposite directions as the page
 * scrolls. Each row is tripled so the strip never runs out while panning.
 */
export function ProductMarquee({ products }: { products: Producto[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const sectionTop = el.getBoundingClientRect().top + window.scrollY;
      setOffset((window.scrollY - sectionTop + window.innerHeight) * 0.3);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (products.length === 0) return null;

  const mid = Math.ceil(products.length / 2);
  const rowA = products.slice(0, mid);
  const rowB = products.slice(mid).length ? products.slice(mid) : rowA;

  const triple = <T,>(arr: T[]) => [...arr, ...arr, ...arr];

  return (
    <div ref={sectionRef} className="overflow-hidden py-10">
      <div className="flex flex-col gap-3">
        <Row products={triple(rowA)} x={offset - 200} />
        <Row products={triple(rowB)} x={-(offset - 200)} />
      </div>
    </div>
  );
}

function Row({ products, x }: { products: Producto[]; x: number }) {
  return (
    <div
      className="flex gap-3"
      style={{ transform: `translateX(${x}px)`, willChange: 'transform' }}
    >
      {products.map((p, i) => (
        <div
          key={`${p.id}-${i}`}
          className="relative h-[180px] w-[280px] shrink-0 overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/8 sm:h-[230px] sm:w-[360px]"
        >
          <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-full w-full" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="truncate text-sm font-medium uppercase tracking-wide text-[#D7E2EA]">
              {p.nombre}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
