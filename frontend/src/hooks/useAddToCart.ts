import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { carritoApi } from '@/api/carrito';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import type { Producto } from '@/types';

/**
 * Agrega un producto al carrito de SU tienda (marketplace multi-tienda), refresca y abre
 * el drawer. Si no hay sesión de CLIENTE, redirige al login.
 */
export function useAddToCart() {
  const { user } = useAuth();
  const { refresh, openDrawer } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  return useCallback(
    async (producto: Producto, cantidad = 1) => {
      if (!user || user.rol !== 'CLIENTE') {
        navigate('/login', { state: { from: `/tienda/producto/${producto.id}` } });
        return;
      }
      try {
        await carritoApi.agregarItem({
          tiendaId: producto.tiendaId,
          usuarioId: user.userId,
          productoId: producto.id,
          cantidad,
        });
        await refresh();
        openDrawer();
        toast.success('Agregado al carrito.');
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [user, refresh, openDrawer, toast, navigate],
  );
}
