import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Magnet } from './Magnet';
import { cn } from '@/lib/cn';
import type { Producto } from '@/types';

interface HeroProductFieldProps {
  products: Producto[];
  onSelect?: (id: number) => void;
}

/** Scattered positions across the hero — distributed left/right/top/bottom, away from the dead centre where the heading sits. */
const POSITIONS: { style: CSSProperties; size: string }[] = [
  { style: { top: '5%', left: '3%' }, size: 'w-24 sm:w-32 md:w-40' },
  { style: { top: '9%', right: '4%' }, size: 'w-20 sm:w-28 md:w-36' },
  { style: { top: '33%', left: '8%' }, size: 'w-24 sm:w-32 md:w-44' },
  { style: { top: '29%', right: '9%' }, size: 'w-24 sm:w-32 md:w-40' },
  { style: { bottom: '20%', left: '4%' }, size: 'w-20 sm:w-28 md:w-36' },
  { style: { bottom: '14%', right: '5%' }, size: 'w-24 sm:w-32 md:w-44' },
  { style: { bottom: '26%', left: '40%' }, size: 'w-16 sm:w-24 md:w-32' },
  { style: { top: '6%', left: '44%' }, size: 'w-16 sm:w-24 md:w-32' },
];

const FADE_MS = 1100;
const INTERVAL_MS = 2800;

/**
 * Distributed magnetic product backdrop. Several small squares are scattered
 * across the hero (not clustered) and live behind the heading. One tile at a
 * time slowly cross-fades to a fresh product — never showing a duplicate of
 * what's already on screen. The whole field gently follows the cursor.
 */
export function HeroProductField({ products, onSelect }: HeroProductFieldProps) {
  const pool = useMemo(() => products.filter((p) => p.imagenUrl), [products]);
  const slots = Math.min(POSITIONS.length, pool.length);

  const [assigned, setAssigned] = useState<number[]>([]);
  const [fading, setFading] = useState<boolean[]>([]);
  const assignedRef = useRef<number[]>([]);
  const nextRef = useRef(0);
  const slotRef = useRef(0);

  // (Re)initialise when the pool changes.
  useEffect(() => {
    const init = Array.from({ length: slots }, (_, i) => i % pool.length);
    assignedRef.current = init;
    setAssigned(init);
    setFading(Array(slots).fill(false));
    nextRef.current = slots % Math.max(pool.length, 1);
    slotRef.current = 0;
  }, [pool.length, slots]);

  // Rotate one tile at a time — only possible without repeats when there are
  // more products than visible slots.
  useEffect(() => {
    if (slots === 0 || pool.length <= slots) return;
    let cancelled = false;
    let fadeTimer = 0;

    const tick = window.setInterval(() => {
      if (cancelled) return;
      const slot = slotRef.current;
      slotRef.current = (slot + 1) % slots;

      setFading((f) => {
        const n = [...f];
        n[slot] = true;
        return n;
      });

      fadeTimer = window.setTimeout(() => {
        if (cancelled) return;
        // Pick the next product that isn't currently shown in any other tile.
        const shown = new Set(assignedRef.current);
        shown.delete(assignedRef.current[slot]);
        let cand = nextRef.current;
        let guard = 0;
        while (shown.has(cand) && guard < pool.length) {
          cand = (cand + 1) % pool.length;
          guard++;
        }
        nextRef.current = (cand + 1) % pool.length;

        const next = [...assignedRef.current];
        next[slot] = cand;
        assignedRef.current = next;
        setAssigned(next);
        setFading((f) => {
          const n = [...f];
          n[slot] = false;
          return n;
        });
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(fadeTimer);
    };
  }, [pool.length, slots]);

  if (slots === 0) return null;

  return (
    <Magnet padding={220} strength={7} className="absolute inset-0 z-[1]">
      <div className="absolute inset-0">
        {assigned.map((poolIdx, i) => {
          const p = pool[poolIdx];
          if (!p) return null;
          const pos = POSITIONS[i];
          const Tag = onSelect ? 'button' : 'div';
          return (
            <Tag
              key={i}
              {...(onSelect ? { onClick: () => onSelect(p.id), 'aria-label': p.nombre } : {})}
              style={pos.style}
              className={cn(
                'absolute aspect-square overflow-hidden rounded-[20px] border border-[#D7E2EA]/15 bg-black/40 shadow-[0_24px_70px_-30px_rgba(190,96,30,0.55)] sm:rounded-[26px]',
                pos.size,
                onSelect && 'cursor-pointer',
              )}
            >
              <img
                src={p.imagenUrl!}
                alt={p.nombre}
                className={cn(
                  'h-full w-full object-cover transition-[opacity,transform] ease-in-out',
                  fading[i] ? 'scale-[1.04] opacity-0' : 'scale-100 opacity-90',
                )}
                style={{ transitionDuration: `${FADE_MS}ms` }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </Tag>
          );
        })}
      </div>
    </Magnet>
  );
}
