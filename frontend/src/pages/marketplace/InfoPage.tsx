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
    <div className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">{info.titulo}</h1>
      <div className="space-y-3">
        {info.parrafos.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-slate-600">{p}</p>
        ))}
      </div>
      <Link to="/tienda" className="mt-6 inline-block text-sm text-cta-600 hover:underline">← Volver al inicio</Link>
    </div>
  );
}
