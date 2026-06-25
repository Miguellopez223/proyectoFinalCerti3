import { Link } from 'react-router-dom';
import { FOOTER_CLIENTES, FOOTER_VENDEDORES } from '@/lib/footerContent';

/** Footer del marketplace: marca + redes, Soporte clientes y Soporte vendedores. */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0a0a0a]/60 py-12 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <p className="hero-heading text-2xl font-black tracking-tight">Klikea</p>
          <p className="mt-4 max-w-xs text-sm text-slate-400">El marketplace multitienda: productos de todas las tiendas, en un solo lugar.</p>
          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Redes sociales</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Facebook', 'Instagram', 'TikTok', 'LinkedIn'].map((r) => (
              <span key={r} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">{r}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Soporte para clientes</h3>
          <ul className="space-y-2">
            {FOOTER_CLIENTES.map((l) => (
              <li key={l.slug}>
                <Link to={`/tienda/info/${l.slug}`} className="text-sm text-slate-400 transition-colors hover:text-white">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Soporte para vendedores</h3>
          <ul className="space-y-2">
            {FOOTER_VENDEDORES.map((l) => (
              <li key={l.label}>
                {l.externalUrl ? (
                  <a href={l.externalUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-cta-400 transition-colors hover:text-cta-300">{l.label}</a>
                ) : (
                  <Link to={`/tienda/info/${l.slug}`} className="text-sm text-slate-400 transition-colors hover:text-white">{l.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/5 px-4 pt-6 text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} Klikea — Marketplace multitienda</div>
    </footer>
  );
}
