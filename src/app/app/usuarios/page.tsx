"use client"
import { useState, useEffect } from "react"
import { Users, Plus, Trash2, X, Loader2, Shield, User, Check } from "lucide-react"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"

type UsuarioRow = { id: string; nombre: string; email: string; rol: string; activo: number; creado_en: string }

const ROL_COLOR = { admin: "#0F2B5B", operador: "#1E6FD9" }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState("")
  const [ok,       setOk]       = useState("")
  const me = getUser()

  const [nombre,   setNombre]   = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [rol,      setRol]      = useState("operador")

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try { setUsuarios(await api.get("/usuarios")) } catch {}
    setLoading(false)
  }

  async function invitar() {
    if (!nombre || !email || !password) { setError("Completa todos los campos"); return }
    setSaving(true); setError("")
    try {
      await api.post("/usuarios/invitar", { nombre, email, password, rol })
      setOk("Usuario invitado correctamente")
      setShowForm(false)
      setNombre(""); setEmail(""); setPassword(""); setRol("operador")
      cargar()
      setTimeout(() => setOk(""), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al invitar")
    }
    setSaving(false)
  }

  async function eliminar(uid: string, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return
    try {
      await api.delete(`/usuarios/${uid}`)
      setUsuarios(prev => prev.filter(u => u.id !== uid))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error")
    }
  }

  const activos = usuarios.filter(u => u.activo)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Usuarios</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Gestiona los miembros de tu agencia</p>
        </div>
        {me?.rol === "admin" && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#1E6FD9] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1558B0] transition-colors">
            <Plus size={16} /> Invitar usuario
          </button>
        )}
      </div>

      {ok && (
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 mb-5 text-sm text-[#0D7A3E] font-medium">
          <Check size={15} /> {ok}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total usuarios",  value: activos.length,                              color: "#0F2B5B" },
          { label: "Administradores", value: activos.filter(u => u.rol === "admin").length,   color: "#C8500A" },
          { label: "Operadores",      value: activos.filter(u => u.rol === "operador").length, color: "#1E6FD9" },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
            <div className="text-xs text-[#94A3B8] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#0F2B5B]">Miembros del equipo</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
        ) : activos.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">No hay usuarios aún</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {activos.map(u => (
              <div key={u.id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                       style={{ background: ROL_COLOR[u.rol as keyof typeof ROL_COLOR] || "#475569" }}>
                    {u.nombre.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F2B5B] flex items-center gap-2">
                      {u.nombre}
                      {u.id === me?.id && <span className="text-[10px] text-[#94A3B8] font-normal">(tú)</span>}
                    </div>
                    <div className="text-xs text-[#94A3B8]">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white capitalize"
                        style={{ background: ROL_COLOR[u.rol as keyof typeof ROL_COLOR] || "#475569" }}>
                    {u.rol}
                  </span>
                  {me?.rol === "admin" && u.id !== me?.id && (
                    <button onClick={() => eliminar(u.id, u.nombre)}
                      className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info de planes */}
      <div className="mt-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-[#1E6FD9] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#475569]">
          <span className="font-semibold text-[#1E6FD9]">Roles: </span>
          El <strong>Administrador</strong> puede invitar usuarios, cambiar configuración y ver reportes.
          El <strong>Operador</strong> puede usar todas las herramientas pero no administrar la cuenta.
        </div>
      </div>

      {/* Modal invitar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F2B5B]">Invitar usuario</h2>
              <button onClick={() => { setShowForm(false); setError("") }} className="text-[#94A3B8] hover:text-[#475569]"><X size={20} /></button>
            </div>

            {error && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3 mb-4 text-sm text-[#B91C1C]">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Nombre completo *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@agencia.com"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Contraseña temporal *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["operador", "admin"] as const).map(r => (
                    <button key={r} onClick={() => setRol(r)}
                      className="flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors capitalize"
                      style={{ borderColor: rol === r ? ROL_COLOR[r] : "#E2E8F0", background: rol === r ? ROL_COLOR[r] + "15" : "#fff", color: rol === r ? ROL_COLOR[r] : "#475569" }}>
                      {r === "admin" ? <Shield size={14} /> : <User size={14} />} {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setError("") }}
                className="border border-[#E2E8F0] text-[#475569] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                Cancelar
              </button>
              <button onClick={invitar} disabled={saving}
                className="bg-[#1E6FD9] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#1558B0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Invitando...</> : "Invitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
