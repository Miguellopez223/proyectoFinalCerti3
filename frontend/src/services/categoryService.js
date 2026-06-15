import { apiFetch } from "./api";
import { normalizeCategory } from "../utils/normalizers";

export async function listCategoriesByStore(storeId, token) {
  const response = await apiFetch(`/api/categorias/tienda/${storeId}`, {
    token
  });
  return Array.isArray(response) ? response.map(normalizeCategory) : [];
}

export async function createCategory(payload, token) {
  const response = await apiFetch("/api/categorias", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeCategory(response);
}

export async function updateCategory(categoryId, payload, token) {
  const response = await apiFetch(`/api/categorias/${categoryId}`, {
    method: "PUT",
    token,
    body: payload
  });
  return normalizeCategory(response);
}

export function deleteCategory(categoryId, token) {
  return apiFetch(`/api/categorias/${categoryId}`, {
    method: "DELETE",
    token
  });
}
