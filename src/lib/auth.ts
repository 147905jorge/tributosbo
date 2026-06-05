// Proxy interno de Next.js — el browser habla con Vercel, Vercel habla con Oracle
const API = "/api/tb"

export type Usuario = {
  id: string; nombre: string; email: string; rol: string
  empresa: string; slug: string; plan: string
  color_prim: string; color_acento: string; logo_url: string
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("tb_token")
}

export function setToken(token: string) {
  localStorage.setItem("tb_token", token)
  // Sincronizar en cookie para el middleware de Next.js
  document.cookie = `tb_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function clearToken() {
  localStorage.removeItem("tb_token")
  localStorage.removeItem("tb_user")
  document.cookie = "tb_token=; path=/; max-age=0"
}

export function getUser(): Usuario | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("tb_user")
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function setUser(u: Usuario) {
  localStorage.setItem("tb_user", JSON.stringify(u))
}

export async function fetchMe(token: string): Promise<Usuario> {
  const r = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!r.ok) throw new Error("Token inválido")
  return r.json()
}

export async function login(email: string, password: string): Promise<string> {
  const body = new URLSearchParams({ username: email, password })
  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || "Credenciales incorrectas")
  }
  const d = await r.json()
  return d.access_token
}

export async function registro(
  empresa_nombre: string, nombre: string, email: string, password: string
): Promise<string> {
  const r = await fetch(`${API}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empresa_nombre, nombre, email, password })
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || "Error al registrarse")
  }
  const d = await r.json()
  return d.token
}
