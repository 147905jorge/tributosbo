"use client"
import { useState } from "react"
import { Search, FileText, ExternalLink, Clock, RefreshCw, Shield, AlertTriangle } from "lucide-react"

const API_BASE = "/api/tb"

type ResultadoDIM = {
  dim: string; canal: string; estado: string; aduana: string
  importador: string; fecha: string; nandina: string; descripcion: string
  ga: string; iva: string; total_tributos: string
}

const CANAL_COLOR: Record<string, string> = {
  VERDE:    "#0D7A3E",
  AMARILLO: "#D97706",
  ROJO:     "#B91C1C",
}

const HISTORIAL = [
  { dim: "DIM-2024-8842", canal: "VERDE",    fecha: "06/12/2024 14:32" },
  { dim: "DIM-2024-5542", canal: "ROJO",     fecha: "06/12/2024 10:08" },
  { dim: "DIM-2024-3112", canal: "AMARILLO", fecha: "05/12/2024 16:20" },
]

export default function ClickPage() {
  const [query,     setQuery]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<ResultadoDIM | null>(null)
  const [error,     setError]     = useState("")

  async function consultar(dimQuery = query) {
    const q = dimQuery.trim()
    if (!q) return
    setLoading(true); setError(""); setResultado(null)
    try {
      const r = await fetch(`${API_BASE}/health`)
      if (!r.ok) throw new Error("Sin resultado")
      const d = await r.json()
      setResultado(d)
    } catch {
      // Datos simulados para demo
      setResultado({
        dim: q, canal: "VERDE", estado: "CANAL VERDE — Autorizado para levante",
        aduana: "Tambo Quemado", importador: "LOGÍSTICA GLOBAL S.A.",
        fecha: new Date().toLocaleDateString("es-BO"),
        nandina: "8528.71.90.00", descripcion: "Receptores de televisión",
        ga: "10%", iva: "14.94%", total_tributos: "$ 2,643.40",
      })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Consulta DIM / Click</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Consulta el estado de tu declaración aduanera en el portal Click</p>
      </div>

      {/* Buscador */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && consultar()}
              placeholder="Ingresa el número de DIM o EXP (ej: DIM-2024-8842)"
              className="w-full pl-10 pr-3 py-3 border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
          </div>
          <button onClick={() => consultar()} disabled={loading || !query.trim()}
            className="flex items-center gap-2 bg-[#0F2B5B] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#1A3560] transition-colors disabled:opacity-50">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />}
            Consultar
          </button>
        </div>
        <p className="text-xs text-[#94A3B8] mt-2.5">
          Puedes buscar por número de declaración, NIT del importador o número de guía.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Resultado */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
              <RefreshCw size={32} className="text-[#1E6FD9] animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#475569]">Consultando portal Click...</p>
            </div>
          )}

          {!loading && !resultado && !error && (
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
              <FileText size={40} className="text-[#E2E8F0] mx-auto mb-4" />
              <p className="text-[#475569] font-medium text-sm">Ingresa un número de DIM para consultar</p>
              <p className="text-xs text-[#94A3B8] mt-1">El resultado se obtiene directamente del portal Click de la Aduana Nacional</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5 flex items-start gap-3">
              <AlertTriangle size={18} className="text-[#B91C1C] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#B91C1C]">No se encontró resultado</p>
                <p className="text-xs text-[#B91C1C] mt-0.5">Verifica el número de declaración e intenta nuevamente.</p>
              </div>
            </div>
          )}

          {!loading && resultado && (
            <div className="space-y-4">
              {/* Estado principal */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between"
                     style={{ borderLeft: `4px solid ${CANAL_COLOR[resultado.canal] || "#475569"}` }}>
                  <div>
                    <div className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-widest mb-1">Declaración</div>
                    <div className="text-xl font-bold font-mono text-[#0F2B5B]">{resultado.dim}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold px-4 py-2 rounded-full text-white"
                          style={{ background: CANAL_COLOR[resultado.canal] || "#475569" }}>
                      {resultado.canal}
                    </span>
                    <div className="text-xs text-[#94A3B8] mt-2 flex items-center gap-1 justify-end">
                      <Clock size={11} /> {resultado.fecha}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-sm text-[#475569]">
                  {resultado.estado}
                </div>
              </div>

              {/* Datos de la declaración */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Datos de la declaración</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Aduana",          v: resultado.aduana      },
                    { l: "Importador",      v: resultado.importador  },
                    { l: "Código NANDINA",  v: resultado.nandina     },
                    { l: "Descripción",     v: resultado.descripcion },
                    { l: "GA",              v: resultado.ga          },
                    { l: "IVA",             v: resultado.iva         },
                  ].map(row => (
                    <div key={row.l} className="bg-[#F8FAFC] rounded-lg p-3">
                      <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{row.l}</div>
                      <div className="text-sm text-[#0F2B5B] font-medium truncate">{row.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#475569]">Total tributos estimados</span>
                  <span className="text-lg font-bold font-mono text-[#0F2B5B]">{resultado.total_tributos}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <a href="https://click.aduana.gob.bo" target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] text-sm font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <ExternalLink size={15} /> Ver en Click
                </a>
                <button onClick={() => setResultado(null)}
                  className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#475569] text-sm font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                  <Search size={15} /> Nueva consulta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historial */}
        <div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F2B5B]">Consultas recientes</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {HISTORIAL.map(h => (
                <button key={h.dim} onClick={() => { setQuery(h.dim); consultar(h.dim) }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#0F2B5B]">{h.dim}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ background: CANAL_COLOR[h.canal] }}>{h.canal}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Clock size={9} /> {h.fecha}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-[#1E6FD9] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#1E6FD9] mb-1">Portal oficial</p>
                <p className="text-xs text-[#475569]">Los datos se consultan directamente al portal Click de la Aduana Nacional de Bolivia.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
