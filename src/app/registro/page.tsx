"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building, User, Mail, Lock, Eye, EyeOff, AlertCircle, Check } from "lucide-react"
import { registro, fetchMe, setToken, setUser } from "@/lib/auth"

// Definido FUERA del componente para evitar re-mount en cada keystroke
function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, extra }: {
  label: string; icon: React.ElementType; type?: string
  value: string; onChange: (v: string) => void; placeholder: string; extra?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <Icon size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} required placeholder={placeholder}
          style={{ width: "100%", padding: "11px 14px 11px 36px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
        {extra}
      </div>
    </div>
  )
}

export default function RegistroPage() {
  const router = useRouter()
  const [empresa,  setEmpresa]  = useState("")
  const [nombre,   setNombre]   = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [password2,setPassword2]= useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")

  const pwOk = password.length >= 6
  const match = password === password2 && password2.length > 0

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (!pwOk) { setError("La contraseña debe tener al menos 6 caracteres"); return }
    if (!match) { setError("Las contraseñas no coinciden"); return }
    setError(""); setLoading(true)
    try {
      const token = await registro(empresa, nombre, email, password)
      setToken(token)
      try {
        const user = await fetchMe(token)
        setUser(user)
      } catch {}
      router.push("/app/dashboard")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse"
      // Si el email ya existe, ofrecer ir al login directamente
      if (msg.includes("ya registrado")) {
        setError("Este email ya tiene una cuenta. ¿Quieres iniciar sesión?")
      } else {
        setError(msg)
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#0F2B5B", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 800 }}>TB</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
          </Link>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 8 }}>Crea tu cuenta — 14 días gratis</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "32px 28px", boxShadow: "0 4px 24px rgba(15,43,91,0.08)" }}>
          <form onSubmit={handleRegistro}>

            {error && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                <AlertCircle size={15} style={{ color: "#B91C1C", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <span style={{ fontSize: 13, color: "#B91C1C" }}>{error}</span>
                  {error.includes("ya tiene una cuenta") && (
                    <div style={{ marginTop: 6 }}>
                      <Link href="/login" style={{ fontSize: 13, color: "#1E6FD9", fontWeight: 600, textDecoration: "none" }}>
                        Ir al inicio de sesión →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "4px 12px 8px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8, marginBottom: 6 }}>Tu agencia</div>
              <Field label="Nombre de la empresa" icon={Building} value={empresa} onChange={setEmpresa} placeholder="Agencia Despachante S.R.L." />
            </div>

            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "4px 12px 8px", marginBottom: 16, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8, marginBottom: 6 }}>Tu cuenta</div>
              <Field label="Tu nombre" icon={User} value={nombre} onChange={setNombre} placeholder="Juan Pérez" />
              <Field label="Correo electrónico" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="juan@agencia.com" />
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres"
                    style={{ width: "100%", padding: "11px 42px 11px 36px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Confirmar contraseña</label>
                <div style={{ position: "relative" }}>
                  <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  <input type={showPw ? "text" : "password"} value={password2} onChange={e => setPassword2(e.target.value)} required placeholder="Repite la contraseña"
                    style={{ width: "100%", padding: "11px 42px 11px 36px", border: `1.5px solid ${password2 ? (match ? "#0D7A3E" : "#B91C1C") : "#E2E8F0"}`, borderRadius: 10, fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }} />
                  {match && <Check size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#0D7A3E" }} />}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "#94A3B8" : "#0F2B5B", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#475569" }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ color: "#1E6FD9", fontWeight: 600, textDecoration: "none" }}>Ingresar</Link>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 20 }}>
          {["14 días gratis", "Sin tarjeta", "Cancela cuando quieras"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#94A3B8" }}>
              <Check size={12} style={{ color: "#0D7A3E" }} /> {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
