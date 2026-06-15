import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-compact">
        <div className="auth-form-card centered-card">
          <span className="section-label">404</span>
          <h2>Pagina no encontrada</h2>
          <p>La ruta solicitada no existe o fue movida.</p>
          <Link className="primary-button block-button" to="/">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
