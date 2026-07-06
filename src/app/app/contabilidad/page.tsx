"use client"
import { useState, useEffect } from "react"
import { DollarSign, Plus, X, Check, Ban, RefreshCw, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

type Concepto = { id?: string; descripcion: string; monto: number; orden: number }
type Planilla = {
  id: string; nro: number; gestion: string; estado: "Pendiente"|"Pagado"|"Anulado"|"Parcial"
  tipo: string; dim: string; tramite_id: string; tramite_dim: string
  cliente_id: string; cliente_nombre: string
  total: number; total_anticipo: number; saldo_pendiente: number
  fecha_emision: string; fecha_limite: string; fecha_pago: string
  observaciones: string; conceptos: Concepto[]
}

const ESTADOS = ["Pendiente","Pagado","Anulado","Parcial"]
const TIPOS   = ["Cotizacion","Planilla de cobro","Presupuesto","Liquidacion de tributos","Honorarios"]
const CONCEPTO_SUGERIDOS = [
  "Honorarios de despacho","Almacenaje","Gestion documental","Transporte interno",
  "Tramitacion SENASAG","Permisos previos","Fotocopias y gastos varios"
]

const ESTADO_STYLE: Record<string, string> = {
  Pendiente: "background:#FEF3C7;color:#92400E",
  Pagado:    "background:#D1FAE5;color:#065F46",
  Anulado:   "background:#FEE2E2;color:#991B1B",
  Parcial:   "background:#DBEAFE;color:#1E40AF",
}

const fmt = (v: number) => "Bs " + (v||0).toLocaleString("es-BO", { minimumFractionDigits: 2 })
const fmtFecha = (s: string) => s ? s.substring(0, 10) : "-"

const FORM_INIT = {
  gestion: new Date().getFullYear().toString(),
  tipo: "Planilla de cobro", dim: "", tramite_id: "", cliente_id: "",
  total_anticipo: 0, fecha_limite: "", observaciones: "",
  conceptos: CONCEPTO_SUGERIDOS.slice(0, 3).map((d, i) => ({ descripcion: d, monto: 0, orden: i }))
}

export default function ContabilidadPage() {
  const [planillas,  setPlanillas]  = useState<Planilla[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState<Planilla | null>(null)
  const [filtroEst,  setFiltroEst]  = useState("todos")
  const [filtroGest, setFiltroGest] = useState("")
  const [resumen,    setResumen]    = useState<Record<string,number>>({})
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState(FORM_INIT)
  const [saving,     setSaving]     = useState(false)
  const [tramites,   setTramites]   = useState<{id:string;dim:string;gestion:string}[]>([])
  const [clientes,   setClientes]   = useState<{id:string;nombre:string}[]>([])

  useEffect(() => { cargar(); cargarAux() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [p, r] = await Promise.all([
        api.get("/contabilidad/planillas"),
        api.get("/contabilidad/resumen"),
      ])
      setPlanillas(p); setResumen(r)
    } catch {}
    setLoading(false)
  }

  async function cargarAux() {
    try {
      const [t, c] = await Promise.all([api.get("/tramites"), api.get("/clientes")])
      setTramites(t); setClientes(c)
    } catch {}
  }

  const visible = planillas.filter(p => {
    if (filtroEst !== "todos" && p.estado !== filtroEst) return false
    if (filtroGest && p.gestion !== filtroGest) return false
    return true
  })

  const gestiones = [...new Set(planillas.map(p => p.gestion).filter(Boolean))].sort().reverse()

  function addConcepto() {
    setForm(f => ({ ...f, conceptos: [...f.conceptos, { descripcion: "", monto: 0, orden: f.conceptos.length }] }))
  }
  function removeConcepto(i: number) {
    setForm(f => ({ ...f, conceptos: f.conceptos.filter((_,j) => j !== i) }))
  }
  function updConcepto(i: number, field: "descripcion"|"monto", v: string) {
    setForm(f => ({ ...f, conceptos: f.conceptos.map((c,j) => j !== i ? c : { ...c, [field]: field === "monto" ? parseFloat(v)||0 : v }) }))
  }

  const totalForm = form.conceptos.reduce((s, c) => s + c.monto, 0)
  const saldoForm = totalForm - form.total_anticipo

  async function guardar() {
    if (!form.dim.trim() && !form.tramite_id) return
    setSaving(true)
    try {
      await api.post("/contabilidad/planillas", form)
      setShowForm(false); setForm(FORM_INIT); cargar()
    } catch {}
    setSaving(false)
  }

  async function marcarPagado(id: string) {
    try { await api.patch(`/contabilidad/planillas/${id}`, { estado: "Pagado", fecha_pago: new Date().toISOString().substring(0,10) }); cargar() } catch {}
  }
  async function anular(id: string) {
    if (!confirm("Anular esta planilla?")) return
    try { await api.post(`/contabilidad/planillas/${id}/anular`, {}); cargar() } catch {}
  }

  const card = (label: string, value: string, color: string) => (
    <div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.08)", minWidth: 160 }}>
      <div style={{ fontSize: ".75rem", color: "#6b7280", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: 700, color }}>{value}</div>
    </div>
  )

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <DollarSign size={22} color="#1E6FD9" />
          <h1 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Contabilidad</h1>
        </div>
        <button onClick={() => setShowForm(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#1E6FD9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: ".88rem" }}>
          <Plus size={15} /> Nueva Planilla
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {card("Pendiente por cobrar", fmt(resumen.total_pendiente || 0), "#D97706")}
        {card("Total cobrado", fmt(resumen.total_pagado || 0), "#0D7A3E")}
        {card("Planillas activas", String(resumen.total_planillas || 0), "#1E6FD9")}
        {resumen.planillas_vencidas > 0 && card("Vencidas", String(resumen.planillas_vencidas), "#B91C1C")}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)}
          style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 12px", fontSize: ".85rem" }}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroGest} onChange={e => setFiltroGest(e.target.value)}
          style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 12px", fontSize: ".85rem" }}>
          <option value="">Todas las gestiones</option>
          {gestiones.map(g => <option key={g}>{g}</option>)}
        </select>
        <button onClick={cargar} style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", background: "#fff", cursor: "pointer" }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}><Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} /></div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".83rem" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f0f0f0" }}>
                {["Nro","Gestion","Tipo / DIM","Cliente","Total","Anticipo","Saldo","Estado","Vence",""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Sin planillas</td></tr>
              ) : visible.map(p => (
                <tr key={p.id} onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer", background: selected?.id === p.id ? "#eff6ff" : undefined }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1E6FD9" }}>#{p.nro || "-"}</td>
                  <td style={{ padding: "10px 14px" }}>{p.gestion}</td>
                  <td style={{ padding: "10px 14px" }}><div style={{ fontWeight: 600 }}>{p.tipo}</div><div style={{ color: "#6b7280", fontSize: ".78rem" }}>{p.dim}</div></td>
                  <td style={{ padding: "10px 14px" }}>{p.cliente_nombre || "-"}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{fmt(p.total)}</td>
                  <td style={{ padding: "10px 14px", color: "#0D7A3E" }}>{fmt(p.total_anticipo)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: p.saldo_pendiente > 0 ? "#D97706" : "#0D7A3E" }}>{fmt(p.saldo_pendiente)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "3px 8px", borderRadius: 12, fontSize: ".75rem", fontWeight: 600, ...Object.fromEntries((ESTADO_STYLE[p.estado]||"").split(";").filter(Boolean).map(s => s.split(":").map(x => x.trim()) as [string,string])) }}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>{fmtFecha(p.fecha_limite)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {p.estado === "Pendiente" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={e => { e.stopPropagation(); marcarPagado(p.id) }} title="Marcar pagado"
                          style={{ background: "#D1FAE5", color: "#065F46", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                          <Check size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); anular(p.id) }} title="Anular"
                          style={{ background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                          <Ban size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalle expandido */}
      {selected && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.1)", padding: 20, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong>Planilla #{selected.nro} — Detalle de conceptos</strong>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".84rem" }}>
            <thead><tr style={{ background: "#f9fafb" }}>
              <th style={{ padding: "8px 12px", textAlign: "left" }}>Descripcion</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>Monto</th>
            </tr></thead>
            <tbody>
              {(selected.conceptos || []).map((c, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "7px 12px" }}>{c.descripcion}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right" }}>{fmt(c.monto)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #e5e7eb", fontWeight: 700 }}>
                <td style={{ padding: "8px 12px" }}>TOTAL</td>
                <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(selected.total)}</td>
              </tr>
              {selected.total_anticipo > 0 && <tr>
                <td style={{ padding: "4px 12px", color: "#0D7A3E" }}>Anticipo recibido</td>
                <td style={{ padding: "4px 12px", textAlign: "right", color: "#0D7A3E" }}>- {fmt(selected.total_anticipo)}</td>
              </tr>}
              {selected.saldo_pendiente > 0 && <tr style={{ fontWeight: 700, color: "#D97706" }}>
                <td style={{ padding: "4px 12px" }}>Saldo pendiente</td>
                <td style={{ padding: "4px 12px", textAlign: "right" }}>{fmt(selected.saldo_pendiente)}</td>
              </tr>}
            </tbody>
          </table>
          {selected.observaciones && <p style={{ marginTop: 10, fontSize: ".83rem", color: "#6b7280" }}>Obs: {selected.observaciones}</p>}
          {selected.fecha_pago && <p style={{ fontSize: ".83rem", color: "#0D7A3E" }}>Pagado el: {fmtFecha(selected.fecha_pago)}</p>}
        </div>
      )}

      {/* Modal nueva planilla */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Nueva Planilla</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                ["Gestion (ano)", "gestion", "text"],
                ["DIM / Referencia", "dim", "text"],
                ["Tipo", "tipo", "select"],
                ["Fecha limite", "fecha_limite", "date"],
              ].map(([label, field, type]) => (
                <label key={field as string} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem" }}>
                  {label}
                  {type === "select" ? (
                    <select value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }}>
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input type={type as string} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }} />
                  )}
                </label>
              ))}
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem", marginBottom: 12 }}>
              Tramite (opcional)
              <select value={form.tramite_id} onChange={e => setForm(f => ({ ...f, tramite_id: e.target.value }))}
                style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }}>
                <option value="">Sin tramite asociado</option>
                {tramites.map(t => <option key={t.id} value={t.id}>{t.dim} ({t.gestion})</option>)}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem", marginBottom: 12 }}>
              Cliente
              <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }}>
                <option value="">Sin cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: ".83rem", fontWeight: 600 }}>Conceptos</span>
                <button onClick={addConcepto} style={{ background: "#eff6ff", color: "#1E6FD9", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: ".8rem", cursor: "pointer" }}>+ Agregar</button>
              </div>
              {form.conceptos.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input list={`sug-${i}`} placeholder="Descripcion" value={c.descripcion}
                    onChange={e => updConcepto(i, "descripcion", e.target.value)}
                    style={{ flex: 3, border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 10px", fontSize: ".82rem" }} />
                  <datalist id={`sug-${i}`}>{CONCEPTO_SUGERIDOS.map(s => <option key={s} value={s} />)}</datalist>
                  <input type="number" placeholder="Monto" value={c.monto || ""}
                    onChange={e => updConcepto(i, "monto", e.target.value)}
                    style={{ flex: 2, border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 10px", fontSize: ".82rem" }} />
                  <button onClick={() => removeConcepto(i)} style={{ background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "6px 8px", cursor: "pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <strong style={{ fontSize: ".85rem" }}>Total: {fmt(totalForm)}</strong>
              </div>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem", marginBottom: 12 }}>
              Anticipo recibido (Bs)
              <input type="number" value={form.total_anticipo || ""} onChange={e => setForm(f => ({ ...f, total_anticipo: parseFloat(e.target.value)||0 }))}
                style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem" }} />
            </label>

            {saldoForm > 0 && <div style={{ background: "#FEF3C7", borderRadius: 8, padding: "8px 14px", fontSize: ".84rem", marginBottom: 12, color: "#92400E" }}>
              Saldo pendiente: <strong>{fmt(saldoForm)}</strong>
            </div>}

            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".83rem", marginBottom: 20 }}>
              Observaciones
              <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                rows={2} style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: ".84rem", resize: "vertical" }} />
            </label>

            <button onClick={guardar} disabled={saving || totalForm === 0}
              style={{ width: "100%", background: "#1E6FD9", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving || totalForm === 0 ? .6 : 1 }}>
              {saving ? "Guardando..." : `Crear Planilla — ${fmt(totalForm)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
