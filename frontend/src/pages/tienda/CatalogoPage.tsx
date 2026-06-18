import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productosApi } from '@/api/productos';
import { categoriasApi } from '@/api/categorias';
import { carritoApi } from '@/api/carrito';
import { useAsync } from '@/hooks/useAsync';
import { useDebounced } from '@/hooks/useDebounced';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Spinner } from '@/components/ui/Spinner';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconSearch, IconCart, IconBox, IconRefresh } from '@/components/icons';
import type { Producto } from '@/types';

// ── Page ────────────────────────────────────────────────────

export default function CatalogoPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { refresh } = useCart();
  const navigate = useNavigate();

  const productosState = useAsync(() => productosApi.listarPorTienda(tiendaId), [tiendaId]);
  const categoriasState = useAsync(() => categoriasApi.listarPorTienda(tiendaId), [tiendaId]);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [addingId, setAddingId] = useState<number | null>(null);

  const allProducts = productosState.data ?? [];
  const isFiltering = Boolean(debounced) || categoriaId != null;

  /* Up to 4 products for the featured carousel */
  const featuredProducts = useMemo(() => {
    const inStock = allProducts.filter((p) => p.stock > 0);
    return (inStock.length >= 1 ? inStock : allProducts).slice(0, 4);
  }, [allProducts]);

  /* Products grouped by category — only in browse (unfiltered) mode */
  const categoryGroups = useMemo(() => {
    if (isFiltering) return null;
    const map = new Map<string, Producto[]>();
    for (const p of allProducts) {
      const key = p.categoriaNombre ?? 'Otros productos';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([name, products]) => ({ name, products }));
  }, [allProducts, isFiltering]);

  /* Flat list for filter/search results */
  const filteredProducts = useMemo(() => {
    let list = allProducts;
    if (categoriaId != null) list = list.filter((p) => p.categoriaId === categoriaId);
    const q = debounced.trim().toLowerCase();
    if (q) list = list.filter((p) => p.nombre.toLowerCase().includes(q));
    return list;
  }, [allProducts, categoriaId, debounced]);

  async function addToCart(productoId: number) {
    setAddingId(productoId);
    try {
      await carritoApi.agregarItem({ tiendaId, usuarioId: user!.userId, productoId, cantidad: 1 });
      await refresh();
      toast.success('Agregado al carrito.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  }

  const cardProps = { addingId, onAddToCart: addToCart };

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pb-12 pt-10">
        {/* Rotating conic aurora */}
        <div className="hero-aurora" />

        {/* Floating orbs */}
        <div className="orb -right-40 -top-40 h-[560px] w-[560px] animate-float bg-brand-500/9" />
        <div
          className="orb -bottom-28 -left-28 h-[440px] w-[440px] bg-purple-600/9"
          style={{ animation: 'float 8s ease-in-out -3s infinite' }}
        />
        <div
          className="orb right-1/4 top-1/3 h-72 w-72 bg-cyan-400/7"
          style={{ animation: 'float 6s ease-in-out -1.5s infinite' }}
        />
        <div
          className="orb left-1/4 bottom-0 h-52 w-52 bg-violet-500/7"
          style={{ animation: 'float 9s ease-in-out -5s infinite' }}
        />

        <p className="relative mb-3 text-[11px] font-bold tracking-[0.35em] uppercase text-brand-400">
          Bienvenido a la tienda
        </p>
        <h1 className="relative text-6xl font-black leading-none tracking-tighter text-white sm:text-8xl">
          Catálogo
        </h1>
        <p className="relative mt-5 max-w-sm text-sm leading-relaxed text-white/45">
          Descubre los mejores productos con una experiencia de compra excepcional.
        </p>
      </section>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            className="w-full rounded-2xl border border-white/12 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/35 backdrop-blur-sm transition-all focus:border-brand-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-400/20"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar"
          />
        </div>
      </div>

      {/* ── Category chips ─────────────────────────────────── */}
      {(categoriasState.data?.length ?? 0) > 0 && (
        <div className="mb-12 flex flex-wrap gap-2">
          <CategoryChip active={categoriaId == null} onClick={() => setCategoriaId(null)}>
            Todo
          </CategoryChip>
          {categoriasState.data?.map((c) => (
            <CategoryChip key={c.id} active={categoriaId === c.id} onClick={() => setCategoriaId(c.id)}>
              {c.nombre}
            </CategoryChip>
          ))}
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────── */}
      {productosState.loading && <DarkSkeletonGrid />}

      {/* ── Error ──────────────────────────────────────────── */}
      {productosState.error && !productosState.loading && (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/8 py-16 text-center backdrop-blur-sm">
          <p className="text-sm text-red-300/80">{productosState.error}</p>
          <button
            onClick={productosState.reload}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25"
          >
            <IconRefresh className="h-4 w-4" /> Reintentar
          </button>
        </div>
      )}

      {/* ── Browse mode ────────────────────────────────────── */}
      {!productosState.loading && !productosState.error && !isFiltering && (
        <>
          {/* Featured: cinematic carousel, auto-advances every 15s */}
          {featuredProducts.length >= 1 && (
            <FeaturedCarousel
              products={featuredProducts}
              addingId={addingId}
              onAddToCart={addToCart}
              navigate={navigate}
            />
          )}

          {/* Per-category sections with scroll reveal */}
          {categoryGroups?.map(({ name, products }) => (
            <CategorySection
              key={name}
              name={name}
              products={products}
              navigate={navigate}
              {...cardProps}
            />
          ))}

          {allProducts.length === 0 && (
            <EmptyDark
              title="Catálogo vacío"
              message="Esta tienda aún no publicó productos."
            />
          )}
        </>
      )}

      {/* ── Filter / search mode ───────────────────────────── */}
      {!productosState.loading && !productosState.error && isFiltering && (
        <FilteredGrid
          products={filteredProducts}
          navigate={navigate}
          {...cardProps}
        />
      )}
    </div>
  );
}

// ── FeaturedCarousel ────────────────────────────────────────

interface CarouselProps {
  products: Producto[];
  addingId: number | null;
  onAddToCart: (id: number) => void;
  navigate: ReturnType<typeof useNavigate>;
}

function FeaturedCarousel({ products, addingId, onAddToCart, navigate }: CarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [exitingIdx, setExitingIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  /* Auto-advance every 15s with progress tracking */
  useEffect(() => {
    if (products.length <= 1) return;
    setProgress(0);
    const start = Date.now();
    const DURATION = 15_000;

    const progressId = setInterval(() => {
      setProgress(Math.min((Date.now() - start) / DURATION, 1));
    }, 80);

    const advanceId = setTimeout(() => {
      clearInterval(progressId);
      const nextIdx = (activeIdx + 1) % products.length;
      setExitingIdx(activeIdx);
      setActiveIdx(nextIdx);
      setTimeout(() => setExitingIdx(null), 650);
    }, DURATION);

    return () => {
      clearInterval(progressId);
      clearTimeout(advanceId);
    };
  }, [activeIdx, products.length]);

  function goTo(idx: number) {
    if (idx === activeIdx || exitingIdx !== null) return;
    setExitingIdx(activeIdx);
    setActiveIdx(idx);
    setProgress(0);
    setTimeout(() => setExitingIdx(null), 650);
  }

  return (
    <section className="section-revealed mb-20">
      {/* Section label */}
      <div className="mb-7 flex items-center gap-4">
        <span className="text-[10px] font-bold tracking-[0.45em] uppercase text-brand-400">
          Destacados
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-brand-400/25 via-white/8 to-transparent" />
      </div>

      {/* Carousel stage */}
      <div className="relative overflow-hidden rounded-[36px] min-h-[480px] sm:min-h-[580px] lg:min-h-[660px] lg-card"
        style={{ '--reveal-delay': '0ms' } as React.CSSProperties}
      >
        {/* Exiting card — slides out to the left */}
        {exitingIdx !== null && (
          <div
            key={`exit-${exitingIdx}`}
            className="absolute inset-0 z-10 animate-carousel-out"
          >
            <FeaturedSlide
              product={products[exitingIdx]}
              addingId={addingId}
              onAddToCart={onAddToCart}
              onNavigate={() => navigate(`/tienda/producto/${products[exitingIdx].id}`)}
            />
          </div>
        )}

        {/* Active card — slides in from the right when transitioning */}
        <div
          key={`active-${activeIdx}`}
          className={cn(
            'absolute inset-0 z-20',
            exitingIdx !== null && 'animate-carousel-in',
          )}
        >
          <FeaturedSlide
            product={products[activeIdx]}
            addingId={addingId}
            onAddToCart={onAddToCart}
            onNavigate={() => navigate(`/tienda/producto/${products[activeIdx].id}`)}
          />
        </div>

        {/* Controls: dots + timer bar — always on top */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-4 px-7 pb-6 pt-20"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          {/* Navigation dots */}
          <div className="flex items-center gap-2">
            {products.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className={cn(
                  'cursor-pointer rounded-full transition-all duration-300',
                  i === activeIdx
                    ? 'h-1.5 w-7 bg-white shadow-lg shadow-white/30'
                    : 'h-1.5 w-1.5 bg-white/38 hover:bg-white/65',
                )}
                aria-label={`Ir al producto ${i + 1}`}
              />
            ))}
          </div>

          {/* Timer progress bar */}
          {products.length > 1 && (
            <div className="flex-1 h-px overflow-hidden rounded-full bg-white/18">
              <div
                className="h-full rounded-full bg-white/55"
                style={{ width: `${Math.round(progress * 100)}%`, transition: 'none' }}
              />
            </div>
          )}

          {/* Counter */}
          <span className="font-mono text-[11px] tabular-nums text-white/40">
            {activeIdx + 1}&thinsp;/&thinsp;{products.length}
          </span>
        </div>
      </div>
    </section>
  );
}

// ── FeaturedSlide ───────────────────────────────────────────

interface SlideProps {
  product: Producto;
  addingId: number | null;
  onAddToCart: (id: number) => void;
  onNavigate: () => void;
}

function FeaturedSlide({ product: p, addingId, onAddToCart, onNavigate }: SlideProps) {
  const agotado = p.stock <= 0;

  return (
    <div className="absolute inset-0 cursor-pointer" onClick={onNavigate}>
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-slate-950">
        <ProductImage
          src={p.imagenUrl}
          alt={p.nombre}
          className="h-full w-full object-cover transition-transform duration-[8000ms] ease-out scale-[1.04] group-hover:scale-100"
        />
      </div>

      {/* Depth gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/8" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      {/* Specular highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

      {/* Agotado pill */}
      {agotado && (
        <div className="absolute right-5 top-5 z-10">
          <span className="rounded-full bg-red-500/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            Agotado
          </span>
        </div>
      )}

      {/* Info — bottom, above the controls bar */}
      <div className="absolute bottom-[72px] left-0 right-0 px-7">
        {p.categoriaNombre && (
          <p className="mb-3 text-[11px] font-bold tracking-[0.45em] uppercase text-brand-400">
            {p.categoriaNombre}
          </p>
        )}
        <h3 className="mb-5 line-clamp-2 text-4xl font-black leading-[1.04] tracking-tighter text-white sm:text-5xl lg:text-6xl">
          {p.nombre}
        </h3>

        <div className="flex flex-wrap items-end gap-5">
          <div>
            <p className="font-mono text-3xl font-black text-white">
              {formatCurrency(p.precio)}
            </p>
            <p className="mt-0.5 text-sm text-white/70">
              {agotado ? 'Sin stock disponible' : `${p.stock} disponibles`}
            </p>
          </div>

          {!agotado && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(p.id); }}
              disabled={addingId === p.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-2xl shadow-black/50 transition-all hover:bg-white/90 active:scale-95 disabled:opacity-60"
            >
              {addingId === p.id ? (
                <Spinner className="h-4 w-4 text-slate-700" />
              ) : (
                <>
                  <IconCart className="h-4 w-4" />
                  Agregar al carrito
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CategorySection ─────────────────────────────────────────

interface SectionProps {
  name: string;
  products: Producto[];
  navigate: ReturnType<typeof useNavigate>;
  addingId: number | null;
  onAddToCart: (id: number) => void;
}

function CategorySection({ name, products, navigate, addingId, onAddToCart }: SectionProps) {
  const { ref, revealed } = useScrollReveal();

  return (
    <div ref={ref} className={cn('mb-20', revealed && 'section-revealed')}>
      {/* Apple-style large category header */}
      <div className="category-header mb-8">
        <h2 className="text-5xl font-black leading-none tracking-tighter text-white/90 sm:text-6xl">
          {name}
        </h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/35">
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Staggered product grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <LiquidGlassCard
            key={p.id}
            product={p}
            index={i}
            onNavigate={() => navigate(`/tienda/producto/${p.id}`)}
            addingId={addingId}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

// ── FilteredGrid ────────────────────────────────────────────

interface FilteredGridProps {
  products: Producto[];
  navigate: ReturnType<typeof useNavigate>;
  addingId: number | null;
  onAddToCart: (id: number) => void;
}

function FilteredGrid({ products, navigate, addingId, onAddToCart }: FilteredGridProps) {
  const [revealed, setRevealed] = useState(false);

  /* Trigger reveal one frame after mount so the CSS transition plays */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (products.length === 0) {
    return (
      <EmptyDark title="Sin coincidencias" message="Prueba con otro filtro o término de búsqueda." />
    );
  }

  return (
    <div className={cn(revealed && 'section-revealed')}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <LiquidGlassCard
            key={p.id}
            product={p}
            index={i}
            onNavigate={() => navigate(`/tienda/producto/${p.id}`)}
            addingId={addingId}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

// ── LiquidGlassCard ─────────────────────────────────────────

interface CardProps {
  product: Producto;
  index: number;
  addingId: number | null;
  onNavigate: () => void;
  onAddToCart: (id: number) => void;
}

function LiquidGlassCard({ product: p, index, addingId, onNavigate, onAddToCart }: CardProps) {
  const agotado = p.stock <= 0;

  return (
    <article
      onClick={onNavigate}
      className="lg-card group relative cursor-pointer overflow-hidden aspect-[3/4] rounded-3xl"
      style={{ '--reveal-delay': `${index * 75}ms` } as React.CSSProperties}
    >
      {/* Full-bleed image */}
      <div className="absolute inset-0 bg-slate-950">
        <ProductImage
          src={p.imagenUrl}
          alt={p.nombre}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      </div>

      {/* Depth gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent" />

      {/* Agotado pill */}
      {agotado && (
        <div className="absolute right-3 top-3 z-20">
          <span className="rounded-full bg-red-500/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            Agotado
          </span>
        </div>
      )}

      {/* Resting info — fades on hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300 group-hover:opacity-0">
        <h3 className="line-clamp-2 text-sm font-bold text-white">{p.nombre}</h3>
        <p className="mt-1 font-mono text-sm font-bold text-white/80">{formatCurrency(p.precio)}</p>
      </div>

      {/* ── Liquid Glass overlay — slides up on hover ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 z-10 translate-y-full overflow-hidden lg-panel rounded-t-[20px] p-5 transition-transform duration-[480ms] ease-out group-hover:translate-y-0"
      >
        {/* Iridescent shimmer accent */}
        <div className="pointer-events-none absolute inset-0 lg-shimmer" />

        {/* Glass content — fully opaque text for readability */}
        <div className="relative">
          {p.categoriaNombre && (
            <p className="mb-1.5 text-[10px] font-bold tracking-[0.32em] uppercase text-brand-400">
              {p.categoriaNombre}
            </p>
          )}
          <h3 className="line-clamp-2 text-sm font-bold text-white">{p.nombre}</h3>
          <p className="mt-2 font-mono text-2xl font-black text-white">
            {formatCurrency(p.precio)}
          </p>
          <p className="mt-0.5 text-xs text-white/80">
            {agotado ? 'Sin stock disponible' : `${p.stock} disponibles`}
          </p>

          {!agotado && (
            <button
              onClick={() => onAddToCart(p.id)}
              disabled={addingId === p.id}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:from-brand-600 hover:to-brand-700 disabled:opacity-60"
            >
              {addingId === p.id ? (
                <Spinner className="h-3.5 w-3.5 text-white" />
              ) : (
                <>
                  <IconCart className="h-3.5 w-3.5" />
                  Agregar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Support components ──────────────────────────────────────

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30'
          : 'border border-white/12 bg-white/6 text-white/55 backdrop-blur-sm hover:bg-white/14 hover:text-white/90',
      )}
    >
      {children}
    </button>
  );
}

function EmptyDark({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/7 text-white/30 ring-1 ring-white/10">
        <IconBox className="h-8 w-8" />
      </div>
      <p className="font-semibold text-white/60">{title}</p>
      <p className="mt-1 text-sm text-white/35">{message}</p>
    </div>
  );
}

function DarkSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse rounded-3xl bg-white/6 ring-1 ring-white/8"
        />
      ))}
    </div>
  );
}
