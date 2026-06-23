import { useRef, useState, type ReactNode } from 'react';

interface MagnetProps {
  children: ReactNode;
  /** Distance from the element edge (px) at which the magnet activates. */
  padding?: number;
  /** Higher = weaker pull (divisor applied to the offset). */
  strength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  className?: string;
}

/**
 * Mouse-following magnetic hover. Tracks the cursor relative to the element
 * centre and translates the wrapped content toward it while the pointer is
 * within `padding` of the edge.
 */
export function Magnet({
  children,
  padding = 150,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  className,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function handleMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const within =
      Math.abs(dx) < rect.width / 2 + padding &&
      Math.abs(dy) < rect.height / 2 + padding;

    if (within) {
      setActive(true);
      setOffset({ x: dx / strength, y: dy / strength });
    } else {
      setActive(false);
      setOffset({ x: 0, y: 0 });
    }
  }

  function reset() {
    setActive(false);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: active ? activeTransition : inactiveTransition,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
