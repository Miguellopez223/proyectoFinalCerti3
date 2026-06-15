import { apiFetch } from "./api";
import { normalizeCart } from "../utils/normalizers";

export async function getCartByUser(storeId, userId, token) {
  const response = await apiFetch(`/api/carrito/tienda/${storeId}/usuario/${userId}`, {
    token
  });
  return normalizeCart(response);
}

export async function addItemToCart(payload, token) {
  const response = await apiFetch("/api/carrito/agregar", {
    method: "POST",
    token,
    body: payload
  });
  return normalizeCart(response);
}

export async function removeCartItem(cartId, itemId, token) {
  const response = await apiFetch(`/api/carrito/${cartId}/item/${itemId}`, {
    method: "DELETE",
    token
  });
  return normalizeCart(response);
}

