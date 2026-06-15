import { NavLink, Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "", label: "Dashboard" },
  { to: "productos", label: "Productos" },
  { to: "categorias", label: "Categorias" },
  { to: "movimientos", label: "Movimientos" },
  { to: "ventas", label: "Historial de ventas" },
  { to: "ventas/registrar", label: "Registrar venta" },
  { to: "usuarios", label: "Usuarios" },
  { to: "reportes", label: "Reportes" }
];

export function AdminLayout() {
  const { storeId } = useParams();
  const { isAuthenticated, session, signOut } = useAuth();
  const basePath = `/tiendas/${storeId}/admin`;

  if (!isAuthenticated || Number(session?.storeId) !== Number(storeId)) {
    return <Navigate to={`/tiendas/${storeId}/login`} replace />;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>CompuWeb</span>
          <strong>Panel de tienda</strong>
        </div>

        <nav className="admin-nav">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) => (isActive ? "admin-nav-link active" : "admin-nav-link")}
              end={link.to === ""}
              key={link.to}
              to={link.to ? `${basePath}/${link.to}` : basePath}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-user">
          <div>
            <strong>{session?.email ?? "Usuario"}</strong>
            <span>Tienda #{storeId}</span>
          </div>
          <button type="button" onClick={signOut}>
            Salir
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">Sistema de inventario</span>
            <h1>CompuWeb System</h1>
          </div>
          <NavLink className="admin-store-link" to={`/tiendas/${storeId}`}>
            Ver catalogo
          </NavLink>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
