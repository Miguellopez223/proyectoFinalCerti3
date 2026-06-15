import { apiFetch } from "./api";

export function loginUser(payload) {
  return apiFetch("/api/auth", {
    method: "POST",
    body: payload
  });
}

export function registerUser(payload) {
  return apiFetch("/api/usuarios/registrar", {
    method: "POST",
    body: payload
  });
}

