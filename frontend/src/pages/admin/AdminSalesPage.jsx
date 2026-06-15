import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listOrdersByUser, updateOrderStatus } from "../../services/orderService";
import { currency } from "../../utils/format";

export function AdminSalesPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOrders() {
    const data = await listOrdersByUser(storeId, session.userId, session.token);
    setOrders(data);
  }

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        const data = await listOrdersByUser(storeId, session.userId, session.token);
        if (!ignore) {
          setOrders(data);
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
  }, [session.token, session.userId, storeId]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !query || [order.id, order.codigoSeguimiento, order.estadoPedido].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesStatus = !statusFilter || order.estadoPedido === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  async function cancelOrder(orderId) {
    if (!window.confirm("Anular esta venta?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await updateOrderStatus(storeId, orderId, "CANCELADO", session.token);
      setSuccess("Venta anulada correctamente.");
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Historial de ventas</h2>
          <p>Consulta las transacciones registradas.</p>
        </div>
        <Link className="admin-primary" to="registrar">
          Registrar venta
        </Link>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="admin-filters">
        <input placeholder="Buscar por codigo o estado..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="PAGADO">Pagado</option>
          <option value="PREPARANDO">Preparando</option>
          <option value="ENVIADO">Enviado</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      <div className="admin-table-card">
        {loading ? <div className="table-empty">Cargando ventas...</div> : null}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Codigo</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr className={order.estadoPedido === "CANCELADO" ? "muted-row" : ""} key={order.id}>
                <td>#{order.id}</td>
                <td>
                  <strong>{order.codigoSeguimiento || "-"}</strong>
                </td>
                <td>{order.items.length} item(s)</td>
                <td>
                  <strong>{currency(order.total)}</strong>
                </td>
                <td>
                  <span className={order.estadoPedido === "CANCELADO" ? "pill danger" : "pill success"}>{order.estadoPedido || "PENDIENTE"}</span>
                </td>
                <td className="row-actions">
                  {order.estadoPedido !== "CANCELADO" ? (
                    <button className="danger-link" type="button" onClick={() => cancelOrder(order.id)}>
                      Anular
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td className="table-empty" colSpan="6">
                  No hay ventas registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
