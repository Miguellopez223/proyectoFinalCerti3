import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { CartProvider } from './context/CartContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PublicCatalogPage from './pages/PublicCatalogPage';
import NotFoundPage from './pages/NotFoundPage';

import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import ProductosPage from './pages/admin/ProductosPage';
import CategoriasPage from './pages/admin/CategoriasPage';
import UnidadesPage from './pages/admin/UnidadesPage';
import ClientesPage from './pages/admin/ClientesPage';
import InventarioPage from './pages/admin/InventarioPage';
import PedidosPage from './pages/admin/PedidosPage';
import ReportesPage from './pages/admin/ReportesPage';

import TiendaLayout from './pages/tienda/TiendaLayout';
import CatalogoPage from './pages/tienda/CatalogoPage';
import ProductoDetallePage from './pages/tienda/ProductoDetallePage';
import CarritoPage from './pages/tienda/CarritoPage';
import CheckoutPage from './pages/tienda/CheckoutPage';
import MisPedidosPage from './pages/tienda/MisPedidosPage';

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/catalogo/:slug" element={<PublicCatalogPage />} />

      {/* Panel ADMIN */}
      <Route element={<ProtectedRoute rol="ADMIN" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="categorias" element={<CategoriasPage />} />
          <Route path="unidades" element={<UnidadesPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="reportes" element={<ReportesPage />} />
        </Route>
      </Route>

      {/* Storefront publico: el login se pide recien al comprar/ver carrito. */}
      <Route
        path="/tienda"
        element={
          <CartProvider>
            <TiendaLayout />
          </CartProvider>
        }
      >
        <Route index element={<CatalogoPage />} />
        <Route path="producto/:productoId" element={<ProductoDetallePage />} />

        <Route element={<ProtectedRoute rol="CLIENTE" />}>
          <Route path="carrito" element={<CarritoPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedidos" element={<MisPedidosPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/tienda" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
