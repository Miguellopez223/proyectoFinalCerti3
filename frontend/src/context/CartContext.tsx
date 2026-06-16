import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { carritoApi } from '@/api/carrito';
import { useAuth } from './AuthContext';
import type { Carrito } from '@/types';

interface CartContextValue {
  cart: Carrito | null;
  itemCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  setCart: (cart: Carrito | null) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Mantiene el carrito activo del CLIENTE para mostrar el contador en el header.
 * Solo aplica al storefront; el ADMIN no lo usa.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Carrito | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.rol !== 'CLIENTE') return;
    setLoading(true);
    try {
      const data = await carritoApi.obtenerActivo(user.tiendaId, user.userId);
      setCart(data);
    } catch {
      // Si no hay carrito todavía, lo dejamos en null silenciosamente.
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const itemCount = useMemo(
    () => cart?.items?.reduce((sum, it) => sum + (it.cantidad ?? 0), 0) ?? 0,
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({ cart, itemCount, loading, refresh, setCart }),
    [cart, itemCount, loading, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
