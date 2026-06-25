import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useDebounced } from '@/hooks/useDebounced';
import { marketplaceApi } from '@/api/marketplace';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
import { Footer } from '@/components/marketplace/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { CategoriaPopular, Producto } from '@/types';

/**
 * Layout del marketplace (Klikea): navbar con menú de categorías, buscador global con
 * sugerencias, cuenta y carrito (drawer). Estructura mínima; el estilo lo pulirá un colaborador.
 */
export default function MarketplaceLayout() {
  const { user, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const navigate = useNavigate();

  const [catOpen, setCatOpen] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaPopular[]>([]);

  const [term, setTerm] = useState('');
  const debounced = useDebounced(term, 250);
  const [sugerencias, setSugerencias] = useState<Producto[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marketplaceApi.categoriasPopulares(12).then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setSugerencias([]);
      return;
    }
    marketplaceApi.sugerencias(q, 6).then(setSugerencias).catch(() => setSugerencias([]));
  }, [debounced]);

  // Cierra el dropdown de sugerencias al hacer click afuera.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSugOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function buscar(q: string) {
    const limpio = q.trim();
    if (!limpio) return;
    setSugOpen(false);
    setCatOpen(false);
    navigate(`/tienda/buscar?q=${encodeURIComponent(limpio)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    buscar(term);
  }

  return (
    <div className="tienda-bg flex min-h-screen flex-col text-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0c0c0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            to="/tienda"
            className="shrink-0 text-2xl font-black uppercase text-[#ff7a1a] drop-shadow-[0_0_16px_rgba(255,122,26,0.35)] sm:text-3xl"
          >
            Klikea
          </Link>

          {/* Menú Categorías */}
          <div className="relative">
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10 sm:flex"
            >
              Categorías <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 max-h-80 w-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#101014]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {categorias.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Sin categorías</p>}
                {categorias.map((c) => (
                  <button
                    key={c.nombre}
                    onClick={() => buscar(c.nombre)}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {c.nombre} <span className="text-slate-500">({c.cantidad})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buscador global con sugerencias */}
          <div ref={searchRef} className="relative flex-1">
            <form onSubmit={onSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={term}
                  onChange={(e) => { setTerm(e.target.value); setSugOpen(true); }}
                  onFocus={() => setSugOpen(true)}
                  placeholder="¿Qué estás buscando? Productos · Marcas · Comida"
                  className="mk-input py-2.5 pl-11 pr-4 text-sm"
                  aria-label="Buscar"
                />
              </div>
            </form>
            {sugOpen && sugerencias.length > 0 && (
              <div className="absolute left-0 top-full z-40 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#101014]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {sugerencias.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSugOpen(false); navigate(`/tienda/producto/${p.id}`); }}
                    className="block w-full truncate rounded-xl px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {p.nombre} <span className="text-slate-500">· {p.tiendaNombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cuenta */}
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link to="/tienda/pedidos" className="text-sm text-slate-300 transition-colors hover:text-white">Mis pedidos</Link>
              <button onClick={() => logout()} className="text-sm text-slate-400 transition-colors hover:text-rose-400">Salir</button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: '/tienda' } })}
              className="hidden items-center gap-1.5 text-sm text-slate-200 transition-colors hover:text-white sm:flex"
            >
              <User className="h-4 w-4" /> Iniciar sesión
            </button>
          )}

          {/* Modo oscuro / claro */}
          <ThemeToggle className="h-10 w-10 shrink-0" />

          {/* Carrito */}
          <button onClick={openDrawer} className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-200 transition-colors hover:border-white/20 hover:bg-white/10" aria-label={`Carrito, ${itemCount} artículos`}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cta-500 to-cta-600 px-1 text-[10px] font-bold text-white shadow-lg shadow-cta-900/40">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
    </div>
  );
}
