import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, Heart, ShoppingCart, X } from 'lucide-react';
import { marketplaceApi } from '@/api/marketplace';
import { useAsync } from '@/hooks/useAsync';
import { useAddToCart } from '@/hooks/useAddToCart';
import { ProductoCard } from '@/components/marketplace/ProductoCard';
import { ProductImage } from '@/components/ProductImage';
import { KlikeaLogo } from '@/components/KlikeaLogo';
import { FadeIn } from '@/components/landing/FadeIn';
import { HeroProductField } from '@/components/landing/HeroProductField';
import { GradientPill } from '@/components/landing/PillButton';
import { StackingProducts } from '@/components/landing/StackingProducts';
import { SwipeDeck } from '@/components/landing/SwipeDeck';
import { GRUPOS_CATEGORIAS } from '@/lib/categoriaGrupos';
import { formatCurrency } from '@/lib/format';
import type { HomeData, Producto } from '@/types';

/** Clave de localStorage para recordar los intereses (deslizados a la derecha). */
const INTERESES_KEY = 'klikea.intereses';

function leerIntereses(): Producto[] {
  try {
    const raw = localStorage.getItem(INTERESES_KEY);
    return raw ? (JSON.parse(raw) as Producto[]) : [];
  } catch {
    return [];
  }
}

