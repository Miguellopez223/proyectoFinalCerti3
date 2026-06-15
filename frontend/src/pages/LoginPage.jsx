import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import { getStoreById, listStores } from "../services/storeService";

export function LoginPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    let ignore = false;

    async function loadStore() {
      try {
        setLoadingStore(true);
        const data = await getStoreById(storeId);
        if (!ignore) {
          setStore(data);
        }
      } catch {
        try {
          const allStores = await listStores();
          const found = allStores.find((item) => Number(item.id) === Number(storeId));
          if (!ignore) {
            setStore(found ?? null);
          }
        } finally {
          if (!ignore) {
            setLoadingStore(false);
          }
        }
        return;
      }

      if (!ignore) {
        setLoadingStore(false);
      }
    }

    loadStore();
    return () => {
      ignore = true;
    };
  }, [storeId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await loginUser({
        tiendaId: Number(storeId),
        email: form.email,
        password: form.password
      });
      signIn(response, storeId);
      navigate(`/tiendas/${storeId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand-block">
          <div className="auth-brand-mark">CW</div>
          <h1>CompuWeb System</h1>
          <p>{loadingStore ? "Cargando tienda..." : store?.nombre ?? `Tienda #${storeId}`}</p>
        </div>

        <div className="auth-form-card">
          <div className="section-heading">
            <span className="section-label">Iniciar sesion</span>
            <h2>Acceso al sistema</h2>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>Correo electronico</span>
              <input
                required
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            <label>
              <span>Contrasena</span>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            {error ? <div className="alert error">{error}</div> : null}

            <button className="primary-button block-button" type="submit" disabled={submitting}>
              {submitting ? "Verificando..." : "Ingresar al sistema"}
            </button>
          </form>

          <div className="auth-footer-links">
            <Link to={`/tiendas/${storeId}/registro`}>Crear cuenta</Link>
            <Link to="/">Volver</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
