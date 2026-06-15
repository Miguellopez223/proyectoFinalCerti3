import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { addItemToCart, getCartByUser, removeCartItem } from "../services/cartService";
import { listCategoriesByStore } from "../services/categoryService";
import { listProductsByStore } from "../services/productService";
import { getStoreById, listStores } from "../services/storeService";
import { currency } from "../utils/format";

const EMPTY_CART = {
  id: null,
  totalEstimado: 0,
  items: []
};

function sanitizePhone(phone) {
  return (phone || "").replace(/[^0-9]/g, "");
}

function buildWhatsAppUrl(storeName, phone, items) {
  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone || !items.length) {
    return "#";
  }

  let message = `Hola ${storeName}, quiero realizar el siguiente pedido:%0A%0A`;
  items.forEach((item) => {
    message += `- ${item.productoNombre} x${item.cantidad} = ${currency(item.subtotal)}%0A`;
  });
  message += `%0ATotal: ${currency(items.reduce((total, item) => total + Number(item.subtotal || 0), 0))}`;
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

export function StorePage() {
  const { storeId } = useParams();
  const numericStoreId = Number(storeId);
  const { isAuthenticated, session, signOut } = useAuth();
  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [cartError, setCartError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("nombre");
  const [quantities, setQuantities] = useState({});
  const [feedback, setFeedback] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartBusyItem, setCartBusyItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(EMPTY_CART);

  const canAccessCatalog = isAuthenticated && Number(session?.storeId) === numericStoreId;

  useEffect(() => {
    let ignore = false;

    async function loadStore() {
      try {
        const data = await getStoreById(numericStoreId);
        if (!ignore) {
          setStore(data);
        }
      } catch {
        const allStores = await listStores();
        const found = allStores.find((item) => Number(item.id) === numericStoreId);
        if (!ignore) {
          setStore(found ?? null);
        }
      }
    }

    loadStore();
    return () => {
      ignore = true;
    };
  }, [numericStoreId]);

  useEffect(() => {
    if (!canAccessCatalog || !session?.token || !session?.userId) {
      setLoading(false);
      setCart(EMPTY_CART);
      return;
    }

    let ignore = false;

    async function loadCatalog() {
      try {
        setLoading(true);
        const [categoriesData, productsData] = await Promise.all([
          listCategoriesByStore(numericStoreId, session.token),
          listProductsByStore(numericStoreId, session.token)
        ]);

        if (!ignore) {
          setCategories(categoriesData);
          setProducts(productsData);
          setCatalogError("");
        }
      } catch (err) {
        if (!ignore) {
          setCatalogError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    async function loadCart() {
      try {
        const data = await getCartByUser(numericStoreId, session.userId, session.token);
        if (!ignore) {
          setCart(data);
          setCartError("");
        }
      } catch {
        if (!ignore) {
          setCart(EMPTY_CART);
        }
      }
    }

    loadCatalog();
    loadCart();
    return () => {
      ignore = true;
    };
  }, [canAccessCatalog, numericStoreId, session?.token, session?.userId]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchCategory = selectedCategory === "all" || Number(product.categoriaId) === Number(selectedCategory);
      const haystack = [product.nombre, product.categoriaNombre, product.descripcionLarga, product.slugProducto]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchCategory && (!query || haystack.includes(query));
    });

    return [...filtered].sort((left, right) => {
      if (sortOrder === "precio_asc") {
        return Number(left.precio) - Number(right.precio);
      }
      if (sortOrder === "precio_desc") {
        return Number(right.precio) - Number(left.precio);
      }
      return String(left.nombre).localeCompare(String(right.nombre));
    });
  }, [products, search, selectedCategory, sortOrder]);

  const cartCount = useMemo(
    () => cart.items.reduce((total, item) => total + Number(item.cantidad || 0), 0),
    [cart.items]
  );

  async function handleAddToCart(product) {
    const quantity = Number(quantities[product.id] ?? 1);
    setAddingProductId(product.id);
    setFeedback("");
    setCartError("");

    try {
      const updatedCart = await addItemToCart(
        {
          tiendaId: numericStoreId,
          usuarioId: session.userId,
          productoId: product.id,
          cantidad: quantity
        },
        session.token
      );
      setCart(updatedCart);
      setFeedback("Producto agregado al carrito.");
      setCartOpen(true);
    } catch (err) {
      setFeedback("");
      setCartError(err.message);
    } finally {
      setAddingProductId(null);
    }
  }

  async function handleRemoveCartItem(itemId) {
    if (!cart.id) {
      return;
    }

    setCartBusyItem(itemId);
    setCartError("");
    try {
      const updatedCart = await removeCartItem(cart.id, itemId, session.token);
      setCart(updatedCart);
    } catch (err) {
      setCartError(err.message);
    } finally {
      setCartBusyItem(null);
    }
  }

  return (
    <div className="catalog-shell">
      <header className="catalog-header">
        <div className="catalog-header-inner">
          <Link className="catalog-brand" to={`/tiendas/${numericStoreId}`}>
            <span className="catalog-brand-icon">CW</span>
            <span>{store?.nombre ?? "Catalogo"}</span>
          </Link>

          <div className="catalog-header-actions">
            {canAccessCatalog ? (
              <button className="cart-trigger" type="button" onClick={() => setCartOpen(true)}>
                <span>Carrito</span>
                {cartCount ? <strong>{cartCount}</strong> : null}
              </button>
            ) : (
              <Link className="header-button" to={`/tiendas/${numericStoreId}/login`}>
                Iniciar sesion
              </Link>
            )}
            {canAccessCatalog ? (
              <button className="header-button" type="button" onClick={signOut}>
                Cerrar sesion
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section className="catalog-hero">
        <div className="catalog-container catalog-hero-grid">
          <div>
            <span className="hero-badge">Catalogo en linea</span>
            <h1 className="hero-title">{store?.nombre ?? "Catalogo"}</h1>
            <p className="hero-description">
              Consulta productos, revisa disponibilidad y registra pedidos desde una sola tienda principal.
            </p>
            <div className="hero-stats">
              <div>
                <strong>{products.length}</strong>
                <span>Productos</span>
              </div>
              <div>
                <strong>{categories.length}</strong>
                <span>Categorias</span>
              </div>
              <div>
                <strong>{cartCount}</strong>
                <span>Items en carrito</span>
              </div>
            </div>
          </div>

          <div className="hero-search-card">
            <label>
              <span>Buscar productos</span>
              <input
                className="search-input-dark"
                placeholder="Nombre, categoria o descripcion"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      {!canAccessCatalog ? (
        <main className="catalog-container catalog-locked">
          <div className="catalog-locked-card">
            <h2>Acceso restringido</h2>
            <p>Debes iniciar sesion para consultar el catalogo y utilizar el carrito de compras.</p>
            <div className="button-row">
              <Link className="primary-button" to={`/tiendas/${numericStoreId}/login`}>
                Iniciar sesion
              </Link>
              <Link className="secondary-button" to={`/tiendas/${numericStoreId}/registro`}>
                Crear cuenta
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <div className="catalog-container catalog-body">
          <aside className="catalog-sidebar">
            <div className="sidebar-block">
              <p className="sidebar-title">Categorias</p>
              <div className="sidebar-stack">
                <button
                  className={selectedCategory === "all" ? "sidebar-button sidebar-button-active" : "sidebar-button"}
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                >
                  Todos
                </button>
                {categories.map((category) => (
                  <button
                    className={Number(selectedCategory) === Number(category.id) ? "sidebar-button sidebar-button-active" : "sidebar-button"}
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-block">
              <p className="sidebar-title">Ordenar</p>
              <div className="sidebar-stack">
                <button
                  className={sortOrder === "nombre" ? "sidebar-button sidebar-button-active" : "sidebar-button"}
                  type="button"
                  onClick={() => setSortOrder("nombre")}
                >
                  Nombre A-Z
                </button>
                <button
                  className={sortOrder === "precio_asc" ? "sidebar-button sidebar-button-active" : "sidebar-button"}
                  type="button"
                  onClick={() => setSortOrder("precio_asc")}
                >
                  Menor precio
                </button>
                <button
                  className={sortOrder === "precio_desc" ? "sidebar-button sidebar-button-active" : "sidebar-button"}
                  type="button"
                  onClick={() => setSortOrder("precio_desc")}
                >
                  Mayor precio
                </button>
              </div>
            </div>
          </aside>

          <main className="catalog-main">
            <div className="mobile-controls">
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="nombre">Nombre A-Z</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
              </select>
            </div>

            {(search || selectedCategory !== "all") && (
              <div className="filter-row">
                {search ? <span className="filter-chip">Busqueda: {search}</span> : null}
                {selectedCategory !== "all" ? <span className="filter-chip">Categoria filtrada</span> : null}
                <button
                  className="clear-filter"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("all");
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {catalogError ? <div className="alert error">{catalogError}</div> : null}
            {feedback ? <div className="alert success">{feedback}</div> : null}
            {cartError ? <div className="alert error">{cartError}</div> : null}

            {loading ? <div className="empty-state-dark">Cargando catalogo...</div> : null}

            {!loading && !visibleProducts.length ? (
              <div className="empty-state-dark">No se encontraron productos con los filtros aplicados.</div>
            ) : null}

            <div className="product-grid-dark">
              {visibleProducts.map((product) => {
                const lowStock = Number(product.stock ?? 0) <= 3;
                return (
                  <article className="product-card-dark" key={product.id}>
                    <div className="product-image-dark">
                      {product.imagenUrl ? <img alt={product.nombre} src={product.imagenUrl} /> : <span>{product.nombre.slice(0, 1)}</span>}
                      {lowStock ? <span className="stock-badge">Ultimas unidades</span> : null}
                    </div>

                    <div className="product-content-dark">
                      <p className="product-category-dark">{product.categoriaNombre || "Sin categoria"}</p>
                      <h3>{product.nombre}</h3>
                      <p className="product-description-dark">{product.descripcionLarga || "Producto sin descripcion detallada."}</p>

                      <div className="price-row-dark">
                        <div>
                          <strong>{currency(product.precio)}</strong>
                          <small>Stock: {product.stock ?? 0}</small>
                        </div>
                        <input
                          className="qty-input-dark"
                          min="1"
                          type="number"
                          value={quantities[product.id] ?? 1}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [product.id]: Math.max(1, Number(event.target.value || 1))
                            }))
                          }
                        />
                      </div>

                      <div className="action-grid">
                        <button
                          className="secondary-dark-button"
                          disabled={addingProductId === product.id}
                          type="button"
                          onClick={() => handleAddToCart(product)}
                        >
                          {addingProductId === product.id ? "Agregando..." : "Agregar al carrito"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </main>
        </div>
      )}

      <footer className="catalog-footer">
        <div className="catalog-container footer-inner">
          <span>{store?.nombre ?? "Catalogo"}</span>
          {store?.telefonoContacto ? <span>Contacto: {store.telefonoContacto}</span> : null}
        </div>
      </footer>

      {cartOpen ? (
        <div className="drawer-overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>Tu carrito</h2>
                <p>{cartCount ? `${cartCount} productos seleccionados` : "Sin productos"}</p>
              </div>
              <button className="drawer-close" type="button" onClick={() => setCartOpen(false)}>
                ×
              </button>
            </div>

            <div className="drawer-body">
              {!cart.items.length ? <div className="empty-state-dark small-empty">Tu carrito esta vacio.</div> : null}

              {cart.items.map((item) => (
                <div className="drawer-item" key={item.id}>
                  <div>
                    <strong>{item.productoNombre}</strong>
                    <p>
                      {item.cantidad} x {currency(item.precioUnitario)}
                    </p>
                  </div>
                  <div className="drawer-item-actions">
                    <span>{currency(item.subtotal)}</span>
                    <button
                      className="remove-link"
                      disabled={cartBusyItem === item.id}
                      type="button"
                      onClick={() => handleRemoveCartItem(item.id)}
                    >
                      {cartBusyItem === item.id ? "Quitando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-footer">
              <div className="drawer-total">
                <span>Total</span>
                <strong>{currency(cart.totalEstimado)}</strong>
              </div>

              <div className="button-stack">
                <a
                  className={cart.items.length && store?.telefonoContacto ? "whatsapp-button" : "whatsapp-button disabled-link"}
                  href={buildWhatsAppUrl(store?.nombre ?? "Tienda", store?.telefonoContacto, cart.items)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Pedir por WhatsApp
                </a>
                <Link className="secondary-button block-button" to={`/tiendas/${numericStoreId}/carrito`}>
                  Ver detalle completo
                </Link>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
