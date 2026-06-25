import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { Producto } from '@/types';

interface HeroProductFieldProps {
  products: Producto[];
  onSelect?: (id: number) => void;
}

/** Scattered positions across the hero — distributed left/right/top/bottom, away from the dead centre where the heading sits. */
const POSITIONS: { style: CSSProperties; size: string }[] = [
  // Columna izquierda
  { style: { top: '4%', left: '2%' }, size: 'w-24 sm:w-32 md:w-40' },
  { style: { top: '30%', left: '6%' }, size: 'w-24 sm:w-32 md:w-44' },
  { style: { top: '50%', left: '1%' }, size: 'w-16 sm:w-24 md:w-28' },
  { style: { bottom: '18%', left: '3%' }, size: 'w-20 sm:w-28 md:w-36' },
  // Columna derecha
  { style: { top: '8%', right: '3%' }, size: 'w-20 sm:w-28 md:w-36' },
  { style: { top: '28%', right: '7%' }, size: 'w-24 sm:w-32 md:w-40' },
  { style: { top: '52%', right: '2%' }, size: 'w-16 sm:w-24 md:w-28' },
  { style: { bottom: '13%', right: '4%' }, size: 'w-24 sm:w-32 md:w-44' },
  // Banda superior (sobre el título)
  { style: { top: '3%', left: '26%' }, size: 'w-16 sm:w-24 md:w-32' },
  { style: { top: '6%', left: '46%' }, size: 'w-16 sm:w-24 md:w-32' },
  { style: { top: '4%', right: '24%' }, size: 'w-16 sm:w-24 md:w-28' },
  // Banda inferior (bajo el título)
  { style: { bottom: '8%', left: '20%' }, size: 'w-20 sm:w-28 md:w-36' },
  { style: { bottom: '24%', left: '41%' }, size: 'w-16 sm:w-24 md:w-32' },
  { style: { bottom: '10%', right: '22%' }, size: 'w-20 sm:w-28 md:w-36' },
];

const FADE_MS = 1100;
const INTERVAL_MS = 2800;

/** Radio de influencia del cursor (px): más allá de esto, la imagen no reacciona. */
const RADIUS = 340;
/** Fracción de la distancia al cursor que la imagen se desplaza (atracción). */
const PULL = 0.32;

type Tile = { x: number; y: number; s: number };
const STILL: Tile = { x: 0, y: 0, s: 1 };

/**
 * Distributed magnetic product backdrop. Several small squares are scattered
 * across the hero (not clustered) and live behind the heading. One tile at a
 * time slowly cross-fades to a fresh product — never showing a duplicate of
 * what's already on screen. Each tile reacts **independently** to the cursor:
 * the closer the pointer is to a tile, the more it is pulled toward it. No
 * shared bounding box, so nothing is clipped as the tiles move.
 */
export function HeroProductField({ products, onSelect }: HeroProductFieldProps) {
  const pool = useMemo(() => products.filter((p) => p.imagenUrl), [products]);
  const slots = Math.min(POSITIONS.length, pool.length);

  const [assigned, setAssigned] = useState<number[]>([]);
  const [fading, setFading] = useState<boolean[]>([]);
  const assignedRef = useRef<number[]>([]);
  const nextRef = useRef(0);
  const slotRef = useRef(0);

  // Per-tile cursor reaction.
  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const rafRef = useRef(0);

  // (Re)initialise when the pool changes.
  useEffect(() => {
    const init = Array.from({ length: slots }, (_, i) => i % pool.length);
    assignedRef.current = init;
    setAssigned(init);
    setFading(Array(slots).fill(false));
    setTiles(Array(slots).fill(STILL));
    nextRef.current = slots % Math.max(pool.length, 1);
    slotRef.current = 0;
  }, [pool.length, slots]);

  // Rotate one tile at a time, cross-fading each to a fresh product. Prefers a
  // product not currently on screen (posible sin repetidos cuando hay más
  // productos que espacios); si el pool es chico, igual rota aunque algún
  // producto se repita — así el desvanecimiento nunca se detiene.
  useEffect(() => {
    if (slots === 0 || pool.length < 2) return;
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

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Each tile is pulled toward the cursor in proportion to how close it is.
  function handleMove(e: React.MouseEvent) {
    const mx = e.clientX;
    const my = e.clientY;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const next = tileRefs.current.map((el) => {
        if (!el) return STILL;
        const r = el.getBoundingClientRect();
        const dx = mx - (r.left + r.width / 2);
        const dy = my - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist > RADIUS) return STILL;
        const force = 1 - dist / RADIUS; // 1 = cursor encima, 0 = al borde del radio
        return { x: dx * PULL * force, y: dy * PULL * force, s: 1 + 0.14 * force };
      });
      setTiles(next);
    });
  }

  function handleLeave() {
    cancelAnimationFrame(rafRef.current);
    setTiles(Array(slots).fill(STILL));
  }

  if (slots === 0) return null;

  return (
    <div className="absolute inset-0 z-[1]" onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {assigned.map((poolIdx, i) => {
        const p = pool[poolIdx];
        if (!p) return null;
        const pos = POSITIONS[i];
        const t = tiles[i] ?? STILL;
        const Tag = onSelect ? 'button' : 'div';
        return (
          <Tag
            key={i}
            ref={(el: HTMLElement | null) => {
              tileRefs.current[i] = el;
            }}
            {...(onSelect ? { onClick: () => onSelect(p.id), 'aria-label': p.nombre } : {})}
            style={{
              ...pos.style,
              transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.s})`,
              transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            }}
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
  );
}
