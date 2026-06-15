import { apiFetch } from "./api";
import { normalizeStore } from "../utils/normalizers";

export async function listStores() {
  const response = await apiFetch("/api/tiendas");
  return Array.isArray(response) ? response.map(normalizeStore) : [];
}

export async function getStoreById(storeId) {
  const response = await apiFetch(`/api/tiendas/${storeId}`);
  return normalizeStore(response);
}

