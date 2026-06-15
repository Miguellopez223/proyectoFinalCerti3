import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listStores } from "../services/storeService";

export function HomePage() {
  const { isAuthenticated, session } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const primaryStore = useMemo(() => {
    if (!stores.length) {
      return null;
    }

    return stores.find((store) => store.slug === "comercio1") ?? stores.find((store) => store.estado) ?? stores[0];
  }, [stores]);

  useEffect(() => {
    let ignore = false;

    async function loadStores() {
      try {
        setLoading(true);
        const data = await listStores();
        if (!ignore) {
          setStores(data);
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

    loadStores();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <div className="auth-brand-block">
          <div className="auth-brand-mark">CW</div>
          <h1>CompuWeb System</h1>
          <p>
            Plataforma de inventario, ventas y catalogo en linea para una tienda principal.
          </p>
        </div>

        <div className="auth-form-card">
          <div className="section-heading">
            <span className="section-label">Acceso principal</span>
            <h2>{loading ? "Cargando tienda..." : primaryStore?.nombre ?? "Tienda no disponible"}</h2>
          </div>

          {error ? <div className="alert error">{error}</div> : null}

          {primaryStore ? (
            <>
              <div className="info-list">
                <div>
                  <span>Slug</span>
                  <strong>{primaryStore.slug}</strong>
                </div>
                <div>
                  <span>Correo</span>
                  <strong>{primaryStore.emailContacto || "No registrado"}</strong>
                </div>
                <div>
                  <span>Telefono</span>
                  <strong>{primaryStore.telefonoContacto || "No registrado"}</strong>
                </div>
              </div>

              <div className="button-stack">
                {isAuthenticated && Number(session?.storeId) === Number(primaryStore.id) ? (
                  <Link className="primary-button block-button" to={`/tiendas/${primaryStore.id}`}>
                    Ir al catalogo
                  </Link>
                ) : (
                  <Link className="primary-button block-button" to={`/tiendas/${primaryStore.id}/login`}>
                    Iniciar sesion
                  </Link>
                )}
                <Link className="secondary-button block-button" to={`/tiendas/${primaryStore.id}/registro`}>
                  Crear cuenta
                </Link>
              </div>
            </>
          ) : (
            !loading && <div className="empty-state-simple">No se encontro una tienda disponible.</div>
          )}
        </div>
      </div>
    </div>
  );
}
