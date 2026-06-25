import { Link, useParams } from 'react-router-dom';
import { INFO } from '@/lib/footerContent';

/** Página informativa genérica del footer (soporte clientes/vendedores), por slug. */
export default function InfoPage() {
  const { slug = '' } = useParams();
  const info = INFO[slug];

  if (!info) {
    return <p className="py-16 text-center text-slate-400">Contenido no encontrado.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-sm text-slate-500">Inicio / Soporte</p>
      <h1 className="mb-6 text-3xl font-black tracking-tight text-white">{info.titulo}</h1>
      <div className="mk-surface space-y-4 p-6 sm:p-8">
        {info.parrafos.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-300">{p}</p>
        ))}
      </div>
      <Link to="/tienda" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200">← Volver al inicio</Link>
    </div>
  );
}
