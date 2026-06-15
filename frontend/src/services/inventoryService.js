import { apiFetch } from "./api";
import { normalizeMovement } from "../utils/normalizers";

export async function listMovementsByStore(storeId, token) {
  const response = await apiFetch(`/api/inventario/tienda/${storeId}`, { token });
  return Array.isArray(response) ? response.map(normalizeMovement) : [];
}

export async function createMovement(payload, token) {
  const response = await apiFetch("/api/inventario", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeMovement(response);
}
