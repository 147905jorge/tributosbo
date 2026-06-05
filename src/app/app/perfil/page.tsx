"use client"
import { useState, useEffect } from "react"
import { User, Mail, Lock, Check, AlertCircle, Loader2, Eye, EyeOff, Calendar } from "lucide-react"
import { api } from "@/lib/api"
import { getUser, setUser } from "@/lib/auth"

export default function PerfilPage() {
  const user = getUser()
  const [nombre,    setNombre]    = useState(user?.nombre || "")
  const [email,     setEmail]     = useState(user?.email  || "")
  const [savingP,   setSavingP]   = useState(false)
  const [okP,       setOkP]       = useState("")
  const [errP,      setErrP]      = useState("")

  const [pwActual,  setPwActual]  = useState("")
  const [pwNueva,   setPwNueva]   = useState("")
  const [pwConf,    setPwConf]    = useState("")
  const [showPw,    setShowPw]    = useState(false)
  const [savingPw,  setSavingPw]  = useState(false)
  const [okPw,      setOkPw]      = useState("")
  const [errPw,     setErrPw]     = useState("")

  const [trial,     setTrial]     = useState<{ dias_restantes: number; trial_hasta: string; vencido: boolean; plan: string } | null>(null)

  useEffect(() => {
    api.get("/trial").then(setTrial).catch(() => {})
  }, [])

  async function guardarPerfil() {
    setSavingP(true); setErrP(""); setOkP("")
    try {
      await api.patch("/perfil", { nombre, email })
      if (user) {
        const updated = { ...user, nombre, email }
        setUser(updated)
      }
      setOkP("Perfil actualizado correctamente")
      setTimeout(() => setOkP(""), 3000)
    } catch (e: unknown) {
      setErrP(e instanceof Error ? e.message : "Error al guardar")
    }
    setSavingP(false)
  }

  async function cambiarPassword() {
    if (pwNueva.length < 6) { setErrPw("Mínimo 6 caracteres"); return }
    if (pwNueva !== pwConf) { setErrPw("Las contraseñas no coinciden"); return }
    setSavingPw(true); setErrPw(""); setOkPw("")
    try {
      await api.patch("/perfil/password", { password_actual: pwActual, password_nueva: pwNueva })
      setOkPw("Contraseña cambiada correctamente")
      setPwActual(""); setPwNueva(""); setPwConf("")
      setTimeout(() => setOkPw(""), 3000)
    } catch (e: unknown) {
      setErrPw(e instanceof Error ? e.message : "Error al cambiar")
    }
    setSavingPw(false)
  }

  const initiales = nombre.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Mi Perfil</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Gestiona tu información personal y seguridad</p>
      </div>

      {/* Avatar + plan */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0F2B5B] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initiales}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-[#0F2B5B]">{nombre}</div>
          <div className="text-sm text-[#94A3B8]">{email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1E6FD9] capitalize">
              {user?.rol}
            </span>
            <span className="text-xs text-[#94A3B8]">· {user?.empresa}</span>
          </div>
        </div>
        {trial && (
          <div className={`text-center px-4 py-2 rounded-xl ${trial.vencido ? "bg-[#FEF2F2]" : "bg-[#F0FDF4]"}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Calendar size={12} style={{ color: trial.vencido ? "#B91C1C" : "#0D7A3E" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: trial.vencido ? "#B91C1C" : "#0D7A3E" }}>
                {trial.vencido ? "Trial vencido" : "Trial activo"}
              </span>
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: trial.vencido ? "#B91C1C" : "#0D7A3E" }}>
              {trial.vencido ? "0" : trial.dias_restantes}
            </div>
            <div className="text-[10px] text-[#94A3B8]">días restantes</div>
          </div>
        )}
      </div>

      {/* Datos personales */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-[#0F2B5B] mb-4 flex items-center gap-2">
          <User size={15} /> Información personal
        </h2>
        {okP && <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 mb-4 text-sm text-[#0D7A3E]"><Check size={14}/>{okP}</div>}
        {errP && <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4 text-sm text-[#B91C1C]"><AlertCircle size={14}/>{errP}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#475569] block mb-1.5">Nombre completo</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#475569] block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
            </div>
          </div>
        </div>
        <button onClick={guardarPerfil} disabled={savingP}
          className="mt-4 flex items-center gap-2 bg-[#1E6FD9] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1558B0] transition-colors disabled:opacity-50">
          {savingP ? <><Loader2 size={14} className="animate-spin"/>Guardando...</> : "Guardar cambios"}
        </button>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#0F2B5B] mb-4 flex items-center gap-2">
          <Lock size={15} /> Cambiar contraseña
        </h2>
        {okPw && <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 mb-4 text-sm text-[#0D7A3E]"><Check size={14}/>{okPw}</div>}
        {errPw && <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4 text-sm text-[#B91C1C]"><AlertCircle size={14}/>{errPw}</div>}
        <div className="space-y-3">
          {[
            { label: "Contraseña actual",   value: pwActual,  set: setPwActual },
            { label: "Nueva contraseña",    value: pwNueva,   set: setPwNueva  },
            { label: "Confirmar contraseña",value: pwConf,    set: setPwConf   },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-[#475569] block mb-1.5">{f.label}</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input type={showPw ? "text" : "password"} value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
                  {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={cambiarPassword} disabled={savingPw || !pwActual || !pwNueva}
          className="mt-4 flex items-center gap-2 bg-[#0F2B5B] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#1A3560] transition-colors disabled:opacity-50">
          {savingPw ? <><Loader2 size={14} className="animate-spin"/>Cambiando...</> : "Cambiar contraseña"}
        </button>
      </div>
    </div>
  )
}
