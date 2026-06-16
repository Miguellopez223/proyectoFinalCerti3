import type { ReactNode } from 'react';

/** Layout de dos columnas para login/registro: panel de marca + formulario. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Panel de marca (oculto en móvil) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #22D3EE 0, transparent 40%), radial-gradient(circle at 80% 70%, #22C55E 0, transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9 4.5 4h15L21 9M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M3 9h18" />
            </svg>
          </span>
          <span className="text-xl font-semibold tracking-tight">MultiTienda</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Tu ecommerce multi-tienda, en un solo lugar.
          </h1>
          <p className="mt-4 text-brand-100">
            Administra productos, inventario y pedidos, o compra en tu tienda favorita con pago por QR.
          </p>
        </div>
        <p className="relative text-sm text-brand-200">© {new Date().getFullYear()} MultiTienda · UPB</p>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col items-center justify-center px-5 py-10 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
