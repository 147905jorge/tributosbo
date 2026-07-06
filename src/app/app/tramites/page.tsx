"use client"
import { useState, useEffect } from "react"
import { Shield, Search, Plus, RefreshCw, Clock, FileText, MessageCircle, X, Loader2, Trash2, Check } from "lucide-react"
import { api } from "@/lib/api"

type Canal = "VERDE"|"AMARILLO"|"ROJO"|"PENDIENTE"|"LEVANTADO"|"OBSERVADO"
type Tramite = {
  id: string; dim: string; cliente_id: string|null; cliente_nombre: string|null
  tipo: string; canal: Canal; aduana: string; mercaderia: string; fecha: string; creado_en: string
  estado: string; gestion: string; nro_carpeta: string; descripcion: string
}
const ESTADOS_TRAMITE = ["Recibido","En Proceso","Validado","Con Levante","Tributo Pagado","Retirada","Anulado"]
const ESTADO_COLOR: Record<string,string> = {
  Recibido:"#475569", "En Proceso":"#1E6FD9", Validado:"#0891b2",
  "Con Levante":"#0D7A3E", "Tributo Pagado":"#7c3aed", Retirada:"#6b7280", Anulado:"#B91C1C"
}
type Evento = { id: string; tramite_id: string; estado: string; obs: string; creado_en: string }

const CANAL_COLOR: Record<Canal, string> = {
  VERDE:"#0D7A3E", AMARILLO:"#D97706", ROJO:"#B91C1C",
  PENDIENTE:"#475569", LEVANTADO:"#1E6FD9", OBSERVADO:"#C8500A",
}
const CANALES: Canal[] = ["PENDIENTE","VERDE","AMARILLO","ROJO","LEVANTADO","OBSERVADO"]

const FORM_INIT = { dim:"", tipo:"Importacion", canal:"PENDIENTE" as Canal, aduana:"", mercaderia:"", fecha:"", gestion: new Date().getFullYear().toString(), nro_carpeta:"", descripcion:"" }

