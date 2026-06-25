import type { ReactNode } from 'react';
import { FadeIn } from '@/components/landing/FadeIn';
import { ThemeToggle } from '@/components/ThemeToggle';

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
        <FadeIn y={20} className="relative z-10">
          <img src="/logo-klikea.png" alt={BRAND} className="h-24 w-auto object-contain" />
        </FadeIn>

        <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 max-w-md">
          <img src="/logo-klikea.png" alt={BRAND} className="w-full max-w-md object-contain" />
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
        <img src="/logo-klikea.png" alt={BRAND} className="mb-7 h-24 w-auto object-contain lg:hidden" />

        <FadeIn y={24} duration={0.6} className="w-full max-w-md">
          <div className="mk-surface p-7 sm:p-9">{children}</div>
        </FadeIn>
      </div>
    </div>
  );
}
