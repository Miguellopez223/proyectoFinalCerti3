import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCartByUser, removeCartItem } from "../services/cartService";
import { currency } from "../utils/format";

export function CartPage() {
  const { storeId } = useParams();
  const numericStoreId = Number(storeId);
  const { isAuthenticated, session } = useAuth();
  const [cart, setCart] = useState({ id: null, totalEstimado: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItem, setBusyItem] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || Number(session?.storeId) !== numericStoreId || !session?.userId) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadCart() {
      try {
        setLoading(true);
        const data = await getCartByUser(numericStoreId, session.userId, session.token);
        if (!ignore) {
          setCart(data);
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

    loadCart();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, numericStoreId, session?.storeId, session?.token, session?.userId]);

  async function handleRemove(itemId) {
    if (!cart.id) {
      return;
    }

    setBusyItem(itemId);
    setError("");
    try {
      const updated = await removeCartItem(cart.id, itemId, session.token);
      setCart(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="catalog-shell">
      <div className="catalog-container detail-page">
        <div className="detail-header">
          <div>
            <span className="hero-badge">Carrito</span>
            <h1 className="hero-title small-title">Resumen de compra</h1>
            <p className="hero-description">Revisa los productos agregados antes de continuar con el pedido.</p>
          </div>
          <Link className="header-button" to={`/tiendas/${numericStoreId}`}>
            Volver al catalogo
          </Link>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {loading ? <div className="empty-state-dark">Cargando carrito...</div> : null}

        {!loading && !cart.items.length ? (
          <div className="empty-state-dark">El carrito no tiene productos registrados.</div>
        ) : null}

        {!loading && cart.items.length ? (
          <div className="detail-card">
            <div className="detail-card-header">
              <h2>Productos seleccionados</h2>
              <strong>{currency(cart.totalEstimado)}</strong>
            </div>
            <div className="detail-list">
              {cart.items.map((item) => (
                <div className="detail-item" key={item.id}>
                  <div>
                    <h3>{item.productoNombre}</h3>
                    <p>
                      Cantidad: {item.cantidad} / Precio unitario: {currency(item.precioUnitario)}
                    </p>
                  </div>
                  <div className="detail-item-actions">
                    <strong>{currency(item.subtotal)}</strong>
                    <button className="remove-link" disabled={busyItem === item.id} type="button" onClick={() => handleRemove(item.id)}>
                      {busyItem === item.id ? "Quitando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
