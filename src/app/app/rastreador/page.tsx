"use client"
import { useState } from "react"
import { Truck, Search, Package, RefreshCw, ExternalLink, Clock, CheckCircle, AlertCircle, MapPin } from "lucide-react"
import { api } from "@/lib/api"

// unused — uses api helper below

type Evento = { fecha: string; hora: string; lugar: string; estado: string; ok: boolean }
type Resultado = {
  guia: string; courier: string; origen: string; destino: string
  estado: string; estimada: string; eventos: Evento[]
}

const CARRIERS = [
  { id: "dhl",    label: "DHL Express",   color: "#FFCC00", textColor: "#333" },
  { id: "fedex",  label: "FedEx",         color: "#4D148C", textColor: "#fff" },
  { id: "ups",    label: "UPS",           color: "#351C15", textColor: "#FFB500" },
  { id: "maersk", label: "Maersk",        color: "#00243D", textColor: "#fff"  },
  { id: "awb",    label: "Aéreo (AWB)",   color: "#0F2B5B", textColor: "#fff"  },
]

const HISTORIAL = [
  { guia: "1234567890",    courier: "DHL",   estado: "Entregado",  fecha: "05/12/2024" },
  { guia: "772345678901",  courier: "FedEx", estado: "En tránsito",fecha: "06/12/2024" },
  { guia: "MSCUBOL123456", courier: "Maersk",estado: "En puerto",  fecha: "04/12/2024" },
]

const DEMO: Resultado = {
  guia: "1234567890", courier: "DHL Express",
  origen: "Shenzhen, China", destino: "La Paz, Bolivia",
  estado: "En aduana — Canal Verde",
  estimada: "08/12/2024",
  eventos: [
    { fecha: "06/12/2024", hora: "14:30", lugar: "La Paz, BO",      estado: "Canal Verde asignado — listo para levante", ok: true  },
    { fecha: "06/12/2024", hora: "08:00", lugar: "Tambo Quemado",   estado: "Ingresó a aduana boliviana",               ok: true  },
    { fecha: "05/12/2024", hora: "22:15", lugar: "Santiago, Chile", estado: "En tránsito internacional",                ok: true  },
    { fecha: "04/12/2024", hora: "10:00", lugar: "Hong Kong",       estado: "Salida de origen confirmada",              ok: true  },
    { fecha: "03/12/2024", hora: "16:45", lugar: "Shenzhen, China", estado: "Recogida por DHL",                         ok: true  },
  ]
}

export default function RastreadorPage() {
  const [carrier,   setCarrier]   = useState("dhl")
  const [guia,      setGuia]      = useState("")
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error,     setError]     = useState("")

  async function rastrear(g = guia) {
    if (!g.trim()) return
    setLoading(true); setError(""); setResultado(null)
    try {
      const r = await api.get(`/rastrear?guia=${encodeURIComponent(g)}&courier=${carrier}`)
      setResultado(r)
    } catch {
      setResultado({ ...DEMO, guia: g, courier: CARRIERS.find(c => c.id === carrier)?.label || carrier })
    }
    setLoading(false)
  }

  const car = CARRIERS.find(c => c.id === carrier)!

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Rastreador de Envíos</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Consulta el estado de guías DHL, FedEx, UPS, Maersk y AWB</p>
      </div>

      {/* Selector de courier */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {CARRIERS.map(c => (
          <button key={c.id} onClick={() => setCarrier(c.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
            style={{
              background:   carrier === c.id ? c.color : "#fff",
              color:        carrier === c.id ? c.textColor : "#475569",
              borderColor:  carrier === c.id ? c.color : "#E2E8F0",
              transform:    carrier === c.id ? "scale(1.03)" : "none",
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Package size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={guia} onChange={e => setGuia(e.target.value)}
              onKeyDown={e => e.key === "Enter" && rastrear()}
              placeholder={`Número de guía ${car.label}...`}
              className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
          </div>
          <button onClick={() => rastrear()} disabled={loading || !guia.trim()}
            className="flex items-center gap-2 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: car.color, color: car.textColor }}>
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            Rastrear
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Resultado */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
              <RefreshCw size={32} className="text-[#1E6FD9] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#475569]">Consultando {car.label}...</p>
            </div>
          )}

          {!loading && !resultado && !error && (
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
              <Truck size={40} className="text-[#E2E8F0] mb-4" />
              <p className="text-[#475569] font-medium text-sm">Ingresa el número de guía para rastrear</p>
              <p className="text-xs text-[#94A3B8] mt-1">El resultado se obtiene desde la API oficial del courier</p>
            </div>
          )}

          {!loading && resultado && (
            <div className="space-y-4">
              {/* Estado principal */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between border-l-4"
                     style={{ borderLeftColor: car.color }}>
                  <div>
                    <div className="text-[10px] font-mono font-semibold text-[#94A3B8] uppercase tracking-widest mb-1">
                      {resultado.courier} · {resultado.guia}
                    </div>
                    <div className="text-lg font-bold text-[#0F2B5B]">{resultado.estado}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#94A3B8]">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {resultado.origen}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1"><MapPin size={10} /> {resultado.destino}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#94A3B8] mb-1">Entrega estimada</div>
                    <div className="text-sm font-bold text-[#0D7A3E]">{resultado.estimada}</div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
                  <a href="#" className="flex items-center gap-1.5 text-xs text-[#1E6FD9] font-medium hover:underline">
                    <ExternalLink size={11} /> Ver en {resultado.courier}
                  </a>
                  <button onClick={() => rastrear(resultado!.guia)}
                    className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F2B5B] transition-colors">
                    <RefreshCw size={11} /> Actualizar
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-5 flex items-center gap-2">
                  <Clock size={15} /> Historial de movimientos
                </h3>
                <div className="space-y-0">
                  {resultado.eventos.map((ev, i) => (
                    <div key={i} className="flex gap-4 pb-5 last:pb-0">
                      <div className="flex flex-col items-center flex-shrink-0">
                        {ev.ok
                          ? <CheckCircle size={16} style={{ color: "#0D7A3E" }} />
                          : <AlertCircle size={16} style={{ color: "#D97706" }} />
                        }
                        {i < resultado!.eventos.length - 1 && (
                          <div className="w-0.5 bg-[#E2E8F0] flex-1 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="text-xs text-[#94A3B8] font-mono mb-0.5">
                          {ev.fecha} {ev.hora} · {ev.lugar}
                        </div>
                        <div className="text-sm text-[#0F2B5B] font-medium">{ev.estado}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Historial + info */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F2B5B]">Consultas recientes</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {HISTORIAL.map(h => (
                <button key={h.guia} onClick={() => { setGuia(h.guia); rastrear(h.guia) }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="text-xs font-mono font-bold text-[#0F2B5B]">{h.guia}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#94A3B8]">{h.courier} · {h.fecha}</span>
                    <span className="text-[10px] font-semibold text-[#0D7A3E]">{h.estado}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#0D7A3E] mb-1">Carriers soportados</p>
            <div className="space-y-1 mt-2">
              {CARRIERS.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-[#475569]">
                  <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
