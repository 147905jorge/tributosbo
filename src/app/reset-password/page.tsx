"use client"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
const API_BASE = "/api/tb"

function ResetContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const token   = params.get("token") || ""

  const [pw,      setPw]      = useState("")
  const [pw2,     setPw2]     = useState("")
  const [showPw,  setShowPw]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== pw2) { setError("Las contraseñas no coinciden"); return }
    if (pw.length < 6) { setError("Mínimo 6 caracteres"); return }
    setError(""); setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nueva_password: pw }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || "Error al restablecer")
      setDone(true)
      setTimeout(() => router.push("/login"), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al procesar")
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <AlertCircle size={40} style={{ color: "#B91C1C", marginBottom: 12 }} />
        <p style={{ color: "#B91C1C", fontWeight: 600 }}>Enlace inválido</p>
        <Link href="/forgot-password" style={{ color: "#1E6FD9", fontSize: 14 }}>Solicitar uno nuevo</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B", margin: "0 0 8px" }}>Nueva contraseña</h2>
      <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 24px" }}>Elige una contraseña segura de al menos 6 caracteres.</p>

      {done && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <CheckCircle2 size={16} style={{ color: "#0D7A3E" }} />
          <span style={{ fontSize: 13, color: "#0D7A3E", fontWeight: 600 }}>Contraseña actualizada. Redirigiendo...</span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <AlertCircle size={15} style={{ color: "#B91C1C", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#B91C1C" }}>{error}</span>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Nueva contraseña</label>
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} required
            placeholder="••••••••"
            style={{ width: "100%", padding: "11px 42px 11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
          <button type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Confirmar contraseña</label>
        <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} required
          placeholder="••••••••"
          style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
      </div>

      <button type="submit" disabled={loading || done}
        style={{ width: "100%", background: loading || done ? "#94A3B8" : "#1E6FD9", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading || done ? "not-allowed" : "pointer" }}>
        {loading ? "Guardando..." : "Guardar nueva contraseña"}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#0F2B5B", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>TB</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
          </Link>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(15,43,91,0.08)" }}>
          <Suspense fallback={<div style={{ textAlign: "center", color: "#94A3B8" }}>Cargando...</div>}>
            <ResetContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
