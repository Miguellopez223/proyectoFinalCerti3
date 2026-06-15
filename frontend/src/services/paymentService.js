import { apiFetch } from "./api";

export function registerPayment(payload, token) {
  return apiFetch("/api/pagos", {
    method: "POST",
    token,
    body: payload
  });
}
