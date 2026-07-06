"use client"
import { useState, useEffect } from "react"
import { Archive, Plus, X, RefreshCw, Search, Loader2, BookOpen, RotateCcw } from "lucide-react"
import { api } from "@/lib/api"

type Archivo = {
  id: string; tramite_id: string; empresa_id: string
  dim: string; tramite_tipo: string; gestion: string; aduana: string; mercaderia: string
  cliente_nombre: string
  estante: string; posicion: string
  estado: "Disponible"|"Prestado"
  prestado_a: string; fecha_prestamo: string; fecha_devolucion: string
  fecha_archivado: string; observaciones: string
}
type Tramite = { id: string; dim: string; gestion: string; estado: string; activo: number }

const ESTADO_STYLE: Record<string, { bg: string; color: string }> = {
  Disponible: { bg: "#D1FAE5", color: "#065F46" },
  Prestado:   { bg: "#FEF3C7", color: "#92400E" },
}

const fmt = (s: string) => s ? s.substring(0, 10) : "-"

export default function ArchivoPage() {
  const [archivos,   setArchivos]   = useState<Archivo[]>([])
  const [loading,    setLoading]    = useState(true)
  const [buscar,     setBuscar]     = useState("")
  const [filtroEst,  setFiltroEst]  = useState("todos")
  const [selected,   setSelected]   = useState<Archivo | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [showPrestar, setShowPrestar] = useState<string | null>(null)
  const [tramites,   setTramites]   = useState<Tramite[]>([])
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState({ tramite_id: "", estante: "", posicion: "", observaciones: "" })
  const [prestForm,  setPrestForm]  = useState({ prestado_a: "", observaciones: "" })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [a, t] = await Promise.all([api.get("/archivo"), api.get("/tramites")])
      setArchivos(a); setTramites(t)
    } catch {}
    setLoading(false)
  }

  const archivadasIds = new Set(archivos.map(a => a.tramite_id))
  const tramitesArchivables = tramites.filter(t =>
    t.activo && ["Retirada","Anulado","Con Levante","Tributo Pagado"].includes(t.estado) && !archivadasIds.has(t.id)
  )

  const visible = archivos.filter(a => {
    if (filtroEst !== "todos" && a.estado !== filtroEst) return false
    if (buscar) {
      const b = buscar.toLowerCase()
      return (a.dim||"").toLowerCase().includes(b) || (a.cliente_nombre||"").toLowerCase().includes(b)
        || (a.estante||"").toLowerCase().includes(b) || (a.prestado_a||"").toLowerCase().includes(b)
    }
    return true
  })

  async function archivar() {
    if (!form.tramite_id) return
    setSaving(true)
    try { await api.post("/archivo", form); setShowForm(false); setForm({ tramite_id:"", estante:"", posicion:"", observaciones:"" }); cargar() } catch {}
    setSaving(false)
  }

  async function prestar(aid: string) {
    if (!prestForm.prestado_a.trim()) return
    setSaving(true)
    try { await api.post(`/archivo/${aid}/prestar`, prestForm); setShowPrestar(null); setPrestForm({ prestado_a:"", observaciones:"" }); cargar() } catch {}
    setSaving(false)
  }

  async function devolver(aid: string) {
    if (!confirm("Confirmar devolucion del expediente?")) return
    try { await api.post(`/archivo/${aid}/devolver`, {}); cargar() } catch {}
  }

  const disp  = archivos.filter(a => a.estado === "Disponible").length
  const prest = archivos.filter(a => a.estado === "Prestado").length

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Archive size={22} color="#1E6FD9" />
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Archivo Fisico</h1>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1E6FD9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: ".88rem" }}>
          <Plus size={15} /> Archivar Expediente
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total expedientes", v: archivos.length, color: "#1E6FD9" },
          { label: "Disponibles",       v: disp,            color: "#0D7A3E" },
          { label: "Prestados",         v: prest,           color: "#D97706" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", minWidth: 140 }}>
            <div style={{ fontSize: ".73rem", color: "#6b7280" }}>{s.label}</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: s.color }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar DIM, cliente, estante..."
            style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px 7px 32px", fontSize: ".84rem", boxSizing: "border-box" }} />
        </div>
        <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)}
          style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 12px", fontSize: ".85rem" }}>
          <option value="todos">Todos</option>
          <option value="Disponible">Disponibles</option>
          <option value="Prestado">Prestados</option>
        </select>
        <button onClick={cargar} style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", background: "#fff", cursor: "pointer" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}><Loader2 size={24} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#9ca3af", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
              Sin expedientes archivados
            </div>
          ) : visible.map(a => (
            <div key={a.id} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: ".95rem" }}>{a.dim}</span>
                    <span style={{ fontSize: ".73rem", fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                      background: ESTADO_STYLE[a.estado]?.bg, color: ESTADO_STYLE[a.estado]?.color }}>
                      {a.estado}
                    </span>
                    <span style={{ fontSize: ".78rem", color: "#6b7280" }}>{a.gestion} · {a.tramite_tipo}</span>
                  </div>
                  <div style={{ fontSize: ".82rem", color: "#374151" }}>{a.cliente_nombre || "Sin cliente"} · {a.aduana}</div>
                  <div style={{ fontSize: ".79rem", color: "#9ca3af", marginTop: 2 }}>
                    Estante: <strong>{a.estante || "—"}</strong> · Pos: <strong>{a.posicion || "—"}</strong> · Archivado: {fmt(a.fecha_archivado)}
                  </div>
                  {a.estado === "Prestado" && (
                    <div style={{ fontSize: ".79rem", color: "#D97706", marginTop: 2 }}>
                      Prestado a: <strong>{a.prestado_a}</strong> el {fmt(a.fecha_prestamo)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {a.estado === "Disponible" && (
                    <button onClick={() => { setShowPrestar(a.id); setSelected(a) }}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEF3C7", color: "#92400E", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: ".81rem", fontWeight: 600, cursor: "pointer" }}>
                      <BookOpen size={13} /> Prestar
                    </button>
                  )}
                  {a.estado === "Prestado" && (
                    <button onClick={() => devolver(a.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "#D1FAE5", color: "#065F46", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: ".81rem", fontWeight: 600, cursor: "pointer" }}>
                      <RotateCcw size={13} /> Devolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal archivar */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Archivar Expediente</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem" }}>
                Tramite (solo estados: Retirada, Anulado, Con Levante)
                <select value={form.tramite_id} onChange={e => setForm(f => ({ ...f, tramite_id: e.target.value }))}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }}>
                  <option value="">Seleccionar tramite...</option>
                  {tramitesArchivables.map(t => <option key={t.id} value={t.id}>{t.dim} — {t.estado} ({t.gestion})</option>)}
                </select>
                {tramitesArchivables.length === 0 && <span style={{ fontSize: ".78rem", color: "#9ca3af" }}>No hay tramites en estado archivable</span>}
              </label>
              {[
                ["Estante / Caja", "estante"],
                ["Posicion / Referencia", "posicion"],
                ["Observaciones", "observaciones"],
              ].map(([label, field]) => (
                <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem" }}>
                  {label}
                  <input value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }} />
                </label>
              ))}
            </div>
            <button onClick={archivar} disabled={saving || !form.tramite_id}
              style={{ marginTop: 20, width: "100%", background: "#1E6FD9", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 600, cursor: saving || !form.tramite_id ? "not-allowed" : "pointer", opacity: saving || !form.tramite_id ? .6 : 1 }}>
              {saving ? "Archivando..." : "Archivar"}
            </button>
          </div>
        </div>
      )}

      {/* Modal prestar */}
      {showPrestar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Prestar expediente</h2>
              <button onClick={() => setShowPrestar(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 12, fontSize: ".83rem", color: "#6b7280" }}>
              DIM: <strong style={{ color: "#111" }}>{selected?.dim}</strong>
            </div>
            {[["Prestado a (nombre)", "prestado_a"], ["Observaciones", "observaciones"]].map(([label, field]) => (
              <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem", marginBottom: 12 }}>
                {label}
                <input value={(prestForm as any)[field]} onChange={e => setPrestForm(f => ({ ...f, [field]: e.target.value }))}
                  style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }} />
              </label>
            ))}
            <button onClick={() => prestar(showPrestar!)} disabled={saving || !prestForm.prestado_a.trim()}
              style={{ width: "100%", background: "#D97706", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontWeight: 600, cursor: "pointer", opacity: saving || !prestForm.prestado_a.trim() ? .6 : 1 }}>
              {saving ? "Registrando..." : "Registrar Prestamo"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
