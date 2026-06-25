import type { ReactNode } from 'react';
import { FadeIn } from '@/components/landing/FadeIn';
import { ThemeToggle } from '@/components/ThemeToggle';
import { KlikeaLogo } from '@/components/KlikeaLogo';

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

      {/* Panel de marca (oculto en móvil) — logo centrado */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden p-12 text-center lg:flex">
        <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 w-full max-w-md">
          <KlikeaLogo className="mx-auto w-full max-w-md" />
          <p
            className="mt-3 text-center font-light uppercase text-[#e7a149]"
            style={{ letterSpacing: '0.5em', fontSize: 'clamp(0.7rem, 1vw, 1rem)' }}
          >
            Todo a un click
          </p>
          <p className="mt-6 text-center text-[clamp(0.9rem,1.4vw,1.15rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA]/90">
            Una experiencia de compra hecha para sorprender y deleitar
          </p>
        </FadeIn>

        <FadeIn delay={0.3} className="absolute bottom-12 left-12 z-10 text-sm text-white/40">
          © {new Date().getFullYear()} {BRAND}
        </FadeIn>
      </div>

      {/* Formulario */}
      <div className="relative flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        {/* Wordmark visible solo en móvil (el panel de marca está oculto) */}
        <KlikeaLogo className="mb-7 w-full max-w-[240px] lg:hidden" />

        <FadeIn y={24} duration={0.6} className="w-full max-w-md">
          <div className="mk-surface p-7 sm:p-9">{children}</div>
        </FadeIn>
      </div>
    </div>
  );
}
