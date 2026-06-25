import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogoApi } from '@/api/catalogo';
import { useAsync } from '@/hooks/useAsync';
import { useAddToCart } from '@/hooks/useAddToCart';
import { ProductoCard } from '@/components/marketplace/ProductoCard';
import { ProductImage } from '@/components/ProductImage';
import type { Catalogo, Producto } from '@/types';

type Orden = 'reciente' | 'precio_desc' | 'precio_asc' | 'descuento';

const ORDENES: { value: Orden; label: string }[] = [
  { value: 'reciente', label: 'Más reciente' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'descuento', label: 'Mayor descuento' },
];

function precio(p: Producto) {
  return p.precioEfectivo ?? p.precio;
}

/** Página pública de una tienda: cabecera + filtro por categoría + orden (todo en cliente). */
export default function StorePage() {
  const { slug = '' } = useParams();
  const addToCart = useAddToCart();
  const { data, loading, error } = useAsync<Catalogo>(() => catalogoApi.porSlug(slug), [slug]);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [orden, setOrden] = useState<Orden>('reciente');

  const productos = data?.productos ?? [];

  // Categorías de la tienda (derivadas de sus productos).
  const categorias = useMemo(() => {
    const map = new Map<number, string>();
    productos.forEach((p) => {
      if (p.categoriaId != null && p.categoriaNombre) map.set(p.categoriaId, p.categoriaNombre);
    });
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [productos]);

  const visibles = useMemo(() => {
    let lista = categoriaId == null ? productos : productos.filter((p) => p.categoriaId === categoriaId);
    lista = [...lista];
    switch (orden) {
      case 'precio_desc': lista.sort((a, b) => precio(b) - precio(a)); break;
      case 'precio_asc': lista.sort((a, b) => precio(a) - precio(b)); break;
      case 'descuento': lista.sort((a, b) => (b.descuentoPorcentaje ?? 0) - (a.descuentoPorcentaje ?? 0)); break;
      default: lista.sort((a, b) => b.id - a.id);
    }
    return lista;
  }, [productos, categoriaId, orden]);

  if (loading) return <p className="py-16 text-center text-slate-400">Cargando…</p>;
  if (error) return <p className="py-16 text-center text-red-500">{error}</p>;

  const tienda = data?.tienda;

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">Inicio / <span className="text-slate-400">{tienda?.nombre}</span></p>

      {/* Cabecera de la tienda */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-cover bg-center"
        style={tienda?.bannerUrl ? { backgroundImage: `url(${tienda.bannerUrl})` } : undefined}
      >
        <div className="flex items-center gap-5 bg-gradient-to-r from-[#0c0c0c]/95 via-[#0c0c0c]/80 to-[#0c0c0c]/55 p-6 sm:p-8 backdrop-blur-[2px]">
          <ProductImage src={tienda?.logoUrl ?? undefined} alt={tienda?.nombre ?? 'Tienda'} className="h-20 w-20 shrink-0 rounded-full bg-white/5 ring-2 ring-white/15 sm:h-24 sm:w-24" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{tienda?.nombre}</h1>
            {tienda?.descripcion && <p className="mt-1 max-w-lg text-sm text-slate-300">{tienda.descripcion}</p>}
          </div>
        </div>
      </div>

      {/* Tiles de categorías de la tienda */}
      {categorias.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaId(null)}
            className={`mk-chip ${categoriaId == null ? 'mk-chip-active' : ''}`}
          >
            Todo
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={`mk-chip ${categoriaId === c.id ? 'mk-chip-active' : ''}`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Orden */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{visibles.length} productos</span>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Ordenar por:
          <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className="mk-select">
            {ORDENES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <p className="py-16 text-center text-slate-400">Esta tienda no tiene productos en esta categoría.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((p) => (
            <ProductoCard key={p.id} producto={p} onAdd={addToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
