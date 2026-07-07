"use client"
import { useState, useEffect, useRef } from "react"
import { Building, Users, FileText, TrendingUp, RefreshCw, Check, AlertCircle, Loader2, Key, Copy, Trash2, RotateCcw, Plus, X } from "lucide-react"
import { api } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

const SUPER_EMAILS = ["app.jrv@gmail.com", "despachanteorientalsrl@gmail.com"]

type Empresa = {
  id: string; nombre: string; slug: string; plan: string
  trial_hasta: string; activo: number; creado_en: string
  usuarios: number; clientes: number; tramites: number
}

type ApiKey = {
  id: string; key: string; nombre: string; scope: string
  empresa_id: string | null; empresa_nombre: string | null
  requests_usados: number; limit_requests: number
  activo: number; expires: string | null; creado_en: string
}

const PLAN_COLOR = { basico: "#475569", pro: "#1E6FD9", agencia: "#7C3AED", enterprise: "#0D7A3E" }

export default function SuperAdminPage() {
  const router = useRouter()
  const [empresas,   setEmpresas]   = useState<Empresa[]>([])
  const [apiKeys,    setApiKeys]    = useState<ApiKey[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState("")
  const [ok,         setOk]         = useState("")
  const [selected,   setSelected]   = useState<Empresa | null>(null)
  const [newPlan,    setNewPlan]    = useState("")
  const [diasExtra,  setDiasExtra]  = useState(14)
  const [saving,     setSaving]     = useState(false)

  // API Keys form
  const [showForm,   setShowForm]   = useState(false)
  const [kNombre,    setKNombre]    = useState("")
  const [kEmpresa,   setKEmpresa]   = useState("")
  const [kScope,     setKScope]     = useState("declaraciones")
  const [kLimit,     setKLimit]     = useState(0)
  const [kExpires,   setKExpires]   = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied,     setCopied]     = useState(false)
  const createdKeyRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.replace("/login"); return }
    const user = getUser()
    if (user && !SUPER_EMAILS.includes(user.email)) {
      setError("No tienes permisos de superadmin"); setLoading(false); return
    }
    cargar()
  }, [])

  async function cargar() {
    setLoading(true); setError("")
    try {
      const [emp, keys] = await Promise.all([
        api.get("/admin/empresas"),
        api.get("/admin/api-keys"),
      ])
      setEmpresas(emp)
      setApiKeys(keys)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Acceso denegado")
    }
    setLoading(false)
  }

  function flash(msg: string) { setOk(msg); setTimeout(() => setOk(""), 3000) }

  async function cambiarPlan(eid: string, plan: string) {
    setSaving(true)
    try {
      await api.patch(`/admin/empresas/${eid}/plan?plan=${plan}`)
      setEmpresas(prev => prev.map(e => e.id === eid ? { ...e, plan } : e))
      if (selected?.id === eid) setSelected(prev => prev ? { ...prev, plan } : null)
      flash("Plan actualizado")
    } catch {}
    setSaving(false)
  }

  async function extenderTrial(eid: string) {
    setSaving(true)
    try {
      const r = await api.patch(`/admin/empresas/${eid}/trial?dias=${diasExtra}`)
      setEmpresas(prev => prev.map(e => e.id === eid ? { ...e, trial_hasta: r.trial_hasta } : e))
      if (selected?.id === eid) setSelected(prev => prev ? { ...prev, trial_hasta: r.trial_hasta } : null)
      flash(`Trial extendido hasta ${r.trial_hasta}`)
    } catch {}
    setSaving(false)
  }

  async function crearKey() {
    if (!kNombre.trim()) return
    setSaving(true)
    try {
      const r = await api.post("/admin/api-keys", {
        nombre: kNombre.trim(),
        empresa_id: kEmpresa || null,
        scope: kScope,
        limit_requests: kLimit,
        expires: kExpires || null,
      })
      setCreatedKey(r.key)
      setShowForm(false)
      setKNombre(""); setKEmpresa(""); setKScope("declaraciones"); setKLimit(0); setKExpires("")
      await cargar()
    } catch {}
    setSaving(false)
  }

  async function revocarKey(kid: string) {
    if (!confirm("Revocar esta API key?")) return
    try {
      await api.delete(`/admin/api-keys/${kid}`)
      setApiKeys(prev => prev.map(k => k.id === kid ? { ...k, activo: 0 } : k))
      flash("Key revocada")
    } catch {}
  }

  async function resetCounter(kid: string) {
    try {
      await api.patch(`/admin/api-keys/${kid}/reset-counter`)
      setApiKeys(prev => prev.map(k => k.id === kid ? { ...k, requests_usados: 0 } : k))
      flash("Contador reiniciado")
    } catch {}
  }

  async function copiarKey() {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalTramites = empresas.reduce((s, e) => s + e.tramites, 0)
  const totalClientes = empresas.reduce((s, e) => s + e.clientes, 0)
  const totalUsuarios = empresas.reduce((s, e) => s + e.usuarios, 0)
  const keysActivas   = apiKeys.filter(k => k.activo === 1).length
  const totalRequests = apiKeys.reduce((s, k) => s + k.requests_usados, 0)

  if (loading) return <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
  if (error) return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <AlertCircle size={40} className="text-[#B91C1C] mx-auto mb-4" />
      <p className="text-lg font-semibold text-[#0F2B5B]">Acceso restringido</p>
      <p className="text-sm text-[#94A3B8] mt-1">{error}</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Super Admin</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Panel de control global</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 text-sm text-[#475569] border border-[#E2E8F0] px-3 py-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {ok && (
        <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 text-sm text-[#0D7A3E] font-medium">
          <Check size={15} />{ok}
        </div>
      )}

      {/* Banner clave recien creada */}
      {createdKey && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-bold text-[#92400E]">API key creada. Copiala ahora, no se mostrara de nuevo.</p>
            <button onClick={() => setCreatedKey(null)} className="text-[#92400E] hover:opacity-70 ml-4"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-2">
            <input ref={createdKeyRef} readOnly value={createdKey}
              className="flex-1 font-mono text-sm bg-white border border-[#FDE68A] rounded-lg px-3 py-2 text-[#0F2B5B] select-all" />
            <button onClick={copiarKey}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ background: copied ? "#0D7A3E" : "#fff", color: copied ? "#fff" : "#475569", borderColor: copied ? "#0D7A3E" : "#E2E8F0" }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {/* ==================== EMPRESAS ==================== */}
      <section>
        <h2 className="text-base font-bold text-[#0F2B5B] mb-4">Empresas</h2>

        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { label: "Empresas registradas", value: empresas.length, icon: Building,   color: "#0F2B5B" },
            { label: "Usuarios totales",     value: totalUsuarios,   icon: Users,      color: "#1E6FD9" },
            { label: "Clientes registrados", value: totalClientes,   icon: TrendingUp, color: "#0D7A3E" },
            { label: "Tramites totales",     value: totalTramites,   icon: FileText,   color: "#7C3AED" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-xs text-[#94A3B8]">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* Lista empresas */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <span className="text-xs font-semibold text-[#475569]">{empresas.length} empresa{empresas.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-[#F1F5F9] max-h-[500px] overflow-y-auto">
              {empresas.map(e => {
                const hoy = new Date().toISOString().split("T")[0]
                const vencido = e.trial_hasta && e.trial_hasta < hoy
                return (
                  <button key={e.id} onClick={() => { setSelected(e); setNewPlan(e.plan) }}
                    className="w-full text-left px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                    style={{ borderLeft: selected?.id === e.id ? "3px solid #1E6FD9" : "3px solid transparent" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[#0F2B5B] truncate pr-2">{e.nombre}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white capitalize flex-shrink-0"
                        style={{ background: PLAN_COLOR[e.plan as keyof typeof PLAN_COLOR] || "#475569" }}>
                        {e.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                      <span>{e.usuarios} usuarios</span>
                      <span>·</span>
                      <span>{e.tramites} tramites</span>
                      <span>·</span>
                      <span className={vencido ? "text-[#B91C1C] font-semibold" : ""}>
                        {vencido ? "Trial vencido" : `Trial: ${e.trial_hasta}`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Detalle empresa */}
          <div className="lg:col-span-3">
            {!selected ? (
              <div className="h-full bg-white border border-dashed border-[#E2E8F0] rounded-xl flex items-center justify-center p-8 min-h-[300px] text-center">
                <p className="text-[#94A3B8] text-sm">Selecciona una empresa para gestionar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <h2 className="text-lg font-bold text-[#0F2B5B] mb-1">{selected.nombre}</h2>
                  <p className="text-xs font-mono text-[#94A3B8] mb-4">{selected.slug}</p>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { l: "Usuarios", v: selected.usuarios },
                      { l: "Clientes", v: selected.clientes },
                      { l: "Tramites", v: selected.tramites },
                    ].map(s => (
                      <div key={s.l} className="bg-[#F8FAFC] rounded-lg p-3 text-center">
                        <div className="text-xl font-bold font-mono text-[#0F2B5B]">{s.v}</div>
                        <div className="text-xs text-[#94A3B8]">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#F8FAFC] rounded-lg p-3">
                      <div className="text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider mb-1">Registrado</div>
                      <div className="text-[#0F2B5B] font-medium">{selected.creado_en?.split("T")[0]}</div>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-lg p-3">
                      <div className="text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider mb-1">Trial hasta</div>
                      <div className="text-[#0F2B5B] font-medium font-mono">{selected.trial_hasta || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#0F2B5B] mb-3">Cambiar plan</h3>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {["basico", "pro", "agencia", "enterprise"].map(p => (
                      <button key={p} onClick={() => setNewPlan(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-colors"
                        style={{ background: newPlan === p ? PLAN_COLOR[p as keyof typeof PLAN_COLOR] : "#fff", color: newPlan === p ? "#fff" : "#475569", borderColor: newPlan === p ? PLAN_COLOR[p as keyof typeof PLAN_COLOR] : "#E2E8F0" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => cambiarPlan(selected.id, newPlan)} disabled={saving || newPlan === selected.plan}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-[#0F2B5B] text-white hover:bg-[#1A3560] transition-colors disabled:opacity-40">
                    {saving ? "Guardando..." : "Aplicar plan"}
                  </button>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[#0F2B5B] mb-3">Extender trial</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {[7, 14, 30].map(d => (
                        <button key={d} onClick={() => setDiasExtra(d)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                          style={{ background: diasExtra === d ? "#1E6FD9" : "#fff", color: diasExtra === d ? "#fff" : "#475569", borderColor: diasExtra === d ? "#1E6FD9" : "#E2E8F0" }}>
                          +{d}d
                        </button>
                      ))}
                    </div>
                    <button onClick={() => extenderTrial(selected.id)} disabled={saving}
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-[#0D7A3E] text-white hover:bg-[#0a6233] transition-colors disabled:opacity-40">
                      Extender
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== API KEYS ==================== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#0F2B5B]">API Keys</h2>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg bg-[#0F2B5B] text-white hover:bg-[#1A3560] transition-colors">
            <Plus size={14} /> Nueva key
          </button>
        </div>

        {/* Stats keys */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: "Keys activas",    value: keysActivas,    icon: Key,        color: "#0F2B5B" },
            { label: "Keys totales",    value: apiKeys.length, icon: Key,        color: "#475569" },
            { label: "Requests totales", value: totalRequests, icon: TrendingUp, color: "#1E6FD9" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-xs text-[#94A3B8]">{s.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Formulario nueva key */}
        {showForm && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0F2B5B]">Nueva API key</h3>
              <button onClick={() => setShowForm(false)} className="text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#475569] mb-1">Nombre / descripcion *</label>
                <input value={kNombre} onChange={e => setKNombre(e.target.value)}
                  placeholder="Ej: Cliente ABC - Integracion DAM"
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F2B5B] focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Empresa (opcional)</label>
                <select value={kEmpresa} onChange={e => setKEmpresa(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F2B5B] focus:outline-none focus:ring-2 focus:ring-[#1E6FD9] bg-white">
                  <option value="">Sin empresa</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Scope</label>
                <select value={kScope} onChange={e => setKScope(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F2B5B] focus:outline-none focus:ring-2 focus:ring-[#1E6FD9] bg-white">
                  <option value="declaraciones">declaraciones</option>
                  <option value="full">full</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Limite requests (0 = ilimitado)</label>
                <input type="number" min={0} value={kLimit} onChange={e => setKLimit(parseInt(e.target.value) || 0)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F2B5B] focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Expiracion (opcional)</label>
                <input type="date" value={kExpires} onChange={e => setKExpires(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F2B5B] focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]" />
              </div>
            </div>
            <button onClick={crearKey} disabled={saving || !kNombre.trim()}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#1E6FD9] text-white hover:bg-[#1558b0] transition-colors disabled:opacity-40">
              {saving ? "Creando..." : "Crear key"}
            </button>
          </div>
        )}

        {/* Tabla keys */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#94A3B8]">No hay API keys creadas</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Scope</th>
                    <th className="px-4 py-3 text-right">Requests</th>
                    <th className="px-4 py-3 text-left">Expira</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {apiKeys.map(k => {
                    const hoy = new Date().toISOString().split("T")[0]
                    const expirado = k.expires && k.expires < hoy
                    const limitado = k.limit_requests > 0
                    const agotado  = limitado && k.requests_usados >= k.limit_requests
                    return (
                      <tr key={k.id} className={k.activo === 0 ? "opacity-40" : "hover:bg-[#F8FAFC]"}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0F2B5B]">{k.nombre}</div>
                          <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">decl-****</div>
                        </td>
                        <td className="px-4 py-3 text-[#475569]">{k.empresa_nombre ?? <span className="text-[#CBD5E1]">—</span>}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold bg-[#EFF6FF] text-[#1E6FD9] px-2 py-0.5 rounded-full">{k.scope}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <span className={agotado ? "text-[#B91C1C] font-bold" : "text-[#0F2B5B]"}>
                            {k.requests_usados}{limitado ? `/${k.limit_requests}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {k.expires
                            ? <span className={expirado ? "text-[#B91C1C] font-semibold text-xs" : "text-xs text-[#475569]"}>{expirado ? "Expirada" : k.expires}</span>
                            : <span className="text-[#CBD5E1] text-xs">Sin limite</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: k.activo ? "#F0FDF4" : "#FEF2F2", color: k.activo ? "#0D7A3E" : "#B91C1C" }}>
                            {k.activo ? "Activa" : "Revocada"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => resetCounter(k.id)} title="Reiniciar contador"
                              className="p-1.5 rounded-lg text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-30"
                              disabled={k.requests_usados === 0}>
                              <RotateCcw size={13} />
                            </button>
                            {k.activo === 1 && (
                              <button onClick={() => revocarKey(k.id)} title="Revocar key"
                                className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
