"use client"
import { useState, useEffect } from "react"
import { Search, FileText, Clock, RefreshCw, Shield, AlertTriangle } from "lucide-react"

const API_BASE = "/api/tb"

type EstadoANB = {
  etapa:   string
  fecha:   string | null
  hora:    string | null
  canal:   string | null
  usuario: string | null
  obs:     string | null
  dim:     string | null
}

type ResultadoANB = {
  dim_id:   string
  gestion:  string
  aduana:   string
  registro: string
  estados:  EstadoANB[]
}

type HistorialItem = {
  dim_id:       string
  ultima_etapa: string
  consultado:   string
}

const ETAPA_COLOR: Record<string, string> = {
  VALIDACION:         "#1E6FD9",
  PAGO:               "#0D7A3E",
  CON_CANAL_ASIGNADO: "#D97706",
  LEVANTE:            "#0D7A3E",
  CONCLUIDO:          "#64748B",
}

const ETAPA_LABEL: Record<string, string> = {
  VALIDACION:         "Validación",
  PAGO:               "Pago de tributos",
  CON_CANAL_ASIGNADO: "Canal asignado",
  LEVANTE:            "Levante autorizado",
  CONCLUIDO:          "Concluido",
}

const ADUANAS: Record<string, string> = {
  "201": "El Alto — Aeropuerto",
  "211": "Desaguadero",
  "221": "Guaqui",
  "231": "Kasani",
  "241": "Tambo Quemado",
  "251": "Charaña",
  "261": "Pisiga",
  "301": "Oruro",
  "401": "Cochabamba",
  "501": "Santa Cruz",
  "601": "Potosí",
  "701": "Tarija",
  "801": "Bermejo",
  "811": "Aguas Blancas",
  "901": "Yacuiba",
  "911": "Boyuibe",
}

const LS_KEY = "anb_historial_v2"

function loadHistorial(): HistorialItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]") }
  catch { return [] }
}
function saveHistorial(items: HistorialItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, 15))) }
  catch {}
}

