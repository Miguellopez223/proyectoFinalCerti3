import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createUser, deleteUser, listUsersByStore, updateUser } from "../../services/userService";
import { initials } from "../../utils/text";

const emptyForm = { nombre: "", email: "", password: "", rol: "CLIENTE" };

export function AdminUsersPage() {
  const { storeId } = useParams();
  const { session } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    const data = await listUsersByStore(storeId, session.token);
    setUsers(data);
  }

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setLoading(true);
        const data = await listUsersByStore(storeId, session.token);
        if (!ignore) {
          setUsers(data);
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
    return users.filter((user) => !query || [user.nombre, user.email, user.rol].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [search, users]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(user) {
    setEditingId(user.id);
    setForm({ nombre: user.nombre || "", email: user.email || "", password: "", rol: user.rol || "CLIENTE" });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      setSuccess("");
      const payload = {
        tiendaId: Number(storeId),
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        rol: form.rol
      };

      if (editingId) {
        if (!payload.password) {
          setError("Para actualizar un usuario, el backend actual requiere ingresar una contrasena.");
          return;
        }
        await updateUser(editingId, payload, session.token);
        setSuccess("Usuario actualizado correctamente.");
      } else {
        await createUser(payload, session.token);
        setSuccess("Usuario creado correctamente.");
      }
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(userId) {
    if (Number(userId) === Number(session.userId)) {
      setError("No puedes eliminar tu propio usuario desde esta pantalla.");
      return;
    }
    if (!window.confirm("Eliminar este usuario?")) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteUser(userId, session.token);
      setSuccess("Usuario eliminado correctamente.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-stack">
      <div className="admin-page-heading">
        <div>
          <h2>Usuarios</h2>
          <p>Gestiona el equipo de la tienda.</p>
        </div>
        <button className="admin-primary" type="button" onClick={openCreate}>
          Nuevo usuario
        </button>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      <div className="admin-filters">
        <input placeholder="Buscar por nombre, correo o rol..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      {showForm ? (
        <form className="admin-card admin-form" onSubmit={handleSubmit}>
          <div className="card-title-row">
            <div>
              <h3>{editingId ? "Editar usuario" : "Nuevo usuario"}</h3>
              <p>{editingId ? "Ingresa una contrasena para guardar cambios." : "Crea un acceso para la tienda."}</p>
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
              Correo *
              <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Contrasena *
              <input required={!editingId} type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <label>
              Rol *
              <select value={form.rol} onChange={(event) => setForm((current) => ({ ...current, rol: event.target.value }))}>
                <option value="CLIENTE">Vendedor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
          </div>
          <button className="admin-primary" type="submit">
            {editingId ? "Actualizar usuario" : "Crear usuario"}
          </button>
        </form>
      ) : null}

      <div className="admin-table-card">
        {loading ? <div className="table-empty">Cargando usuarios...</div> : null}
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <span>{initials(user.nombre)}</span>
                    <div>
                      <strong>
                        {user.nombre} {Number(user.id) === Number(session.userId) ? <small>(tu)</small> : null}
                      </strong>
                      <small>{user.email}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="pill neutral">{user.rol}</span>
                </td>
                <td>
                  <span className={user.estado ? "pill success" : "pill danger"}>{user.estado ? "Activo" : "Inactivo"}</span>
                </td>
                <td className="row-actions">
                  <button type="button" onClick={() => openEdit(user)}>
                    Editar
                  </button>
                  {Number(user.id) !== Number(session.userId) ? (
                    <button className="danger-link" type="button" onClick={() => handleDelete(user.id)}>
                      Eliminar
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!filtered.length && !loading ? (
              <tr>
                <td className="table-empty" colSpan="4">
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
