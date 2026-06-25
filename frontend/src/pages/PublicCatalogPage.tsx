import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ArrowDown, Heart } from 'lucide-react';
import { catalogoApi } from '@/api/catalogo';
import { useAsync } from '@/hooks/useAsync';
import { ProductImage } from '@/components/ProductImage';
import { formatCurrency } from '@/lib/format';
import { IconStore, IconWhatsapp } from '@/components/icons';
import { FadeIn } from '@/components/landing/FadeIn';
import { HeroProductField } from '@/components/landing/HeroProductField';
import { AnimatedText } from '@/components/landing/AnimatedText';
import { GradientPill } from '@/components/landing/PillButton';
import { ProductMarquee } from '@/components/landing/ProductMarquee';
import { SwipeDeck } from '@/components/landing/SwipeDeck';
import type { Producto } from '@/types';

/** Catálogo público por slug (sin login). Solo lectura + pedidos por WhatsApp. */
export default function PublicCatalogPage() {
  const { slug = '' } = useParams();
  const { data, loading, error, reload } = useAsync(() => catalogoApi.porSlug(slug), [slug]);
  const [query, setQuery] = useState('');
  const [intereses, setIntereses] = useState<Producto[]>([]);

  const storeName = data?.tienda.nombre ?? 'Catálogo';
  const allProducts = data?.productos ?? [];

  const productos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allProducts.filter((p) => p.nombre.toLowerCase().includes(q)) : allProducts;
  }, [allProducts, query]);

  const showcase = useMemo(() => {
    const inStock = allProducts.filter((p) => p.stock > 0 && p.imagenUrl);
    const base = inStock.length >= 1 ? inStock : allProducts;
    return [...base].sort((a, b) => b.precio - a.precio).slice(0, 5);
  }, [allProducts]);

  const waNumber = data?.contactosWhatsapp?.[0];

  const waLink = (p?: Producto) =>
    `https://wa.me/${(waNumber ?? '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      p
        ? `Hola, me interesa "${p.nombre}" (${formatCurrency(p.precio)}) del catálogo de ${storeName}.`
        : `Hola, vi el catálogo de ${storeName} y quiero hacer un pedido.`,
    )}`;

  if (loading) {
    return (
      <div className="tienda-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#B600A8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="tienda-bg flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-300/80">{error}</p>
        <button
          onClick={reload}
          className="rounded-full bg-red-500/15 px-5 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const heroPool = allProducts.filter((p) => p.imagenUrl);

  return (
    <div className="tienda-bg min-h-screen overflow-x-clip">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(123deg, #7a3310 0%, #c4631d 55%, #e7a149 100%)' }}
          >
            {data?.tienda.logoUrl ? (
              <ProductImage src={data.tienda.logoUrl} alt={storeName} className="h-10 w-10 rounded-xl" />
            ) : (
              <IconStore />
            )}
          </span>
          <div className="mr-auto">
            <h1 className="text-base font-semibold uppercase tracking-wide text-[#D7E2EA]">{storeName}</h1>
            <p className="text-xs uppercase tracking-widest text-white/40">Catálogo</p>
          </div>
          {waNumber && (
            <a
              href={waLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-emerald-500"
            >
              <IconWhatsapp className="h-4 w-4" /> Pedir
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="relative flex min-h-[82vh] flex-col">
          {heroPool.length > 0 && <HeroProductField products={heroPool} />}

          <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 mt-[18vh] sm:mt-[22vh]">
            <h2 className="hero-heading w-full whitespace-nowrap text-center font-black uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.25rem, 9vw, 7rem)' }}
            >
              {storeName}
            </h2>
          </FadeIn>

          <div className="relative z-10 mt-auto flex items-end justify-between gap-4 pb-8 pt-10">
            <FadeIn delay={0.35} y={20}>
              <p className="max-w-[180px] text-[clamp(0.75rem,1.4vw,1.25rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[240px]">
                Productos seleccionados, listos para ti
              </p>
            </FadeIn>
            <FadeIn delay={0.5} y={20}>
              <GradientPill onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver todo <ArrowDown className="h-4 w-4" />
              </GradientPill>
            </FadeIn>
          </div>
        </section>

        {/* Marquee */}
        {allProducts.length > 2 && (
          <section className="pt-8">
            <ProductMarquee products={allProducts.filter((p) => p.imagenUrl).slice(0, 12)} />
          </section>
        )}

        {/* Brand */}
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-12 py-20 text-center">
          <AnimatedText
            text={`Bienvenido al catálogo de ${storeName}. Explora nuestra selección y haz tu pedido en segundos por WhatsApp.`}
            className="max-w-[560px] text-[clamp(1rem,2vw,1.35rem)] font-medium leading-relaxed text-[#D7E2EA]"
          />
        </section>

        {/* Destacados — deck tipo Tinder: deslizá derecha (me interesa) / izquierda (descartar) */}
        {showcase.length >= 1 && (
          <section className="pb-16">
            <FadeIn y={30} className="mb-3">
              <h3 className="hero-heading font-black uppercase leading-none tracking-tight"
                style={{ fontSize: 'clamp(2rem, 9vw, 110px)' }}
              >
                Destacados
              </h3>
            </FadeIn>
            <FadeIn delay={0.1} y={20} className="mb-10">
              <p className="max-w-md text-sm font-light uppercase tracking-wide text-[#D7E2EA]/60">
                Deslizá la carta — derecha si te interesa, izquierda si no. Lo que te guste se guarda abajo.
              </p>
            </FadeIn>

            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,440px)_1fr]">
              <SwipeDeck
                products={showcase}
                onLike={(p) => setIntereses((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]))}
              />

              {/* Bandeja de intereses */}
              <div className="lg:pt-4">
                <div className="mb-5 flex items-center gap-2.5">
                  <Heart className="h-5 w-5 text-emerald-300" />
                  <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D7E2EA]">
                    Tus intereses {intereses.length > 0 && <span className="text-white/40">({intereses.length})</span>}
                  </h4>
                </div>

                {intereses.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-white/12 p-6 text-sm font-light leading-relaxed text-white/40">
                    Aún no marcaste ninguno. Deslizá una carta a la derecha o tocá el corazón para agregarlo aquí.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {intereses.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
                      >
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/40">
                          <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium uppercase tracking-wide text-[#D7E2EA]">{p.nombre}</p>
                          <p className="font-mono text-sm font-black text-white">{formatCurrency(p.precio)}</p>
                        </div>
                        {waNumber ? (
                          <a
                            href={waLink(p)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Pedir ${p.nombre} por WhatsApp`}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/90 px-3.5 py-2 text-[11px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-emerald-500"
                          >
                            <IconWhatsapp className="h-3.5 w-3.5" /> Pedir
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIntereses((prev) => prev.filter((x) => x.id !== p.id))}
                            className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-[11px] uppercase tracking-wider text-white/50 transition-colors hover:text-white"
                          >
                            Quitar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Full catalog */}
        <section id="catalogo" className="scroll-mt-24 pb-20 pt-12">
          <FadeIn y={30} className="mb-8">
            <h3 className="hero-heading font-black uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(2rem, 9vw, 110px)' }}
            >
              Catálogo
            </h3>
          </FadeIn>

          <div className="mb-10 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                className="w-full rounded-full border border-white/12 bg-white/5 py-3.5 pl-11 pr-4 text-sm uppercase tracking-wide text-[#D7E2EA] placeholder:text-white/30 transition-colors focus:border-[#B600A8]/60 focus:outline-none"
                placeholder="Buscar producto…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar producto"
              />
            </div>
          </div>

          {productos.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-medium uppercase tracking-wide text-[#D7E2EA]/70">Sin productos</p>
              <p className="mt-1 text-sm text-white/35">Esta tienda aún no publicó productos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {productos.map((p, i) => (
                <FadeIn key={p.id} delay={(i % 4) * 0.08} y={36} className="h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                      <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-full w-full" />
                      {p.stock <= 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Agotado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      {p.categoriaNombre && (
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#B600A8]">
                          {p.categoriaNombre}
                        </p>
                      )}
                      <h4 className="line-clamp-2 text-sm font-medium uppercase tracking-wide text-[#D7E2EA]">
                        {p.nombre}
                      </h4>
                      <p className="mt-2 font-mono text-lg font-black text-white">{formatCurrency(p.precio)}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
                      </p>
                      {waNumber && (
                        <a
                          href={waLink(p)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-xs font-medium uppercase tracking-widest text-emerald-300 transition-colors hover:bg-emerald-500/20"
                        >
                          <IconWhatsapp className="h-3.5 w-3.5" /> Pedir
                        </a>
                      )}
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
