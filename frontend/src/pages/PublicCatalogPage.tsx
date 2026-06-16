import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogoApi } from '@/api/catalogo';
import { useAsync } from '@/hooks/useAsync';
import { DataState } from '@/components/ui/DataState';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency } from '@/lib/format';
import { IconSearch, IconStore, IconWhatsapp } from '@/components/icons';

/** Catálogo público por slug (sin login). Solo lectura + botones de WhatsApp. */
export default function PublicCatalogPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => catalogoApi.porSlug(slug), [slug]);
  const [query, setQuery] = useState('');

  const productos = useMemo(() => {
    const list = data?.productos ?? [];
    const q = query.trim().toLowerCase();
    return q ? list.filter((p) => p.nombre.toLowerCase().includes(q)) : list;
  }, [data, query]);

  const waLink = (numero: string) =>
    `https://wa.me/${numero.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      `Hola, vi el catálogo de ${data?.tienda.nombre ?? ''} y quiero hacer un pedido.`,
    )}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {data?.tienda.logoUrl ? (
              <ProductImage src={data.tienda.logoUrl} alt={data.tienda.nombre} className="h-11 w-11 rounded-xl" />
            ) : (
              <IconStore />
            )}
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{data?.tienda.nombre ?? 'Catálogo'}</h1>
            <p className="text-sm text-slate-500">Catálogo público</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {data?.contactosWhatsapp && data.contactosWhatsapp.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-cta-100 bg-cta-50/60 px-4 py-3">
            <span className="text-sm font-medium text-slate-700">Haz tu pedido por WhatsApp:</span>
            {data.contactosWhatsapp.map((num) => (
              <a
                key={num}
                href={waLink(num)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-cta-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cta-600"
              >
                <IconWhatsapp className="h-4 w-4" /> {num}
              </a>
            ))}
          </div>
        )}

        <div className="mb-6 max-w-sm">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Buscar producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar producto"
            />
          </div>
        </div>

        <DataState
          loading={loading}
          error={error}
          isEmpty={productos.length === 0}
          onRetry={reload}
          loadingFallback={<SkeletonCards count={8} />}
          emptyFallback={<EmptyState title="Sin productos" message="Esta tienda aún no publicó productos." />}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => (
              <article key={p.id} className="card-base flex flex-col overflow-hidden">
                <ProductImage src={p.imagenUrl} alt={p.nombre} className="aspect-square w-full" />
                <div className="flex flex-1 flex-col p-4">
                  {p.categoriaNombre && (
                    <Badge tone="brand" className="mb-2 self-start">
                      {p.categoriaNombre}
                    </Badge>
                  )}
                  <h3 className="line-clamp-2 text-sm font-medium text-slate-900">{p.nombre}</h3>
                  <p className="mt-2 font-mono text-lg font-semibold text-slate-900">{formatCurrency(p.precio)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </DataState>
      </main>
    </div>
  );
}
