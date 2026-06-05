"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { login, fetchMe, setToken, setUser } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)
    try {
      const token = await login(email, password)
      const user  = await fetchMe(token)
      setToken(token)
      setUser(user)
      router.push("/app/dashboard")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#0F2B5B", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>TB</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
          </Link>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 8 }}>Ingresa a tu cuenta</p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(15,43,91,0.08)" }}>
          <form onSubmit={handleLogin}>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                <AlertCircle size={15} style={{ color: "#B91C1C", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#B91C1C" }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@agencia.com"
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                Contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "11px 42px 11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "#94A3B8" : "#1E6FD9", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Ingresando..." : <><LogIn size={17} /> Ingresar</>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#475569" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" style={{ color: "#1E6FD9", fontWeight: 600, textDecoration: "none" }}>
              Registra tu agencia
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", marginTop: 20 }}>
          14 días de prueba gratuita, sin tarjeta de crédito
        </p>
      </div>
    </div>
  )
}
