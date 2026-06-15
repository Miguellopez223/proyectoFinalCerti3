import { apiFetch } from "./api";
import { normalizeOrder } from "../utils/normalizers";

export async function listOrdersByUser(storeId, userId, token) {
  const response = await apiFetch(`/api/pedidos/tienda/${storeId}/usuario/${userId}`, { token });
  return Array.isArray(response) ? response.map(normalizeOrder) : [];
}

export async function createOrderFromCart(payload, token) {
  const response = await apiFetch("/api/pedidos", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeOrder(response);
}

export async function updateOrderStatus(storeId, orderId, status, token) {
  const response = await apiFetch(`/api/pedidos/tienda/${storeId}/${orderId}/estado?estado=${encodeURIComponent(status)}`, {
    method: "PATCH",
    token
  });
  return normalizeOrder(response);
}
