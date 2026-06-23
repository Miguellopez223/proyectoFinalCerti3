import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/cn';
import { IconCart, IconStore, IconReceipt, IconLogout, IconUser } from '@/components/icons';

export default function TiendaLayout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="tienda-bg flex min-h-screen flex-col">
      {/* Navbar glassmorphism */}
      <header
        className={cn(
          'sticky top-0 z-30 transition-all duration-500',
          scrolled
            ? 'border-b border-white/10 bg-black/40 shadow-xl shadow-black/30 backdrop-blur-2xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link to="/tienda" className="group flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-[#c4631d]/40 transition-transform duration-200 group-hover:scale-105"
              style={{ background: 'linear-gradient(123deg, #7a3310 0%, #c4631d 55%, #e7a149 100%)' }}
            >
              <IconStore className="h-5 w-5" />
            </span>
            <span className="truncate text-base font-semibold uppercase tracking-wide text-[#D7E2EA] drop-shadow">
              EcommerceUPB
            </span>
          </Link>

          {/* Nav links */}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <NavLink
              to="/tienda"
              end
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-[#D7E2EA]'
                    : 'text-[#D7E2EA]/55 hover:text-[#D7E2EA]',
                )
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/tienda/pedidos"
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium uppercase tracking-wider transition-all duration-200',
                  isActive
                    ? 'bg-white/10 text-[#D7E2EA]'
                    : 'text-[#D7E2EA]/55 hover:text-[#D7E2EA]',
                )
              }
            >
              Mis pedidos
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/tienda/carrito"
              className="relative cursor-pointer rounded-xl p-2.5 text-white/70 transition-all duration-200 hover:bg-white/15 hover:text-white"
              aria-label={`Carrito, ${itemCount} artículo(s)`}
            >
              <IconCart />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-cta-500 to-cta-600 px-1 text-xs font-bold text-white shadow-lg shadow-cta-500/50">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={() => window.setTimeout(() => setMenuOpen(false), 150)}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-1 pr-2.5 backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #c4631d 0%, #e7a149 100%)' }}
                >
                  {(user?.nombre ?? '?').charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-white/85 sm:block">
                  {user?.nombre}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 py-1 shadow-2xl shadow-black/60 backdrop-blur-2xl animate-fade-in">
                  <button
                    onClick={() => navigate('/tienda/pedidos')}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <IconReceipt className="h-4 w-4" /> Mis pedidos
                  </button>
                  <button
                    onClick={() => navigate('/tienda/carrito')}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
                  >
                    <IconCart className="h-4 w-4" /> Carrito
                  </button>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => logout()}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <IconLogout className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 bg-black/20 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-1.5 text-sm text-white/35">
            <IconUser className="h-4 w-4" />
            {user?.email}
          </span>
          <span className="text-sm text-white/35">
            © {new Date().getFullYear()} EcommerceUPB
          </span>
        </div>
      </footer>
    </div>
  );
}