/** Home del marketplace: hero magnético KLIKEA + destacados apilados + categorías + tiendas. */
export default function HomePage() {
  const { data, loading, error } = useAsync<HomeData>(() => marketplaceApi.home(), []);
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  // Se recuerdan entre sesiones: lo que deslizás a la derecha queda guardado para comprar más tarde.
  const [intereses, setIntereses] = useState<Producto[]>(leerIntereses);

  useEffect(() => {
    try {
      localStorage.setItem(INTERESES_KEY, JSON.stringify(intereses));
    } catch {
      /* ignore */
    }
  }, [intereses]);

  function buscar(q: string) {
    navigate(`/tienda/buscar?q=${encodeURIComponent(q)}`);
  }

  const goToProduct = (id: number) => navigate(`/tienda/producto/${id}`);

  /* Pool de imágenes para el campo magnético del hero (sin repetidos). */
  const heroPool = useMemo(() => {
    const seen = new Set<number>();
    const out: Producto[] = [];
    for (const p of [...(data?.destacados ?? []), ...(data?.ofertas ?? []), ...(data?.masBuscados ?? [])]) {
      if (p.imagenUrl && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [data]);

  /* Top 5 destacados con imagen para el showcase apilado. */
  const showcase = useMemo(() => {
    const base = (data?.destacados?.length ? data.destacados : heroPool).filter((p) => p.imagenUrl);
    return [...base].sort((a, b) => (b.precioEfectivo ?? b.precio) - (a.precioEfectivo ?? a.precio)).slice(0, 5);
  }, [data, heroPool]);

  /* Todas las listas del home, deduplicadas (fallback cuando el backend no
     devuelve `catalogo`/`novedades` todavía — p. ej. sin reiniciar). */
  const combinados = useMemo(() => {
    const seen = new Set<number>();
    const out: Producto[] = [];
    for (const p of [...(data?.masBuscados ?? []), ...(data?.destacados ?? []), ...(data?.ofertas ?? [])]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [data]);

  /* Nuevos productos (sección NUEVO): usa `novedades` del backend nuevo; si no,
     cae a `masBuscados`, que el backend calcula como los más recientes (id DESC). */
  const novedades = data?.novedades?.length ? data.novedades : (data?.masBuscados ?? []);

  /* Deck "Descubrí deslizando": catálogo completo del backend nuevo; si no, todas
     las listas combinadas para que igual se vea lleno. */
  const deck = data?.catalogo?.length ? data.catalogo : combinados;

  if (loading) return <p className="py-16 text-center text-slate-400">Cargando…</p>;
  if (error) return <p className="py-16 text-center text-rose-400">{error}</p>;

  const seccion = (titulo: string, productos: Producto[], id?: string) =>
    productos.length > 0 && (
      <section id={id} className="scroll-mt-24 mb-20 sm:mb-28">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="mk-section-title">{titulo}</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {productos.map((p) => (
            <ProductoCard key={p.id} producto={p} onAdd={addToCart} />
          ))}
        </div>
      </section>
    );

  return (
    <div className="overflow-x-clip">
      {/* ── Hero KLIKEA — campo de productos magnético ───────────── */}
      <section className="relative mb-4 flex min-h-[82vh] flex-col">
        {heroPool.length > 0 && <HeroProductField products={heroPool} onSelect={goToProduct} />}

        <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 mx-auto mt-[20vh] flex w-full flex-col items-center sm:mt-[24vh]">
          <KlikeaLogo noBag className="mx-auto w-full max-w-2xl" />
          <p
            className="mt-3 text-center font-light uppercase text-[#e7a149]"
            style={{ letterSpacing: '0.5em', fontSize: 'clamp(0.7rem, 1.5vw, 1.05rem)' }}
          >
            Todo a un click
          </p>
        </FadeIn>

        <div className="relative z-10 mt-auto flex items-end justify-between gap-4 pb-8 pt-10">
          <FadeIn delay={0.35} y={20}>
            <p className="max-w-[180px] text-[clamp(0.75rem,1.4vw,1.25rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[240px]">
              Una experiencia de compra hecha para sorprender y deleitar
            </p>
          </FadeIn>
          <FadeIn delay={0.5} y={20}>
            <GradientPill onClick={() => document.getElementById('mas-buscados')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorar <ArrowDown className="h-4 w-4" />
            </GradientPill>
          </FadeIn>
        </div>
      </section>

      {/* ── Destacados apilados al hacer scroll ──────────────────── */}
      {showcase.length >= 1 && (
        <section id="destacados" className="scroll-mt-24 pb-32 sm:pb-44">
          <FadeIn y={30} className="mb-10 flex items-end justify-between gap-4">
            <h2
              className="hero-heading font-black uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2rem, 9vw, 110px)' }}
            >
              Destacados
            </h2>
            <span className="hidden text-xs uppercase tracking-[0.3em] text-white/35 sm:block">
              Desliza para descubrir
            </span>
          </FadeIn>
          <StackingProducts
            products={showcase}
            onNavigate={goToProduct}
            onAddToCart={(id) => {
              const p = showcase.find((x) => x.id === id);
              if (p) void addToCart(p);
            }}
          />
        </section>
      )}

      {/* ── Nuevos productos (NUEVO) — entre Destacados y Descubrí deslizando ── */}
      {novedades.length > 0 && (
        <section className="mb-20 sm:mb-28">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mk-section-title">Descubre nuestros nuevos productos</h2>
              <span className="rounded-full bg-gradient-to-r from-cta-500 to-cta-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-cta-900/30">
                Nuevo
              </span>
            </div>
            <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {novedades.map((p) => (
              <ProductoCard
                key={p.id}
                producto={p}
                onAdd={addToCart}
                badge={
                  <span className="rounded-full bg-gradient-to-r from-cta-500 to-cta-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg shadow-cta-900/40">
                    Nuevo
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Swipe estilo Tinder: me interesa / no me interesa ────── */}
      {(() => {
        if (deck.length === 0) return null;
        return (
          <section className="mb-20 pt-10 sm:mb-28 sm:pt-16">
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="mk-section-title">Descubrí deslizando</h2>
              <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
            </div>
            <p className="mb-6 max-w-md text-sm text-slate-400">
              Deslizá la carta — derecha si te interesa, izquierda si no. Lo que te guste se guarda abajo.
            </p>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,440px)_1fr]">
              <SwipeDeck
                products={deck}
                onLike={(p) => setIntereses((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))}
              />

              {/* Bandeja de intereses */}
              <div className="lg:pt-2">
                <div className="mb-5 flex items-center gap-2.5">
                  <Heart className="h-5 w-5 text-cta-300" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                    Tus intereses {intereses.length > 0 && <span className="text-slate-500">({intereses.length})</span>}
                  </h3>
                </div>

                {intereses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/12 p-6 text-sm leading-relaxed text-slate-500">
                    Aún no marcaste ninguno. Deslizá una carta a la derecha o tocá el corazón para agregarlo aquí y poder añadirlo al carrito.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {intereses.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                          <ProductImage src={p.imagenUrl ?? undefined} alt={p.nombre} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {p.tiendaNombre && <p className="truncate text-[10px] font-medium uppercase tracking-wide text-brand-300/80">{p.tiendaNombre}</p>}
                          <p className="truncate text-sm font-medium text-slate-100">{p.nombre}</p>
                          <p className="text-sm font-bold text-white">{formatCurrency(p.precioEfectivo ?? p.precio)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          disabled={p.stock <= 0}
                          aria-label={`Agregar ${p.nombre} al carrito`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cta-500/50 px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider text-cta-300 transition-colors hover:bg-cta-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> {p.stock <= 0 ? 'Sin stock' : 'Agregar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIntereses((prev) => prev.filter((x) => x.id !== p.id))}
                          aria-label={`Quitar ${p.nombre} de tus intereses`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {seccion('Los más buscados', data?.masBuscados ?? [], 'mas-buscados')}
      {seccion('Flash sales / Ofertas', data?.ofertas ?? [])}

      {/* Bento de categorías (grupos fijos; cada categoría busca por su nombre) */}
      <section className="mb-20 sm:mb-28">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="mk-section-title">Categorías</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GRUPOS_CATEGORIAS.map((g) => (
            <div key={g.grupo} className="mk-surface p-5 transition-colors hover:border-white/20">
              <h3 className="mb-3 font-bold text-white">{g.grupo}</h3>
              <ul className="flex flex-wrap gap-2">
                {g.categorias.map((c) => (
                  <li key={c}>
                    <button onClick={() => buscar(c)} className="mk-chip text-xs">
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
        <section className="mb-20 sm:mb-28">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="mk-section-title">Tiendas en Klikea</h2>
            <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-3">
            {data?.tiendas.map((t) => (
              <button
                key={t.id}
                onClick={() => navigate(`/tienda/comercio/${t.slug}`)}
                className="mk-card flex items-center gap-3 p-3 pr-5"
                title={t.descripcion ?? t.nombre}
              >
                <ProductImage src={t.logoUrl ?? undefined} alt={t.nombre} className="h-11 w-11 rounded-full bg-white/5 ring-1 ring-white/10" />
                <span className="text-sm font-semibold text-slate-100">{t.nombre}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
