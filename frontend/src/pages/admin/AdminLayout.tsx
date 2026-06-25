import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { tiendasApi } from '@/api/tiendas';
import { useAsync } from '@/hooks/useAsync';
import { cn } from '@/lib/cn';
import {
  IconDashboard,
  IconBox,
  IconTag,
  IconRuler,
  IconUsers,
  IconWarehouse,
  IconReceipt,
  IconChart,
  IconLogout,
  IconMenu,
  IconClose,
  IconStore,
} from '@/components/icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  end?: boolean;
}

const nav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: IconBox },
  { to: '/admin/categorias', label: 'Categorías', icon: IconTag },
  { to: '/admin/unidades', label: 'Unidades de medida', icon: IconRuler },
  { to: '/admin/clientes', label: 'Clientes', icon: IconUsers },
  { to: '/admin/inventario', label: 'Inventario', icon: IconWarehouse },
  { to: '/admin/pedidos', label: 'Pedidos', icon: IconReceipt },
  { to: '/admin/reportes', label: 'Reportes', icon: IconChart },
  { to: '/admin/mi-tienda', label: 'Mi tienda', icon: IconStore },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const tiendaId = user!.tiendaId;
  const { data: tienda } = useAsync(() => tiendasApi.obtener(tiendaId), [tiendaId]);

  const initials = (user?.nombre ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img src="/logo-klikea.png" alt="Klikea" className="h-12 w-20 rounded-md object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Klikea</p>
          <p className="text-xs text-[#e7a149]">Panel del dueño</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#e7a149]/15 text-[#f0a955]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => logout()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <IconLogout className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn('admin-shell min-h-screen lg:flex', theme === 'dark' && 'admin-dark')}>
      {/* Sidebar fijo en desktop */}
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">{sidebar}</aside>

      {/* Sidebar móvil (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="admin-sidebar absolute inset-y-0 left-0 w-64 border-r animate-slide-in">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="admin-topbar sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b px-4 backdrop-blur-xl sm:px-6">
          <button
            className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
          <div className="flex flex-1 items-center justify-end gap-3">
            <span className="hidden truncate text-sm text-slate-400 sm:block">{tienda?.nombre ?? ''}</span>
            <ThemeToggle className="h-9 w-9 shrink-0" />
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-slate-800">{user?.nombre}</p>
                <p className="text-xs text-slate-400">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
