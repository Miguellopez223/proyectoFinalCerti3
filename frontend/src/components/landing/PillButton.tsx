import { useState, type ButtonHTMLAttributes, type ReactNode, type PointerEvent } from 'react';
import { cn } from '@/lib/cn';

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/** Warm ember gradient that matches the lit background — replaces the old magenta/violet. */
export const WARM_GRADIENT =
  'linear-gradient(123deg, #1c0c03 0%, #7a3310 30%, #c4631d 60%, #e7a149 100%)';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * Signature warm gradient pill. Dynamic on every state: the gradient slides on
 * hover, the whole pill lifts and casts a warm glow, and a click spawns a ripple
 * from the press point with a quick brightness flash — a very satisfying press.
 */
export function GradientPill({ children, className, disabled, onPointerDown, ...rest }: PillProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function spawnRipple(e: PointerEvent<HTMLButtonElement>) {
    onPointerDown?.(e);
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.1;
    const ripple: Ripple = {
      id: Date.now() + Math.random(),
      x: e.clientX - rect.left - size / 2,
      y: e.clientY - rect.top - size / 2,
      size,
    };
    setRipples((r) => [...r, ripple]);
    window.setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== ripple.id)), 650);
  }

  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={spawnRipple}
      className={cn(
        'group relative isolate overflow-hidden rounded-full',
        'inline-flex cursor-pointer items-center justify-center gap-2',
        'px-8 py-3 text-xs font-medium uppercase tracking-widest text-white sm:px-10 sm:py-3.5 sm:text-sm md:px-12 md:py-4 md:text-base',
        'outline outline-2 -outline-offset-[3px] outline-white/75',
        'shadow-[0_6px_22px_-6px_rgba(196,99,29,0.55)]',
        'transition-[transform,box-shadow,filter] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-8px_rgba(231,161,73,0.6)] hover:brightness-110',
        'active:translate-y-0 active:scale-[0.96] active:brightness-95',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100',
        className,
      )}
      style={{ background: WARM_GRADIENT, backgroundSize: '180% 180%' }}
    >
      {/* sliding gradient sheen — animates the warm tones on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[length:180%_180%] bg-[position:0%_50%] transition-[background-position] duration-700 ease-out group-hover:bg-[position:100%_50%]"
        style={{ background: WARM_GRADIENT, backgroundSize: '180% 180%' }}
      />
      {/* diagonal light sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      {/* ripples from the press point */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="btn-ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/**
 * Ghost / outline pill — secondary actions on dark surfaces. Warm-tinted press
 * feedback to stay in family with the gradient pill.
 */
export function GhostPill({ children, className, ...rest }: PillProps) {
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#D7E2EA]',
        'px-8 py-3 text-sm font-medium uppercase tracking-widest text-[#D7E2EA] sm:px-10 sm:py-3.5 sm:text-base',
        'transition-[transform,background-color,border-color] duration-200 ease-out',
        'hover:border-[#e7a149] hover:bg-[#e7a149]/10 active:scale-[0.96]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    >
      {children}
    </button>
  );
}
