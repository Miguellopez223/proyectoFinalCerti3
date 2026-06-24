import { useNavigate } from 'react-router-dom';
import { marketplaceApi } from '@/api/marketplace';
import { useAsync } from '@/hooks/useAsync';
import { useAddToCart } from '@/hooks/useAddToCart';
import { ProductoCard } from '@/components/marketplace/ProductoCard';
import { ProductImage } from '@/components/ProductImage';
import { GRUPOS_CATEGORIAS } from '@/lib/categoriaGrupos';
import type { HomeData, Producto } from '@/types';

/** Home del marketplace: secciones cross-store + bento de categorías + tiendas. */
export default function HomePage() {
  const { data, loading, error } = useAsync<HomeData>(() => marketplaceApi.home(), []);
  const addToCart = useAddToCart();
  const navigate = useNavigate();

  function buscar(q: string) {
    navigate(`/tienda/buscar?q=${encodeURIComponent(q)}`);
  }

  if (loading) return <p className="py-16 text-center text-slate-400">Cargando…</p>;
  if (error) return <p className="py-16 text-center text-red-500">{error}</p>;

  const seccion = (titulo: string, productos: Producto[]) =>
    productos.length > 0 && (
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">{titulo}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {productos.map((p) => (
            <ProductoCard key={p.id} producto={p} onAdd={addToCart} />
          ))}
        </div>
      </section>
    );

  return (
    <div>
      {/* Banner placeholder (los banners del hero se diseñan aparte) */}
      <div className="mb-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
        Klikea — espacio para banners promocionales
      </div>

      {seccion('Los más buscados', data?.masBuscados ?? [])}
      {seccion('Flash sales / Ofertas', data?.ofertas ?? [])}
      {seccion('Destacados', data?.destacados ?? [])}

      {/* Bento de categorías (grupos fijos; cada categoría busca por su nombre) */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Categorías</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GRUPOS_CATEGORIAS.map((g) => (
            <div key={g.grupo} className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-slate-800">{g.grupo}</h3>
              <ul className="space-y-1">
                {g.categorias.map((c) => (
                  <li key={c}>
                    <button onClick={() => buscar(c)} className="text-sm text-slate-600 hover:text-slate-900 hover:underline">
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Tiendas que usan Klikea */}
      {(data?.tiendas?.length ?? 0) > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Tiendas</h2>
          <div className="flex flex-wrap gap-3">
            {data?.tiendas.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/tienda/comercio/${t.slug}`)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
                title={t.descripcion ?? t.nombre}
              >
                <ProductImage src={t.logoUrl ?? undefined} alt={t.nombre} className="h-10 w-10 rounded" />
                <span className="text-sm font-medium text-slate-700">{t.nombre}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