export default function TramitesPage() {
  const [tramites,  setTramites]  = useState<Tramite[]>([])
  const [eventos,   setEventos]   = useState<Evento[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<Tramite | null>(null)
  const [filtro,    setFiltro]    = useState<Canal | "TODOS">("TODOS")
  const [query,     setQuery]     = useState("")
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(FORM_INIT)
  const [saving,    setSaving]    = useState(false)
  const [nuevoEvt,  setNuevoEvt]  = useState("")
  const [showWa,    setShowWa]    = useState(false)
  const [waTel,     setWaTel]     = useState("")
  const [waMsg,     setWaMsg]     = useState("")
  const [sendingWa, setSendingWa] = useState(false)
  const [waOk,      setWaOk]      = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try { setTramites(await api.get("/tramites")) } catch {}
    setLoading(false)
  }

  async function seleccionar(t: Tramite) {
    setSelected(t)
    try { setEventos(await api.get(`/tramites/${t.id}/eventos`)) } catch { setEventos([]) }
  }

  async function guardar() {
    if (!form.dim.trim()) return
    setSaving(true)
    try {
      const nuevo = await api.post("/tramites", form)
      setTramites(prev => [nuevo, ...prev])
      setShowForm(false)
      setForm(FORM_INIT)
    } catch {}
    setSaving(false)
  }

  async function actualizarCanal(canal: Canal) {
    if (!selected) return
    try {
      await api.patch(`/tramites/${selected.id}/canal?canal=${canal}`)
      setTramites(prev => prev.map(t => t.id === selected.id ? { ...t, canal } : t))
      setSelected(prev => prev ? { ...prev, canal } : null)
      const evts = await api.get(`/tramites/${selected.id}/eventos`)
      setEventos(evts)
    } catch {}
  }

  async function actualizarEstado(estado: string) {
    if (!selected) return
    try {
      const updated = await api.put(`/tramites/${selected.id}`, { estado })
      setTramites(prev => prev.map(t => t.id === selected.id ? { ...t, estado } : t))
      setSelected(prev => prev ? { ...prev, estado } : null)
      const evts = await api.get(`/tramites/${selected.id}/eventos`)
      setEventos(evts)
    } catch {}
  }

  function abrirWa(t: Tramite) {
    setWaTel("")
    setWaMsg(`Estimado cliente, su trámite ${t.dim} está en canal ${t.canal}${t.aduana ? ` en aduana ${t.aduana}` : ""}. Para más información contáctenos.`)
    setShowWa(true)
  }

  async function enviarWa() {
    if (!waTel || !waMsg) return
    setSendingWa(true)
    try {
      const r = await api.post("/whatsapp/enviar", { telefono: waTel, mensaje: waMsg })
      if (r.url) window.open(r.url, "_blank")
      setWaOk(true)
      setTimeout(() => { setWaOk(false); setShowWa(false) }, 2000)
    } catch { alert("Error enviando WhatsApp") }
    setSendingWa(false)
  }

  async function agregarEvento() {
    if (!selected || !nuevoEvt.trim()) return
    try {
      await api.post(`/tramites/${selected.id}/canal?canal=${selected.canal}&obs=${encodeURIComponent(nuevoEvt)}`, {})
      setNuevoEvt("")
      const evts = await api.get(`/tramites/${selected.id}/eventos`)
      setEventos(evts)
    } catch {}
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este trámite?")) return
    await api.delete(`/tramites/${id}`)
    setTramites(prev => prev.filter(t => t.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = tramites.filter(t => {
    const matchC = filtro === "TODOS" || t.canal === filtro
    const matchQ = !query || t.dim.toLowerCase().includes(query.toLowerCase()) ||
                   (t.cliente_nombre || "").toLowerCase().includes(query.toLowerCase())
    return matchC && matchQ
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Seguimiento de Trámites</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Estado en tiempo real de todas tus declaraciones</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1E6FD9] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1558B0] transition-colors">
          <Plus size={16} /> Nuevo trámite
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por DIM o empresa..."
            className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["TODOS", ...CANALES] as const).map(c => (
            <button key={c} onClick={() => setFiltro(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
              style={{ background: filtro === c ? (c === "TODOS" ? "#0F2B5B" : CANAL_COLOR[c as Canal]) : "#fff", color: filtro === c ? "#fff" : "#475569", borderColor: filtro === c ? (c === "TODOS" ? "#0F2B5B" : CANAL_COLOR[c as Canal]) : "#E2E8F0" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#475569]">{filtered.length} trámite{filtered.length !== 1 ? "s" : ""}</span>
            <button onClick={cargar} className="text-[#94A3B8] hover:text-[#1E6FD9] transition-colors">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Shield size={32} className="text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-sm text-[#94A3B8]">{tramites.length === 0 ? "Registra tu primer trámite" : "Sin resultados"}</p>
              </div>
            ) : filtered.map(t => (
              <button key={t.id} onClick={() => seleccionar(t)}
                className="w-full text-left px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors"
                style={{ borderLeft: selected?.id === t.id ? `3px solid ${CANAL_COLOR[t.canal]}` : "3px solid transparent" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono font-bold text-[#0F2B5B]">{t.dim}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: CANAL_COLOR[t.canal] }}>{t.canal}</span>
                </div>
                <div className="text-xs text-[#475569] truncate">{t.cliente_nombre || t.aduana || "—"}</div>
                <div className="text-[10px] text-[#94A3B8] mt-1">{t.tipo} · {t.fecha}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full bg-white border border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
              <Shield size={40} className="text-[#E2E8F0] mb-4" />
              <p className="text-[#94A3B8] text-sm">Selecciona un trámite para ver el detalle</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs text-[#94A3B8] font-mono mb-1">{selected.tipo}</div>
                    <h2 className="text-xl font-bold font-mono text-[#0F2B5B]">{selected.dim}</h2>
                    <div className="text-sm text-[#475569] mt-0.5">{selected.cliente_nombre || selected.aduana || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold px-3 py-1.5 rounded-full text-white"
                          style={{ background: CANAL_COLOR[selected.canal] }}>{selected.canal}</span>
                    <button onClick={() => eliminar(selected.id)} className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors p-1">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { l: "Aduana",     v: selected.aduana     || "—" },
                    { l: "Fecha",      v: selected.fecha              },
                    { l: "Gestion",    v: selected.gestion    || "—" },
                    { l: "Carpeta",    v: selected.nro_carpeta|| "—" },
                    { l: "Mercaderia", v: selected.mercaderia || "—" },
                    { l: "Descripcion",v: selected.descripcion|| "—" },
                  ].map(row => (
                    <div key={row.l} className="bg-[#F8FAFC] rounded-lg p-3">
                      <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{row.l}</div>
                      <div className="text-sm text-[#0F2B5B] font-medium truncate">{row.v}</div>
                    </div>
                  ))}
                </div>
                {/* Estado ciclo de vida */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-[#475569] mb-2">Estado del tramite</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {ESTADOS_TRAMITE.map(e => (
                      <button key={e} onClick={() => actualizarEstado(e)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                        style={{ background: selected.estado === e ? (ESTADO_COLOR[e]||"#475569") : "#fff", color: selected.estado === e ? "#fff" : "#475569", borderColor: selected.estado === e ? (ESTADO_COLOR[e]||"#475569") : "#E2E8F0" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Cambiar canal aduanero */}
                <div>
                  <div className="text-xs font-semibold text-[#475569] mb-2">Canal aduanero</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {CANALES.map(c => (
                      <button key={c} onClick={() => actualizarCanal(c)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                        style={{ background: selected.canal === c ? CANAL_COLOR[c] : "#fff", color: selected.canal === c ? "#fff" : "#475569", borderColor: selected.canal === c ? CANAL_COLOR[c] : "#E2E8F0" }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-white border border-[#E2E8F0] text-[#0F2B5B] text-sm font-medium py-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <FileText size={14} /> Documentos
                </button>
                <button onClick={() => selected && abrirWa(selected)}
                  className="flex items-center justify-center gap-2 bg-[#0D7A3E] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#0a6233] transition-colors">
                  <MessageCircle size={14} /> Notificar WA
                </button>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4 flex items-center gap-2">
                  <Clock size={15} /> Historial de eventos
                </h3>
                {/* Agregar evento */}
                <div className="flex gap-2 mb-4">
                  <input value={nuevoEvt} onChange={e => setNuevoEvt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && agregarEvento()}
                    placeholder="Agregar nota o evento..."
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                  <button onClick={agregarEvento} disabled={!nuevoEvt.trim()}
                    className="px-3 py-2 bg-[#0F2B5B] text-white rounded-lg text-sm hover:bg-[#1A3560] transition-colors disabled:opacity-40">
                    <Plus size={15} />
                  </button>
                </div>
                <div className="relative space-y-0">
                  {eventos.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] text-center py-4">Sin eventos registrados</p>
                  ) : eventos.map((ev, i) => (
                    <div key={ev.id} className="flex gap-4 pb-5 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#1E6FD9] flex-shrink-0 mt-1" />
                        {i < eventos.length - 1 && <div className="w-0.5 bg-[#E2E8F0] flex-1 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-mono text-[#94A3B8] mb-0.5">
                          {ev.creado_en?.replace("T", " ").substring(0, 16)}
                        </div>
                        <div className="text-sm font-medium text-[#0F2B5B]">{ev.estado}</div>
                        {ev.obs && <div className="text-xs text-[#94A3B8] mt-0.5">{ev.obs}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuevo trámite */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F2B5B]">Nuevo trámite</h2>
              <button onClick={() => setShowForm(false)} className="text-[#94A3B8] hover:text-[#475569]"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Nº DIM / EXP *", key: "dim",        placeholder: "DIM-2024-XXXX"     },
                { label: "Aduana",          key: "aduana",     placeholder: "Tambo Quemado"      },
                { label: "Mercadería",      key: "mercaderia", placeholder: "Descripción breve"  },
                { label: "Fecha",           key: "fecha",      placeholder: "YYYY-MM-DD", type:"date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">{f.label}</label>
                  <input type={f.type || "text"} value={(form as Record<string,string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Tipo</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] bg-white focus:outline-none">
                    {["Importacion","Exportacion","Transito","Temporal"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">Canal inicial</label>
                  <select value={form.canal} onChange={e => setForm(p => ({ ...p, canal: e.target.value as Canal }))}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] bg-white focus:outline-none">
                    {CANALES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setShowForm(false)}
                className="border border-[#E2E8F0] text-[#475569] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving || !form.dim.trim()}
                className="bg-[#1E6FD9] text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal WhatsApp */}
      {showWa && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F2B5B]">Notificar por WhatsApp</h2>
              <button onClick={() => setShowWa(false)} className="text-[#94A3B8] hover:text-[#475569]"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1.5">Número WhatsApp del cliente</label>
                <input value={waTel} onChange={e => setWaTel(e.target.value)} placeholder="+591 7XXXXXXX"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1.5">Mensaje</label>
                <textarea value={waMsg} onChange={e => setWaMsg(e.target.value)} rows={4}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none resize-none" />
              </div>
              {waOk && (
                <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-4 py-3 text-sm text-[#0D7A3E] font-medium">
                  <Check size={15} /> Mensaje enviado correctamente
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => setShowWa(false)}
                className="border border-[#E2E8F0] text-[#475569] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                Cancelar
              </button>
              <button onClick={enviarWa} disabled={sendingWa || !waTel || waOk}
                className="bg-[#0D7A3E] text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {sendingWa ? <><Loader2 size={14} className="animate-spin"/>Enviando...</> : <><MessageCircle size={14}/>Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
