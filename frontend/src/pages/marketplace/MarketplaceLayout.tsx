import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useDebounced } from '@/hooks/useDebounced';
import { marketplaceApi } from '@/api/marketplace';
import { CartDrawer } from '@/components/marketplace/CartDrawer';
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/tienda" className="text-xl font-bold text-slate-900">Klikea</Link>

          {/* Menú Categorías */}
          <div className="relative">
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex"
            >
              Categorías <ChevronDown className="h-4 w-4" />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-40 mt-1 max-h-80 w-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {categorias.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">Sin categorías</p>}
                {categorias.map((c) => (
                  <button
                    key={c.nombre}
                    onClick={() => buscar(c.nombre)}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {c.nombre} <span className="text-slate-400">({c.cantidad})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buscador global con sugerencias */}
          <div ref={searchRef} className="relative flex-1">
            <form onSubmit={onSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={term}
                  onChange={(e) => { setTerm(e.target.value); setSugOpen(true); }}
                  onFocus={() => setSugOpen(true)}
                  placeholder="¿Qué estás buscando? Productos - Marcas - Comida"
                  className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-slate-400 focus:outline-none"
                  aria-label="Buscar"
                />
              </div>
            </form>
            {sugOpen && sugerencias.length > 0 && (
              <div className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {sugerencias.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSugOpen(false); navigate(`/tienda/producto/${p.id}`); }}
                    className="block w-full truncate px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {p.nombre} <span className="text-slate-400">· {p.tiendaNombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cuenta */}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/tienda/pedidos" className="text-sm text-slate-600 hover:text-slate-900">Mis pedidos</Link>
              <button onClick={() => logout()} className="text-sm text-slate-500 hover:text-red-600">Salir</button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login', { state: { from: '/tienda' } })}
              className="hidden items-center gap-1 text-sm text-slate-700 hover:text-slate-900 sm:flex"
            >
              <User className="h-4 w-4" /> Iniciar sesión
            </button>
          )}

          {/* Carrito */}
          <button onClick={openDrawer} className="relative rounded-md p-2 text-slate-700 hover:bg-slate-100" aria-label={`Carrito, ${itemCount} artículos`}>
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      {/* Footer mínimo (el footer completo de soporte va en la Fase 6) */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-sm text-slate-400 sm:px-6">
          © {new Date().getFullYear()} Klikea
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
