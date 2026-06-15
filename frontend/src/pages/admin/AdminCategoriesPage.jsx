import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createCategory, deleteCategory, listCategoriesByStore, updateCategory } from "../../services/categoryService";
import { listProductsByStore } from "../../services/productService";

export function AdminCategoriesPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
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

  const counts = useMemo(() => {
    return products.reduce((acc, product) => {
      if (product.categoriaId) {
        acc[product.categoriaId] = (acc[product.categoriaId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [products]);

  const filtered = categories.filter((category) => category.nombre?.toLowerCase().includes(search.trim().toLowerCase()));

  function openCreate() {
    setEditingId(null);
    setName("");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(category) {
    setEditingId(category.id);
    setName(category.nombre || "");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = { tiendaId: Number(storeId), nombre: name.trim() };
      if (editingId) {
        await updateCategory(editingId, payload, session.token);
        setSuccess("Categoria actualizada correctamente.");
      } else {
        await createCategory(payload, session.token);
        setSuccess("Categoria creada correctamente.");
      }
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(categoryId) {
    if (!window.confirm("Eliminar esta categoria?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteCategory(categoryId, session.token);
      setSuccess("Categoria eliminada correctamente.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Categorias</h2>
          <p>Organiza los productos del catalogo.</p>
        </div>
        <button className="admin-primary" type="button" onClick={openCreate}>
          Nueva categoria
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="admin-filters">
        <input placeholder="Buscar categoria..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {showForm ? (
        <form className="admin-card inline-form" onSubmit={handleSubmit}>
          <label>
            Nombre de categoria
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <button className="admin-primary" type="submit">
            {editingId ? "Actualizar" : "Crear"}
          </button>
          <button className="admin-secondary" type="button" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
        </form>
      ) : null}

      <div className="admin-table-card">
        {loading ? <div className="table-empty">Cargando categorias...</div> : null}
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Productos</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((category) => (
              <tr key={category.id}>
                <td>
                  <strong>{category.nombre}</strong>
                </td>
                <td>{counts[category.id] || 0}</td>
                <td>
                  <span className={category.estado ? "pill success" : "pill danger"}>{category.estado ? "Activa" : "Inactiva"}</span>
                </td>
                <td className="row-actions">
                  <button type="button" onClick={() => openEdit(category)}>
                    Editar
                  </button>
                  <button className="danger-link" type="button" onClick={() => handleDelete(category.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td className="table-empty" colSpan="4">
                  No hay categorias registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
