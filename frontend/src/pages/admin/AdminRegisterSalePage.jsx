import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { addItemToCart, getCartByUser, removeCartItem } from "../../services/cartService";
import { listCategoriesByStore } from "../../services/categoryService";
import { createOrderFromCart } from "../../services/orderService";
import { registerPayment } from "../../services/paymentService";
import { listProductsByStore } from "../../services/productService";
import { currency } from "../../utils/format";

export function AdminRegisterSalePage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        const [productData, categoryData] = await Promise.all([
          listProductsByStore(storeId, session.token),
          listCategoriesByStore(storeId, session.token)
        ]);
        if (!ignore) {
          setProducts(productData.filter((product) => Number(product.stock || 0) > 0));
          setCategories(categoryData);
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

    run();
    return () => {
      ignore = true;
    };
  }, [session.token, storeId]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.nombre, product.categoriaNombre].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || Number(product.categoriaId) === Number(categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, products, search]);

  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  function addLocalItem(product) {
    setItems((current) => {
      const found = current.find((item) => item.productoId === product.id);
      if (found) {
        return current.map((item) =>
          item.productoId === product.id ? { ...item, cantidad: Math.min(item.cantidad + 1, Number(product.stock || 1)) } : item
        );
      }
      return [
        ...current,
        {
          productoId: product.id,
          nombre: product.nombre,
          precio: Number(product.precio || 0),
          stock: Number(product.stock || 0),
          cantidad: 1
        }
      ];
    });
  }

  function updateQuantity(productId, nextQuantity) {
    setItems((current) =>
      current
        .map((item) =>
          item.productoId === productId
            ? { ...item, cantidad: Math.max(1, Math.min(Number(nextQuantity || 1), item.stock)) }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  }

  async function clearBackendCart() {
    const cart = await getCartByUser(storeId, session.userId, session.token);
    if (!cart.id || !cart.items.length) {
      return;
    }

    for (const item of cart.items) {
      await removeCartItem(cart.id, item.id, session.token);
    }
  }

  async function confirmSale() {
    if (!items.length) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await clearBackendCart();

      for (const item of items) {
        await addItemToCart(
          {
            tiendaId: Number(storeId),
            usuarioId: session.userId,
            productoId: item.productoId,
            cantidad: item.cantidad
          },
          session.token
        );
      }

      const order = await createOrderFromCart({ tiendaId: Number(storeId), usuarioId: session.userId }, session.token);
      await registerPayment({ pedidoId: order.id, metodo: paymentMethod, monto: order.total }, session.token);
      setSuccessOrder(order);
      setItems([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (successOrder) {
    return (
      <div className="admin-stack">
        <div className="admin-card success-panel">
          <h2>Venta registrada</h2>
          <p>
            Pedido #{successOrder.id} por <strong>{currency(successOrder.total)}</strong>.
          </p>
          <div className="button-row">
            <button className="admin-primary" type="button" onClick={() => setSuccessOrder(null)}>
              Nueva venta
            </button>
            <Link className="admin-secondary" to="../ventas">
              Ver historial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Registrar venta</h2>
          <p>Selecciona productos y confirma el pago.</p>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="sale-grid">
        <section className="admin-stack">
          <div className="admin-filters">
            <input placeholder="Buscar producto..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </div>

          {loading ? <div className="admin-card">Cargando productos...</div> : null}
          <div className="sale-product-grid">
            {visibleProducts.map((product) => (
              <article className="sale-product-card" key={product.id} onClick={() => addLocalItem(product)}>
                {product.imagenUrl ? <img alt={product.nombre} src={product.imagenUrl} /> : <div className="sale-image-placeholder">{product.nombre?.slice(0, 1)}</div>}
                <div>
                  <strong>{product.nombre}</strong>
                  <span>{product.categoriaNombre || "Sin categoria"}</span>
                  <footer>
                    <b>{currency(product.precio)}</b>
                    <small>{product.stock} uds</small>
                  </footer>
                </div>
              </article>
            ))}
            {!visibleProducts.length && !loading ? <div className="admin-card">No hay productos disponibles.</div> : null}
          </div>
        </section>

        <aside className="admin-card sale-cart">
          <div className="card-title-row">
            <div>
              <h3>Carrito</h3>
              <p>{items.length} producto(s)</p>
            </div>
          </div>

          <div className="compact-list">
            {items.map((item) => (
              <div className="sale-cart-item" key={item.productoId}>
                <div>
                  <strong>{item.nombre}</strong>
                  <span>{currency(item.precio)}</span>
                </div>
                <div className="qty-control">
                  <button type="button" onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}>
                    -
                  </button>
                  <b>{item.cantidad}</b>
                  <button type="button" onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}>
                    +
                  </button>
                </div>
                <strong>{currency(item.precio * item.cantidad)}</strong>
              </div>
            ))}
            {!items.length ? <p className="empty-copy">Selecciona productos del catalogo.</p> : null}
          </div>

          <label className="payment-label">
            Metodo de pago
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="QR">QR</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </label>

          <div className="sale-total">
            <span>Total</span>
            <strong>{currency(total)}</strong>
          </div>

          <button className="admin-primary block-button" disabled={!items.length || submitting} type="button" onClick={confirmSale}>
            {submitting ? "Procesando..." : `Confirmar venta - ${currency(total)}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
