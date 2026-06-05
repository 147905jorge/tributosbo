"use client"
import { useState, useEffect } from "react"
import { Users, Search, Plus, Phone, Mail, MapPin, FileText, Truck, X, ChevronRight, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

type Cliente = {
  id: string; nombre: string; nit: string; telefono: string
  email: string; ciudad: string; tipo: "importador" | "exportador" | "ambos"
  tramites: number; creado_en: string; activo: number
}

const TIPO_COLOR = { importador: "#1E6FD9", exportador: "#0D7A3E", ambos: "#7C3AED" }

const FORM_INIT = { nombre:"", nit:"", telefono:"", email:"", ciudad:"", tipo:"importador" as const }

export default function ClientesPage() {
  const [clientes, setClientes]  = useState<Cliente[]>([])
  const [loading,  setLoading]   = useState(true)
  const [query,    setQuery]     = useState("")
  const [filtro,   setFiltro]    = useState<"todos"|"importador"|"exportador"|"ambos">("todos")
  const [selected, setSelected]  = useState<Cliente | null>(null)
  const [showForm, setShowForm]  = useState(false)
  const [form,     setForm]      = useState(FORM_INIT)
  const [saving,   setSaving]    = useState(false)
  const [editId,   setEditId]    = useState<string | null>(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try { setClientes(await api.get("/clientes")) } catch {}
    setLoading(false)
  }

  async function guardar() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/clientes/${editId}`, form)
        setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c))
      } else {
        const nuevo = await api.post("/clientes", form)
        setClientes(prev => [nuevo, ...prev])
      }
      cerrarForm()
    } catch {}
    setSaving(false)
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return
    await api.delete(`/clientes/${id}`)
    setClientes(prev => prev.filter(c => c.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function abrirEditar(c: Cliente) {
    setForm({ nombre: c.nombre, nit: c.nit, telefono: c.telefono, email: c.email, ciudad: c.ciudad, tipo: c.tipo as typeof FORM_INIT.tipo })
    setEditId(c.id)
    setShowForm(true)
  }

  function cerrarForm() {
    setShowForm(false)
    setForm(FORM_INIT)
    setEditId(null)
  }

  const filtered = clientes.filter(c => {
    const matchQ = !query || c.nombre.toLowerCase().includes(query.toLowerCase()) || c.nit.includes(query)
    const matchT = filtro === "todos" || c.tipo === filtro
    return matchQ && matchT && c.activo === 1
  })

  const stats = [
    { label: "Total",        value: clientes.filter(c => c.activo).length,                             color: "#0F2B5B" },
    { label: "Importadores", value: clientes.filter(c => c.activo && c.tipo !== "exportador").length,  color: "#1E6FD9" },
    { label: "Exportadores", value: clientes.filter(c => c.activo && c.tipo !== "importador").length,  color: "#0D7A3E" },
    { label: "Con trámites", value: clientes.filter(c => c.activo && c.tramites > 0).length,          color: "#7C3AED" },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">CRM de Clientes</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Gestiona tu cartera de importadores y exportadores</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1E6FD9] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1558B0] transition-colors">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
              {loading ? "—" : s.value}
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o NIT..."
            className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
        </div>
        <div className="flex gap-1.5">
          {(["todos","importador","exportador","ambos"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize"
              style={{ background: filtro === f ? "#0F2B5B" : "#fff", color: filtro === f ? "#fff" : "#475569", borderColor: filtro === f ? "#0F2B5B" : "#E2E8F0" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#475569]">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-[#F1F5F9] max-h-[580px] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center"><Loader2 size={24} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Users size={32} className="text-[#E2E8F0] mx-auto mb-3" />
                <p className="text-sm text-[#94A3B8]">{clientes.length === 0 ? "Agrega tu primer cliente" : "Sin resultados"}</p>
              </div>
            ) : filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className="w-full text-left px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors flex items-center gap-3"
                style={{ borderLeft: selected?.id === c.id ? "3px solid #1E6FD9" : "3px solid transparent" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                     style={{ background: TIPO_COLOR[c.tipo] }}>
                  {c.nombre.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0F2B5B] truncate">{c.nombre}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white capitalize"
                          style={{ background: TIPO_COLOR[c.tipo] }}>{c.tipo}</span>
                    <span className="text-[10px] text-[#94A3B8]">{c.tramites} trámites</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-[#E2E8F0] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full bg-white border border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-8 min-h-[400px] text-center">
              <Users size={40} className="text-[#E2E8F0] mb-4" />
              <p className="text-[#94A3B8] text-sm">Selecciona un cliente para ver el detalle</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base"
                         style={{ background: TIPO_COLOR[selected.tipo] }}>
                      {selected.nombre.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F2B5B]">{selected.nombre}</h2>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white capitalize"
                            style={{ background: TIPO_COLOR[selected.tipo] }}>{selected.tipo}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => abrirEditar(selected)}
                      className="text-xs text-[#1E6FD9] font-medium px-3 py-1.5 border border-[#BFDBFE] rounded-lg hover:bg-[#EFF6FF] transition-colors">
                      Editar
                    </button>
                    <button onClick={() => eliminar(selected.id)}
                      className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors p-1.5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: FileText, label: "NIT",      value: selected.nit      || "—" },
                    { icon: MapPin,   label: "Ciudad",   value: selected.ciudad   || "—" },
                    { icon: Phone,    label: "Teléfono", value: selected.telefono || "—" },
                    { icon: Mail,     label: "Email",    value: selected.email    || "—" },
                  ].map(f => (
                    <div key={f.label} className="bg-[#F8FAFC] rounded-lg p-3 flex items-start gap-2">
                      <f.icon size={13} className="text-[#94A3B8] mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">{f.label}</div>
                        <div className="text-sm text-[#0F2B5B] font-medium">{f.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {selected.telefono && (
                  <a href={`tel:${selected.telefono}`}
                    className="flex items-center justify-center gap-2 bg-[#0D7A3E] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#0a6233] transition-colors">
                    <Phone size={14} /> Llamar
                  </a>
                )}
                {selected.telefono && (
                  <a href={`https://wa.me/${selected.telefono.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-[#0F2B5B] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-[#1A3560] transition-colors">
                    WhatsApp
                  </a>
                )}
                <button className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] text-sm font-medium py-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <FileText size={14} /> Planilla
                </button>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Actividad</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-[#EFF6FF] rounded-xl">
                    <div className="text-2xl font-bold font-mono text-[#1E6FD9]">{selected.tramites}</div>
                    <div className="text-xs text-[#475569] mt-1">Trámites totales</div>
                  </div>
                  <div className="text-center p-3 bg-[#F0FDF4] rounded-xl">
                    <div className="text-sm font-mono text-[#0D7A3E]">{selected.creado_en?.split("T")[0] || "—"}</div>
                    <div className="text-xs text-[#475569] mt-1">Cliente desde</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F2B5B]">{editId ? "Editar cliente" : "Nuevo cliente"}</h2>
              <button onClick={cerrarForm} className="text-[#94A3B8] hover:text-[#475569]"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Razón social *", key: "nombre",   placeholder: "Empresa S.R.L."         },
                { label: "NIT",            key: "nit",      placeholder: "1234567890"              },
                { label: "Teléfono",       key: "telefono", placeholder: "+591 2 xxxxxxx"          },
                { label: "Email",          key: "email",    placeholder: "contacto@empresa.com"    },
                { label: "Ciudad",         key: "ciudad",   placeholder: "La Paz"                  },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-[#475569] block mb-1">{f.label}</label>
                  <input value={(form as Record<string,string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#475569] block mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as typeof form.tipo }))}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none bg-white">
                  <option value="importador">Importador</option>
                  <option value="exportador">Exportador</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={cerrarForm}
                className="border border-[#E2E8F0] text-[#475569] text-sm font-medium py-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                Cancelar
              </button>
              <button onClick={guardar} disabled={saving || !form.nombre.trim()}
                className="bg-[#1E6FD9] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#1558B0] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : "Guardar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
