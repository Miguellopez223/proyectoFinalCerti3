import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listMovementsByStore } from "../../services/inventoryService";
import { listOrdersByUser } from "../../services/orderService";
import { listProductsByStore } from "../../services/productService";
import { currency } from "../../utils/format";

export function AdminDashboardPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        const [productData, movementData, orderData] = await Promise.all([
          listProductsByStore(storeId, session.token),
          listMovementsByStore(storeId, session.token),
          listOrdersByUser(storeId, session.userId, session.token)
        ]);

        if (!ignore) {
          setProducts(productData);
          setMovements(movementData);
          setOrders(orderData);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [session.token, session.userId, storeId]);

  const stats = useMemo(() => {
    const sinStock = products.filter((product) => Number(product.stock || 0) <= 0).length;
    const stockBajo = products.filter((product) => {
      const stock = Number(product.stock || 0);
      const minimo = Number(product.stockMinimo || 0);
      return stock > 0 && minimo > 0 && stock <= minimo;
    }).length;
    const ingresos = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      totalProductos: products.length,
      totalMovimientos: movements.length,
      sinStock,
      stockBajo,
      ventas: orders.length,
      ingresos
    };
  }, [movements.length, orders, products]);

  const alertas = products
    .filter((product) => Number(product.stock || 0) <= Number(product.stockMinimo || 0))
    .slice(0, 6);

  const ultimasVentas = [...orders].slice(-6).reverse();

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen operativo de inventario y ventas.</p>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="admin-card">Cargando informacion...</div> : null}

      <div className="stat-grid">
        <div className="stat-card">
          <span>Total productos</span>
          <strong>{stats.totalProductos}</strong>
          <small>en inventario</small>
        </div>
        <div className="stat-card">
          <span>Movimientos</span>
          <strong>{stats.totalMovimientos}</strong>
          <small>entradas y salidas</small>
        </div>
        <div className={stats.sinStock ? "stat-card warning" : "stat-card"}>
          <span>Sin stock</span>
          <strong>{stats.sinStock}</strong>
          <small>productos agotados</small>
        </div>
        <div className={stats.stockBajo ? "stat-card amber" : "stat-card"}>
          <span>Stock bajo</span>
          <strong>{stats.stockBajo}</strong>
          <small>por reponer</small>
        </div>
      </div>

      <div className="stat-grid two">
        <div className="metric-card blue">
          <span>Ventas registradas</span>
          <strong>{stats.ventas}</strong>
          <small>pedidos del usuario actual</small>
        </div>
        <div className="metric-card green">
          <span>Ingresos registrados</span>
          <strong>{currency(stats.ingresos)}</strong>
          <small>segun pedidos disponibles</small>
        </div>
      </div>

      <div className="admin-two-columns">
        <div className="admin-card">
          <div className="card-title-row">
            <div>
              <h3>Alertas de stock</h3>
              <p>Productos que requieren reposicion.</p>
            </div>
            <Link to="productos">Ver todos</Link>
          </div>
          <div className="compact-list">
            {alertas.length ? (
              alertas.map((product) => (
                <div className="compact-row" key={product.id}>
                  <div>
                    <strong>{product.nombre}</strong>
                    <span>{product.categoriaNombre || "Sin categoria"}</span>
                  </div>
                  <b>{product.stock} uds</b>
                </div>
              ))
            ) : (
              <p className="empty-copy">Inventario en buen estado.</p>
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="card-title-row">
            <div>
              <h3>Ultimas ventas</h3>
              <p>Pedidos recientes registrados.</p>
            </div>
            <Link to="ventas">Ver todas</Link>
          </div>
          <div className="compact-list">
            {ultimasVentas.length ? (
              ultimasVentas.map((order) => (
                <div className="compact-row" key={order.id}>
                  <div>
                    <strong>Pedido #{order.id}</strong>
                    <span>{order.estadoPedido || "PENDIENTE"}</span>
                  </div>
                  <b>{currency(order.total)}</b>
                </div>
              ))
            ) : (
              <p className="empty-copy">Sin ventas registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
