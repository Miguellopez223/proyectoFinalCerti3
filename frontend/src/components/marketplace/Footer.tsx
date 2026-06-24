import { Link } from 'react-router-dom';
import { FOOTER_CLIENTES, FOOTER_VENDEDORES } from '@/lib/footerContent';

/** Footer del marketplace: marca + redes, Soporte clientes y Soporte vendedores. */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white py-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-slate-900">Klikea</p>
          <p className="mt-3 text-sm font-semibold uppercase text-slate-500">Redes sociales</p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>Facebook</span>
            <span>Instagram</span>
            <span>TikTok</span>
            <span>LinkedIn</span>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-700">Soporte para clientes</h3>
          <ul className="space-y-1">
            {FOOTER_CLIENTES.map((l) => (
              <li key={l.slug}>
                <Link to={`/tienda/info/${l.slug}`} className="text-sm text-slate-500 hover:text-slate-800">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-700">Soporte para vendedores</h3>
          <ul className="space-y-1">
            {FOOTER_VENDEDORES.map((l) => (
              <li key={l.label}>
                {l.externalUrl ? (
                  <a href={l.externalUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-cta-600 hover:underline">{l.label}</a>
                ) : (
                  <Link to={`/tienda/info/${l.slug}`} className="text-sm text-slate-500 hover:text-slate-800">{l.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 text-xs text-slate-400 sm:px-6">© {new Date().getFullYear()} Klikea</div>
    </footer>
  );
}
