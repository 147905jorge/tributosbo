"use client"
import { useState, useEffect } from "react"
import { Building, Users, FileText, TrendingUp, RefreshCw, Check, AlertCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

type Empresa = {
  id: string; nombre: string; slug: string; plan: string
  trial_hasta: string; activo: number; creado_en: string
  usuarios: number; clientes: number; tramites: number
}

const PLAN_COLOR = { basico: "#475569", pro: "#1E6FD9", agencia: "#7C3AED", enterprise: "#0D7A3E" }

export default function SuperAdminPage() {
  const [empresas,  setEmpresas]  = useState<Empresa[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState("")
  const [ok,        setOk]        = useState("")
  const [selected,  setSelected]  = useState<Empresa | null>(null)
  const [newPlan,   setNewPlan]   = useState("")
  const [diasExtra, setDiasExtra] = useState(14)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true); setError("")
    try { setEmpresas(await api.get("/admin/empresas")) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Acceso denegado") }
    setLoading(false)
  }

  async function cambiarPlan(eid: string, plan: string) {
    setSaving(true)
    try {
      await api.patch(`/admin/empresas/${eid}/plan?plan=${plan}`)
      setEmpresas(prev => prev.map(e => e.id === eid ? { ...e, plan } : e))
      if (selected?.id === eid) setSelected(prev => prev ? { ...prev, plan } : null)
      setOk("Plan actualizado"); setTimeout(() => setOk(""), 2500)
    } catch {}
    setSaving(false)
  }

  async function extenderTrial(eid: string) {
    setSaving(true)
    try {
      const r = await api.patch(`/admin/empresas/${eid}/trial?dias=${diasExtra}`)
      setEmpresas(prev => prev.map(e => e.id === eid ? { ...e, trial_hasta: r.trial_hasta } : e))
      if (selected?.id === eid) setSelected(prev => prev ? { ...prev, trial_hasta: r.trial_hasta } : null)
      setOk(`Trial extendido hasta ${r.trial_hasta}`); setTimeout(() => setOk(""), 3000)
    } catch {}
    setSaving(false)
  }

  const totalTramites  = empresas.reduce((s, e) => s + e.tramites, 0)
  const totalClientes  = empresas.reduce((s, e) => s + e.clientes, 0)
  const totalUsuarios  = empresas.reduce((s, e) => s + e.usuarios, 0)

  if (loading) return <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
  if (error)   return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <AlertCircle size={40} className="text-[#B91C1C] mx-auto mb-4" />
      <p className="text-lg font-semibold text-[#0F2B5B]">Acceso restringido</p>
      <p className="text-sm text-[#94A3B8] mt-1">{error}</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Super Admin</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Panel de control de todas las empresas</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 text-sm text-[#475569] border border-[#E2E8F0] px-3 py-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {ok && <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 mb-5 text-sm text-[#0D7A3E] font-medium"><Check size={15}/>{ok}</div>}

      {/* Stats globales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Empresas registradas", value: empresas.length,  icon: Building,    color: "#0F2B5B" },
          { label: "Usuarios totales",     value: totalUsuarios,    icon: Users,       color: "#1E6FD9" },
          { label: "Clientes registrados", value: totalClientes,    icon: TrendingUp,  color: "#0D7A3E" },
          { label: "Trámites totales",     value: totalTramites,    icon: FileText,    color: "#7C3AED" },
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
                    <span>{e.tramites} trámites</span>
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

        {/* Detalle */}
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
                    { l: "Usuarios",  v: selected.usuarios  },
                    { l: "Clientes",  v: selected.clientes  },
                    { l: "Trámites",  v: selected.tramites  },
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
                    <div className="text-[#0F2B5B] font-medium font-mono">{selected.trial_hasta || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Cambiar plan */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[#0F2B5B] mb-3">Cambiar plan</h3>
                <div className="flex gap-2 flex-wrap mb-3">
                  {["basico","pro","agencia","enterprise"].map(p => (
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

              {/* Extender trial */}
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
    </div>
  )
}
