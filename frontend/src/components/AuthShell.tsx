import type { ReactNode } from 'react';
import { FadeIn } from '@/components/landing/FadeIn';
import { ThemeToggle } from '@/components/ThemeToggle';
import { IconStore } from '@/components/icons';

const BRAND = 'Klikea';

/**
 * Layout de auth (login/registro) con la estética del storefront KLIKEA: lienzo
 * negro con luz cálida en movimiento (`tienda-bg`), panel de marca con el título
 * KLIKEA y el formulario en una tarjeta de vidrio. El panel de marca se oculta
 * en móvil. (Sin el campo de productos: ese efecto vive solo en la home.)
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="tienda-bg flex min-h-screen text-slate-100">
      {/* Toggle modo oscuro / claro */}
      <ThemeToggle className="absolute right-4 top-4 z-20" />

      {/* Panel de marca (oculto en móvil) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <FadeIn y={20} className="relative z-10 flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-[#c4631d]/40"
            style={{ background: 'linear-gradient(123deg, #7a3310 0%, #c4631d 55%, #e7a149 100%)' }}
          >
            <IconStore className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold uppercase tracking-wide text-[#D7E2EA]">{BRAND}</span>
        </FadeIn>

        <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 max-w-md">
          <h1
            className="hero-heading font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
          >
            {BRAND}
          </h1>
          <p className="mt-5 text-[clamp(0.9rem,1.4vw,1.15rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA]/90">
            Una experiencia de compra hecha para sorprender y deleitar
          </p>
        </FadeIn>

        <FadeIn delay={0.3} className="relative z-10 text-sm text-white/40">
          © {new Date().getFullYear()} {BRAND}
        </FadeIn>
      </div>

      {/* Formulario */}
      <div className="relative flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        {/* Wordmark visible solo en móvil (el panel de marca está oculto) */}
        <div className="mb-7 flex items-center gap-2.5 lg:hidden">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-[#c4631d]/40"
            style={{ background: 'linear-gradient(123deg, #7a3310 0%, #c4631d 55%, #e7a149 100%)' }}
          >
            <IconStore className="h-5 w-5" />
          </span>
          <span className="hero-heading text-xl font-black uppercase tracking-wide">{BRAND}</span>
        </div>

        <FadeIn y={24} duration={0.6} className="w-full max-w-md">
          <div className="mk-surface p-7 sm:p-9">{children}</div>
        </FadeIn>
      </div>
    </div>
  );
}
