import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ArrowDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { catalogoApi } from '@/api/catalogo';
import { productosApi } from '@/api/productos';
import { categoriasApi } from '@/api/categorias';
import { carritoApi } from '@/api/carrito';
import { tiendasApi } from '@/api/tiendas';
import { useAsync } from '@/hooks/useAsync';
import { useDebounced } from '@/hooks/useDebounced';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/cn';
import { FadeIn } from '@/components/landing/FadeIn';
import { HeroProductField } from '@/components/landing/HeroProductField';
import { AnimatedText } from '@/components/landing/AnimatedText';
import { GradientPill } from '@/components/landing/PillButton';
import { ProductMarquee } from '@/components/landing/ProductMarquee';
import { StackingProducts } from '@/components/landing/StackingProducts';
import { ProductCard } from '@/components/landing/ProductCard';

/** Brand name shown across the storefront hero / display headings. */
const BRAND = 'Klikea';

export default function CatalogoPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { refresh } = useCart();
  const navigate = useNavigate();

  const tiendasState = useAsync(() => tiendasApi.listar(), []);
  const tiendaPublica = tiendasState.data?.[0] ?? null;
  const tiendaId = user?.tiendaId ?? tiendaPublica?.id;
  const tiendaSlug = tiendaPublica?.slug;

  const catalogoState = useAsync(
    () => (user || !tiendaSlug ? Promise.resolve(null) : catalogoApi.porSlug(tiendaSlug)),
    [user?.userId, tiendaSlug],
  );
  const productosState = useAsync(
    () => (user && tiendaId ? productosApi.listarPorTienda(tiendaId) : Promise.resolve([])),
    [user?.userId, tiendaId],
  );
  const categoriasState = useAsync(
    () => (user && tiendaId ? categoriasApi.listarPorTienda(tiendaId) : Promise.resolve([])),
    [user?.userId, tiendaId],
  );

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [addingId, setAddingId] = useState<number | null>(null);

  const allProducts = user ? (productosState.data ?? []) : (catalogoState.data?.productos ?? []);
  const storeName = user ? BRAND : (catalogoState.data?.tienda.nombre ?? tiendaPublica?.nombre ?? BRAND);
  const loading = tiendasState.loading || catalogoState.loading || (user && productosState.loading);
  const error = tiendasState.error || catalogoState.error || productosState.error;

  /* Top 5 most expensive in-stock products for the sticky-stacking showcase */
  const showcase = useMemo(() => {
    const inStock = allProducts.filter((p) => p.stock > 0 && p.imagenUrl);
    const base = inStock.length >= 1 ? inStock : allProducts;
    return [...base].sort((a, b) => b.precio - a.precio).slice(0, 5);
  }, [allProducts]);

  /* Filtered list for the full catalog grid */
  const filtered = useMemo(() => {
    let list = allProducts;
    if (categoriaId != null) list = list.filter((p) => p.categoriaId === categoriaId);
    const q = debounced.trim().toLowerCase();
    if (q) list = list.filter((p) => p.nombre.toLowerCase().includes(q));
    return list;
  }, [allProducts, categoriaId, debounced]);

  async function addToCart(productoId: number) {
    if (!user || !tiendaId) {
      navigate('/login', { state: { from: '/tienda', tiendaId } });
      return;
    }
    setAddingId(productoId);
    try {
      await carritoApi.agregarItem({ tiendaId, usuarioId: user.userId, productoId, cantidad: 1 });
      await refresh();
      toast.success('Agregado al carrito.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  }

  const goToProduct = (id: number) => navigate(`/tienda/producto/${id}`);
  const heroPool = allProducts.filter((p) => p.imagenUrl);
  const categoriasPublicas = useMemo(() => {
    const map = new Map<number, string>();
    allProducts.forEach((p) => {
      if (p.categoriaId != null && p.categoriaNombre) {
        map.set(p.categoriaId, p.categoriaNombre);
      }
    });
    return Array.from(map, ([id, nombre]) => ({ id, nombre }));
  }, [allProducts]);
  const categorias = user ? (categoriasState.data ?? []) : categoriasPublicas;

  return (
    <div className="overflow-x-clip">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] flex-col">
        {/* Distributed magnetic product backdrop — behind everything */}
        {heroPool.length > 0 && (
          <HeroProductField products={heroPool} onSelect={goToProduct} />
        )}

        {/* Heading — sits on top, readable */}
        <FadeIn delay={0.15} y={40} className="pointer-events-none relative z-10 mt-[18vh] sm:mt-[22vh]">
          <h1 className="hero-heading w-full whitespace-nowrap text-center font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 9vw, 7rem)' }}
          >
            {storeName}
          </h1>
        </FadeIn>

        {/* Bottom bar */}
        <div className="relative z-10 mt-auto flex items-end justify-between gap-4 pb-8 pt-10">
          <FadeIn delay={0.35} y={20}>
            <p className="max-w-[180px] text-[clamp(0.75rem,1.4vw,1.25rem)] font-light uppercase leading-snug tracking-wide text-[#D7E2EA] sm:max-w-[240px]">
              Una experiencia de compra hecha para sorprender y deleitar
            </p>
          </FadeIn>
          <FadeIn delay={0.5} y={20}>
            <GradientPill onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}>
              Explorar <ArrowDown className="h-4 w-4" />
            </GradientPill>
          </FadeIn>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────── */}
      {allProducts.length > 2 && (
        <section className="pt-12">
          <ProductMarquee products={allProducts.filter((p) => p.imagenUrl).slice(0, 12)} />
        </section>
      )}

      {/* ── Brand / about ────────────────────────────────────── */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-12 py-24 text-center">
        <FadeIn y={40}>
          <h2 className="hero-heading font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2rem, 8vw, 96px)' }}
          >
            {storeName}
          </h2>
        </FadeIn>
        <AnimatedText
          text={`En ${storeName} seleccionamos cada producto con intención: calidad, diseño y una entrega impecable. Descubre piezas pensadas para quienes buscan destacar. Construyamos algo increíble juntos.`}
          className="max-w-[560px] text-[clamp(1rem,2vw,1.35rem)] font-medium leading-relaxed text-[#D7E2EA]"
        />
      </section>

      {/* ── Stacking showcase ────────────────────────────────── */}
      {showcase.length >= 1 && (
        <section className="pb-16">
          <FadeIn y={30} className="mb-10 flex items-end justify-between gap-4">
            <h2 className="hero-heading font-black uppercase leading-none tracking-tight"
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
            addingId={addingId}
            onAddToCart={addToCart}
            onNavigate={goToProduct}
          />
        </section>
      )}

      {/* ── Full catalog ─────────────────────────────────────── */}
      <section id="catalogo" className="scroll-mt-24 pt-12">
        <FadeIn y={30} className="mb-8">
          <h2 className="hero-heading font-black uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2rem, 9vw, 110px)' }}
          >
            Catálogo
          </h2>
        </FadeIn>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className="w-full rounded-full border border-white/12 bg-white/5 py-3.5 pl-11 pr-4 text-sm uppercase tracking-wide text-[#D7E2EA] placeholder:text-white/30 transition-colors focus:border-[#B600A8]/60 focus:outline-none"
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar producto"
            />
          </div>
        </div>

        {/* Category chips */}
        {categorias.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            <Chip active={categoriaId == null} onClick={() => setCategoriaId(null)}>
              Todo
            </Chip>
            {categorias.map((c) => (
              <Chip key={c.id} active={categoriaId === c.id} onClick={() => setCategoriaId(c.id)}>
                {c.nombre}
              </Chip>
            ))}
          </div>
        )}

        {/* States */}
        {loading && <SkeletonGrid />}

        {error && !loading && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 py-16 text-center">
            <p className="text-sm text-red-300/80">{error}</p>
            <button
              onClick={() => {
                tiendasState.reload();
                catalogoState.reload();
                productosState.reload();
              }}
              className="rounded-full bg-red-500/15 px-5 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/25"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  addingId={addingId}
                  onAddToCart={addToCart}
                  onNavigate={goToProduct}
                />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}

// ── Support ──────────────────────────────────────────────────

function Chip({
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
        'cursor-pointer rounded-full px-5 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-200',
        active
          ? 'border-2 border-[#D7E2EA] bg-[#D7E2EA] text-[#0C0C0C]'
          : 'border-2 border-white/15 text-[#D7E2EA]/70 hover:border-[#D7E2EA]/50 hover:text-[#D7E2EA]',
      )}
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/8" />
      ))}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/30 ring-1 ring-white/10">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <p className="font-medium uppercase tracking-wide text-[#D7E2EA]/70">Sin coincidencias</p>
      <p className="mt-1 text-sm text-white/35">Prueba con otro filtro o término de búsqueda.</p>
    </div>
  );
}
