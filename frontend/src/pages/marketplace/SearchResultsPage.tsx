import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { marketplaceApi, type OrdenBusqueda } from '@/api/marketplace';
import { useAsync } from '@/hooks/useAsync';
import { useAddToCart } from '@/hooks/useAddToCart';
import { ProductoCard } from '@/components/marketplace/ProductoCard';
import type { BusquedaResponse } from '@/types';

const ORDENES: { value: OrdenBusqueda; label: string }[] = [
  { value: 'relevante', label: 'Más relevante' },
  { value: 'reciente', label: 'Más reciente' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'descuento', label: 'Mayor descuento' },
];

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const addToCart = useAddToCart();

  const [orden, setOrden] = useState<OrdenBusqueda>('relevante');
  const [tiendaId, setTiendaId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  // Al cambiar el término de búsqueda, reinicia filtro de tienda y página.
  useEffect(() => {
    setTiendaId(null);
    setPage(0);
  }, [q]);

  const { data, loading, error } = useAsync<BusquedaResponse>(
    () => marketplaceApi.buscar({ q, tiendaId, orden, page, size: 20 }),
    [q, tiendaId, orden, page],
  );

  return (
    <div>
      <p className="mb-1 text-sm text-slate-400">Inicio / Búsqueda: {q}</p>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">
        Resultados para "{q}" {data ? <span className="text-slate-400">· {data.total} productos</span> : null}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar: filtro por comercio */}
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Comercio</span>
            {tiendaId != null && (
              <button onClick={() => { setTiendaId(null); setPage(0); }} className="text-xs text-slate-400 hover:text-slate-700">
                Reiniciar
              </button>
            )}
          </div>
          <ul className="space-y-1">
            {(data?.facetasTiendas ?? []).map((f) => (
              <li key={f.tiendaId}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="comercio"
                    checked={tiendaId === f.tiendaId}
                    onChange={() => { setTiendaId(f.tiendaId); setPage(0); }}
                  />
                  {f.nombre} <span className="text-slate-400">({f.cantidad})</span>
                </label>
              </li>
            ))}
            {(data?.facetasTiendas?.length ?? 0) === 0 && <li className="text-sm text-slate-400">Sin comercios</li>}
          </ul>
        </aside>

        {/* Grid + orden */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">{data ? `Mostrando ${data.productos.length} de ${data.total}` : ''}</span>
            <label className="text-sm text-slate-600">
              Ordenar por:{' '}
              <select
                value={orden}
                onChange={(e) => { setOrden(e.target.value as OrdenBusqueda); setPage(0); }}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              >
                {ORDENES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading && <p className="py-16 text-center text-slate-400">Cargando…</p>}
          {error && <p className="py-16 text-center text-red-500">{error}</p>}
          {!loading && !error && (data?.productos.length ?? 0) === 0 && (
            <p className="py-16 text-center text-slate-400">Sin resultados.</p>
          )}

          {!loading && !error && (data?.productos.length ?? 0) > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data?.productos.map((p) => (
                  <ProductoCard key={p.id} producto={p} onAdd={addToCart} />
                ))}
              </div>
              {(data?.totalPaginas ?? 1) > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-slate-500">Página {page + 1} de {data?.totalPaginas}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={(data?.totalPaginas ?? 1) <= page + 1}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
