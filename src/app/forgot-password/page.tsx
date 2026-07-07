"use client"
import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
const API_BASE = "/api/tb"

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(""); setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!r.ok) throw new Error("Error al procesar")
      setSent(true)
    } catch {
      setError("No se pudo enviar el correo. Intenta de nuevo.")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#0F2B5B", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>TB</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
          </Link>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 8 }}>Restablecer contraseña</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(15,43,91,0.08)" }}>

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle2 size={48} style={{ color: "#0D7A3E", marginBottom: 16 }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B", margin: "0 0 10px" }}>Correo enviado</h2>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 24px" }}>
                Si <strong>{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#1E6FD9", fontWeight: 600, textDecoration: "none" }}>
                <ArrowLeft size={15} /> Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B", margin: "0 0 8px" }}>Olvidaste tu contraseña</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 24px" }}>
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <AlertCircle size={15} style={{ color: "#B91C1C", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#B91C1C" }}>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>
                  Correo electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="tu@agencia.com"
                    style={{ width: "100%", padding: "11px 14px 11px 36px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "#94A3B8" : "#1E6FD9", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#475569", textDecoration: "none" }}>
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
