import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { carritoApi } from '@/api/carrito';
import { useAuth } from './AuthContext';
import type { Carrito } from '@/types';

interface CartContextValue {
  /** Carritos activos del usuario (uno por tienda) — marketplace multi-tienda. */
  carritos: Carrito[];
  /** Compat: primer carrito activo (las páginas single-store lo usan). */
  cart: Carrito | null;
  /** Total de ítems sumando todas las tiendas (badge del navbar). */
  itemCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Compat: reemplaza/actualiza un carrito en la lista; null = re-cargar del servidor. */
  setCart: (cart: Carrito | null) => void;
  // Drawer lateral
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Mantiene los carritos activos del CLIENTE (multi-tienda) y el estado del drawer.
 * Solo aplica al storefront; el ADMIN no lo usa.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [carritos, setCarritos] = useState<Carrito[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.rol !== 'CLIENTE') {
      setCarritos([]);
      return;
    }
    setLoading(true);
    try {
      const data = await carritoApi.listarActivos(user.userId);
      setCarritos(data.filter((c) => c.items && c.items.length > 0));
    } catch {
      setCarritos([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Compat con páginas single-store: reemplaza un carrito ya cargado (o re-carga si es null).
  const setCart = useCallback(
    (c: Carrito | null) => {
      if (c == null) {
        void refresh();
        return;
      }
      setCarritos((prev) => {
        const otros = prev.filter((x) => x.id !== c.id);
        return c.items && c.items.length > 0 ? [c, ...otros] : otros;
      });
    },
    [refresh],
  );

  const itemCount = useMemo(
    () =>
      carritos.reduce(
        (sum, c) => sum + (c.items?.reduce((a, it) => a + (it.cantidad ?? 0), 0) ?? 0),
        0,
      ),
    [carritos],
  );

  const cart = carritos[0] ?? null;
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({ carritos, cart, itemCount, loading, refresh, setCart, drawerOpen, openDrawer, closeDrawer }),
    [carritos, cart, itemCount, loading, refresh, setCart, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
