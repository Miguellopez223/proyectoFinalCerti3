import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createMovement, listMovementsByStore } from "../../services/inventoryService";
import { listProductsByStore } from "../../services/productService";
import { shortDate } from "../../utils/format";

const emptyForm = { productoId: "", tipo: "ENTRADA", cantidad: "1", referencia: "" };

export function AdminMovementsPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const [movementData, productData] = await Promise.all([
      listMovementsByStore(storeId, session.token),
      listProductsByStore(storeId, session.token)
    ]);
    setMovements(movementData);
    setProducts(productData);
  }

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        const [movementData, productData] = await Promise.all([
          listMovementsByStore(storeId, session.token),
          listProductsByStore(storeId, session.token)
        ]);
        if (!ignore) {
          setMovements(movementData);
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return movements.filter((movement) => {
      const matchesSearch = !query || [movement.productoNombre, movement.referencia].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesType = !typeFilter || movement.tipo === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [movements, search, typeFilter]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      setSuccess("");
      await createMovement(
        {
          tiendaId: Number(storeId),
          productoId: Number(form.productoId),
          usuarioId: session.userId,
          tipo: form.tipo,
          cantidad: Number(form.cantidad),
          referencia: form.referencia.trim()
        },
        session.token
      );
      setForm(emptyForm);
      setShowForm(false);
      setSuccess("Movimiento registrado correctamente.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Movimientos de inventario</h2>
          <p>Registro de entradas y salidas de productos.</p>
        </div>
        <button className="admin-primary" type="button" onClick={() => setShowForm(true)}>
          Registrar movimiento
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="admin-filters">
        <input placeholder="Buscar por producto o referencia..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="SALIDA">Salidas</option>
        </select>
      </div>

      {showForm ? (
        <form className="admin-card admin-form" onSubmit={handleSubmit}>
          <div className="card-title-row">
            <div>
              <h3>Registrar movimiento</h3>
              <p>El stock se actualiza automaticamente.</p>
            </div>
            <button className="admin-secondary" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
          <div className="form-columns">
            <label>
              Producto *
              <select required value={form.productoId} onChange={(event) => setForm((current) => ({ ...current, productoId: event.target.value }))}>
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre} - Stock {product.stock}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo *
              <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
              </select>
            </label>
            <label>
              Cantidad *
              <input required min="1" type="number" value={form.cantidad} onChange={(event) => setForm((current) => ({ ...current, cantidad: event.target.value }))} />
            </label>
            <label>
              Referencia
              <input value={form.referencia} onChange={(event) => setForm((current) => ({ ...current, referencia: event.target.value }))} />
            </label>
          </div>
          <button className="admin-primary" type="submit">
            Registrar
          </button>
        </form>
      ) : null}

      <div className="admin-table-card">
        {loading ? <div className="table-empty">Cargando movimientos...</div> : null}
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Referencia</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((movement) => (
              <tr key={movement.id}>
                <td>
                  <span className={movement.tipo === "ENTRADA" ? "pill success" : "pill neutral"}>{movement.tipo}</span>
                </td>
                <td>
                  <strong>{movement.productoNombre}</strong>
                </td>
                <td className={movement.tipo === "ENTRADA" ? "text-green" : ""}>
                  {movement.tipo === "ENTRADA" ? "+" : "-"}
                  {movement.cantidad}
                </td>
                <td>{movement.referencia || "-"}</td>
                <td>{shortDate(movement.fecha)}</td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td className="table-empty" colSpan="5">
                  No hay movimientos registrados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
