import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { tiendasApi } from '@/api/tiendas';
import { cn } from '@/lib/cn';
import { IconCart, IconStore, IconReceipt, IconLogout, IconUser } from '@/components/icons';
import type { Tienda } from '@/types';

export default function TiendaLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    tiendasApi.obtener(user.tiendaId).then(setTienda).catch(() => setTienda(null));
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/tienda" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <IconStore className="h-5 w-5" />
            </span>
            <span className="truncate text-base font-semibold text-slate-900">{tienda?.nombre ?? 'Mi tienda'}</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <NavLink
              to="/tienda"
              end
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/tienda/pedidos"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              Mis pedidos
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/tienda/carrito"
              className="relative cursor-pointer rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label={`Carrito, ${itemCount} artículo(s)`}
            >
              <IconCart />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cta-500 px-1 text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={() => window.setTimeout(() => setMenuOpen(false), 150)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 transition-colors hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {(user?.nombre ?? '?').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 sm:block">{user?.nombre}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-soft animate-fade-in">
                  <button
                    onClick={() => navigate('/tienda/pedidos')}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <IconReceipt className="h-4 w-4" /> Mis pedidos
                  </button>
                  <button
                    onClick={() => navigate('/tienda/carrito')}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 sm:hidden"
                  >
                    <IconCart className="h-4 w-4" /> Carrito
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => logout()}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <IconLogout className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-sm text-slate-400 sm:px-6">
          <span className="flex items-center gap-1.5">
            <IconUser className="h-4 w-4" /> {user?.email}
          </span>
          <span>© {new Date().getFullYear()} {tienda?.nombre ?? 'MultiTienda'}</span>
        </div>
      </footer>
    </div>
  );
}
