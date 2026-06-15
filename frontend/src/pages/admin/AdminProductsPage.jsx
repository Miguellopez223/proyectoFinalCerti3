import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listCategoriesByStore } from "../../services/categoryService";
import { createProduct, deleteProduct, listProductsByStore, updateProduct } from "../../services/productService";
import { currency } from "../../utils/format";
import { slugify } from "../../utils/text";

const emptyForm = {
  nombre: "",
  categoriaId: "",
  descripcionLarga: "",
  precio: "",
  precioCosto: "",
  stock: "0",
  stockMinimo: "1",
  imagenUrl: ""
};

function buildPayload(form, storeId) {
  const slug = slugify(form.nombre);
  return {
    tiendaId: Number(storeId),
    categoriaId: form.categoriaId ? Number(form.categoriaId) : null,
    nombre: form.nombre.trim(),
    slugProducto: slug || `producto-${Date.now()}`,
    descripcionLarga: form.descripcionLarga.trim(),
    precio: Number(form.precio),
    precioCosto: Number(form.precioCosto || 0),
    stock: Number(form.stock || 0),
    stockMinimo: Number(form.stockMinimo || 0),
    imagenUrl: form.imagenUrl.trim()
  };
}

export function AdminProductsPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const [categoryData, productData] = await Promise.all([
      listCategoriesByStore(storeId, session.token),
      listProductsByStore(storeId, session.token)
    ]);
    setCategories(categoryData);
    setProducts(productData);
  }

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        const [categoryData, productData] = await Promise.all([
          listCategoriesByStore(storeId, session.token),
          listProductsByStore(storeId, session.token)
        ]);
        if (!ignore) {
          setCategories(categoryData);
          setProducts(productData);
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

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.nombre, product.categoriaNombre, product.descripcionLarga].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesCategory = !categoryFilter || Number(product.categoriaId) === Number(categoryFilter);
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "disponible" && product.estado && Number(product.stock || 0) > 0) ||
        (statusFilter === "agotado" && Number(product.stock || 0) <= 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, products, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre || "",
      categoriaId: product.categoriaId || "",
      descripcionLarga: product.descripcionLarga || "",
      precio: product.precio ?? "",
      precioCosto: product.precioCosto ?? "",
      stock: product.stock ?? 0,
      stockMinimo: product.stockMinimo ?? 0,
      imagenUrl: product.imagenUrl || ""
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload(form, storeId);
      if (editingId) {
        await updateProduct(editingId, payload, session.token);
        setSuccess("Producto actualizado correctamente.");
      } else {
        await createProduct(payload, session.token);
        setSuccess("Producto creado correctamente.");
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId) {
    if (!window.confirm("Eliminar este producto?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteProduct(storeId, productId, session.token);
      setSuccess("Producto eliminado correctamente.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Productos</h2>
          <p>Administra el catalogo de productos de tu tienda.</p>
        </div>
        <button className="admin-primary" type="button" onClick={openCreate}>
          Nuevo producto
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="admin-filters">
        <input placeholder="Buscar por nombre o descripcion..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nombre}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>

      {showForm ? (
        <form className="admin-card admin-form" onSubmit={handleSubmit}>
          <div className="card-title-row">
            <div>
              <h3>{editingId ? "Editar producto" : "Nuevo producto"}</h3>
              <p>Completa los datos del producto.</p>
            </div>
            <button className="admin-secondary" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
          <div className="form-columns">
            <label>
              Nombre *
              <input required value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </label>
            <label>
              Categoria
              <select value={form.categoriaId} onChange={(event) => setForm((current) => ({ ...current, categoriaId: event.target.value }))}>
                <option value="">Sin categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="full">
              Descripcion
              <textarea rows="3" value={form.descripcionLarga} onChange={(event) => setForm((current) => ({ ...current, descripcionLarga: event.target.value }))} />
            </label>
            <label>
              Precio venta *
              <input required min="0.01" step="0.01" type="number" value={form.precio} onChange={(event) => setForm((current) => ({ ...current, precio: event.target.value }))} />
            </label>
            <label>
              Precio costo
              <input min="0" step="0.01" type="number" value={form.precioCosto} onChange={(event) => setForm((current) => ({ ...current, precioCosto: event.target.value }))} />
            </label>
            <label>
              Stock *
              <input required min="0" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} />
            </label>
            <label>
              Stock minimo
              <input min="0" type="number" value={form.stockMinimo} onChange={(event) => setForm((current) => ({ ...current, stockMinimo: event.target.value }))} />
            </label>
            <label className="full">
              Imagen URL
              <input placeholder="https://..." value={form.imagenUrl} onChange={(event) => setForm((current) => ({ ...current, imagenUrl: event.target.value }))} />
            </label>
          </div>
          <button className="admin-primary" disabled={saving} type="submit">
            {saving ? "Guardando..." : editingId ? "Actualizar producto" : "Crear producto"}
          </button>
        </form>
      ) : null}

      <div className="admin-table-card">
        {loading ? <div className="table-empty">Cargando productos...</div> : null}
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    {product.imagenUrl ? <img alt={product.nombre} src={product.imagenUrl} /> : <span>{product.nombre?.slice(0, 1)}</span>}
                    <div>
                      <strong>{product.nombre}</strong>
                      <small>{product.slugProducto}</small>
                    </div>
                  </div>
                </td>
                <td>{product.categoriaNombre || "-"}</td>
                <td>{currency(product.precio)}</td>
                <td>
                  <strong className={Number(product.stock || 0) <= Number(product.stockMinimo || 0) ? "text-amber" : ""}>{product.stock}</strong>
                  <small> min {product.stockMinimo ?? 0}</small>
                </td>
                <td>
                  <span className={Number(product.stock || 0) > 0 ? "pill success" : "pill danger"}>
                    {Number(product.stock || 0) > 0 ? "Disponible" : "Agotado"}
                  </span>
                </td>
                <td className="row-actions">
                  <button type="button" onClick={() => openEdit(product)}>
                    Editar
                  </button>
                  <button className="danger-link" type="button" onClick={() => handleDelete(product.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!filteredProducts.length && !loading ? (
              <tr>
                <td className="table-empty" colSpan="6">
                  No se encontraron productos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