export default function ClickPage() {
  const [gestion,   setGestion]   = useState(String(new Date().getFullYear()))
  const [aduana,    setAduana]    = useState("")
  const [registro,  setRegistro]  = useState("")
  const [loading,   setLoading]   = useState(false)
  const [resultado, setResultado] = useState<ResultadoANB | null>(null)
  const [error,     setError]     = useState("")
  const [historial, setHistorial] = useState<HistorialItem[]>([])

  useEffect(() => { setHistorial(loadHistorial()) }, [])

  async function consultar(g = gestion, a = aduana, r = registro) {
    g = g.trim(); a = a.trim(); r = r.trim()
    if (!g || !a || !r) { setError("Completa los tres campos."); return }
    setLoading(true); setError(""); setResultado(null)
    try {
      const res  = await fetch(`${API_BASE}/anb/consultar?gestion=${g}&aduana=${a}&registro=${r}&serial=C`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
      setResultado(data)
      const item: HistorialItem = {
        dim_id:       data.dim_id,
        ultima_etapa: data.estados.length ? data.estados[data.estados.length - 1].etapa : "",
        consultado:   new Date().toLocaleString("es-BO"),
      }
      const nuevo = [item, ...loadHistorial().filter(x => x.dim_id !== data.dim_id)]
      saveHistorial(nuevo)
      setHistorial(nuevo.slice(0, 15))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error consultando el sistema ANB")
    }
    setLoading(false)
  }

  function consultarDesdeHistorial(item: HistorialItem) {
    const m = item.dim_id.match(/DI-(\d{4})-(\d+)-(\d+)/i)
    if (!m) return
    const [, g, a, r] = m
    setGestion(g); setAduana(a); setRegistro(r)
    consultar(g, a, r)
  }

  const ultimo = resultado?.estados.length
    ? resultado.estados[resultado.estados.length - 1]
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Consulta DIM</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Estado de declaración en el sistema ANB — Aduana Nacional de Bolivia
        </p>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Gestión
            </label>
            <input
              value={gestion}
              onChange={e => setGestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && consultar()}
              placeholder="2026"
              maxLength={4}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Aduana
            </label>
            <input
              value={aduana}
              onChange={e => setAduana(e.target.value)}
              onKeyDown={e => e.key === "Enter" && consultar()}
              placeholder="241"
              maxLength={6}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Número de DI
            </label>
            <input
              value={registro}
              onChange={e => setRegistro(e.target.value)}
              onKeyDown={e => e.key === "Enter" && consultar()}
              placeholder="2232066"
              maxLength={10}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors"
            />
          </div>
        </div>
        {aduana && ADUANAS[aduana] && (
          <p className="text-[11px] text-[#1E6FD9] mb-3">
            {ADUANAS[aduana]}
          </p>
        )}
        <button
          onClick={() => consultar()}
          disabled={loading || !gestion.trim() || !aduana.trim() || !registro.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#0F2B5B] text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-[#1A3560] transition-colors disabled:opacity-50"
        >
          {loading
            ? <><RefreshCw size={15} className="animate-spin" /> Consultando ANB...</>
            : <><Search size={15} /> Consultar</>
          }
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Resultado */}
        <div className="lg:col-span-2 space-y-4">

          {!loading && !resultado && !error && (
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
              <FileText size={40} className="text-[#E2E8F0] mx-auto mb-4" />
              <p className="text-[#475569] font-medium text-sm">Ingresa los datos de la DIM</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Gestión, número de aduana y número de registro
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5 flex items-start gap-3">
              <AlertTriangle size={18} className="text-[#B91C1C] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#B91C1C]">No se pudo obtener resultado</p>
                <p className="text-xs text-[#B91C1C] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && resultado && ultimo && (
            <>
              {/* Encabezado */}
              <div
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden"
                style={{ borderLeft: `4px solid ${ETAPA_COLOR[ultimo.etapa] || "#64748B"}` }}
              >
                <div className="px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-widest mb-1">
                      Declaración
                    </div>
                    <div className="text-xl font-bold font-mono text-[#0F2B5B]">{resultado.dim_id}</div>
                    {ADUANAS[resultado.aduana] && (
                      <div className="text-xs text-[#64748B] mt-1">{ADUANAS[resultado.aduana]}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="text-sm font-bold px-4 py-1.5 rounded-full text-white"
                      style={{ background: ETAPA_COLOR[ultimo.etapa] || "#64748B" }}
                    >
                      {ETAPA_LABEL[ultimo.etapa] || ultimo.etapa}
                    </span>
                    {ultimo.fecha && (
                      <div className="text-xs text-[#94A3B8] mt-2 flex items-center gap-1 justify-end">
                        <Clock size={11} /> {ultimo.fecha} {ultimo.hora}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline de etapas */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-5">Etapas de tramitación</h3>
                <div className="space-y-0">
                  {resultado.estados.map((e, i) => {
                    const color   = ETAPA_COLOR[e.etapa] || "#64748B"
                    const isLast  = i === resultado.estados.length - 1
                    const hasMeta = e.canal || e.usuario || e.obs || e.dim
                    return (
                      <div key={i} className="flex gap-4">
                        {/* Indicador vertical */}
                        <div className="flex flex-col items-center pt-0.5">
                          <div
                            className="w-3 h-3 rounded-full ring-2 ring-offset-2 flex-shrink-0"
                            style={{ background: color, ringColor: color }}
                          />
                          {!isLast && <div className="w-px flex-1 bg-[#E2E8F0] mt-1 mb-0" style={{ minHeight: "24px" }} />}
                        </div>

                        {/* Contenido */}
                        <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-sm font-bold" style={{ color }}>
                              {ETAPA_LABEL[e.etapa] || e.etapa}
                            </span>
                            {e.fecha && (
                              <span className="text-xs text-[#94A3B8] font-mono flex-shrink-0">
                                {e.fecha}
                                {e.hora && ` — ${e.hora}`}
                              </span>
                            )}
                          </div>
                          {hasMeta && (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-1">
                              {e.canal && (
                                <p className="text-xs text-[#475569]">
                                  <span className="text-[#94A3B8]">Canal: </span>{e.canal}
                                </p>
                              )}
                              {e.usuario && (
                                <p className="text-xs text-[#475569]">
                                  <span className="text-[#94A3B8]">Usuario: </span>
                                  <span className="font-mono">{e.usuario}</span>
                                </p>
                              )}
                              {e.dim && (
                                <p className="text-xs text-[#475569] col-span-2">
                                  <span className="text-[#94A3B8]">Referencia: </span>
                                  <span className="font-mono">{e.dim}</span>
                                </p>
                              )}
                              {e.obs && (
                                <p className="text-xs text-[#475569] col-span-2">
                                  <span className="text-[#94A3B8]">Obs: </span>{e.obs}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => { setResultado(null); setRegistro("") }}
                className="w-full flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#475569] text-sm font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors"
              >
                <Search size={15} /> Nueva consulta
              </button>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {historial.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#0F2B5B]">Consultas recientes</h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {historial.map(h => (
                  <button
                    key={h.dim_id}
                    onClick={() => consultarDesdeHistorial(h)}
                    className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-[#0F2B5B]">{h.dim_id}</span>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0 ml-1"
                        style={{ background: ETAPA_COLOR[h.ultima_etapa] || "#64748B" }}
                      >
                        {ETAPA_LABEL[h.ultima_etapa] || h.ultima_etapa}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                      <Clock size={9} /> {h.consultado}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-[#1E6FD9] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#1E6FD9] mb-1">Fuente oficial ANB</p>
                <p className="text-xs text-[#475569]">
                  Los datos se obtienen directamente del sistema de la Aduana Nacional de Bolivia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
