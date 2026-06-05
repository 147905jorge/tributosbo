import { getToken, clearToken } from "./auth"

// Proxy interno — sin CORS, sin bloqueos de red
const BASE = "/api/tb"

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (res.status === 401) {
    clearToken()
    window.location.href = "/login"
    throw new Error("Sesión expirada")
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  get:    (path: string)              => apiFetch(path),
  post:   (path: string, body: unknown) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put:    (path: string, body: unknown) => apiFetch(path, { method: "PUT",  body: JSON.stringify(body) }),
  patch:  (path: string, body?: unknown)=> apiFetch(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string)              => apiFetch(path, { method: "DELETE" }),
}
