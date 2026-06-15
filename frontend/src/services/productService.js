import { apiFetch } from "./api";
import { normalizeProduct } from "../utils/normalizers";

export async function listProductsByStore(storeId, token) {
  const response = await apiFetch(`/api/productos/tienda/${storeId}`, {
    token
  });
  return Array.isArray(response) ? response.map(normalizeProduct) : [];
}

export async function createProduct(payload, token) {
  const response = await apiFetch("/api/productos", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeProduct(response);
}

export async function updateProduct(productId, payload, token) {
  const response = await apiFetch(`/api/productos/${productId}`, {
    method: "PUT",
    token,
    body: payload
  });
  return normalizeProduct(response);
}

export function deleteProduct(storeId, productId, token) {
  return apiFetch(`/api/productos/tienda/${storeId}/${productId}`, {
    method: "DELETE",
    token
  });
}
