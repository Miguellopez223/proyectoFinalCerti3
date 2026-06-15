import { apiFetch } from "./api";
import { normalizeUser } from "../utils/normalizers";

export async function listUsersByStore(storeId, token) {
  const response = await apiFetch(`/api/usuarios/tienda/${storeId}`, { token });
  return Array.isArray(response) ? response.map(normalizeUser) : [];
}

export async function createUser(payload, token) {
  const response = await apiFetch("/api/usuarios/registrar", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeUser(response);
}

export async function updateUser(userId, payload, token) {
  const response = await apiFetch(`/api/usuarios/${userId}`, {
    method: "PUT",
    token,
    body: payload
  });
  return normalizeUser(response);
}

export function deleteUser(userId, token) {
  return apiFetch(`/api/usuarios/${userId}`, {
    method: "DELETE",
    token
  });
}
