"use client"
import { useState } from "react"
import { Calculator, Search, FileText, MessageCircle, ChevronRight, Info } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://193.122.138.87.nip.io"

const fmt    = (v: number) => "$ " + v.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtBob = (v: number) => "Bs. " + v.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Resultado = {
  cif: number; ga: number; baseIva: number; ice: number; iva: number
  total: number; totalBob: number; ga_pct: number; ice_pct: number; tc: number
}

export default function CalculadoraPage() {
  const [fob,    setFob]    = useState("")
  const [flete,  setFlete]  = useState("")
  const [seguro, setSeguro] = useState("")
  const [cif,    setCif]    = useState("")
  const [tc,     setTc]     = useState("6.96")
  const [gaPct,  setGaPct]  = useState("")
  const [icePct, setIcePct] = useState("")
  const [nandina, setNandina] = useState("")
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [buscando, setBuscando] = useState(false)

  function estimarCif() {
    const f = parseFloat(fob) || 0
    const fl = parseFloat(flete) || f * 0.07
    const sg = parseFloat(seguro) || f * 0.01
    const c = f + fl + sg
    setCif(c.toFixed(2))
  }

  function calcular() {
    const c     = parseFloat(cif)    || 0
    const t     = parseFloat(tc)     || 6.96
    const ga_p  = parseFloat(gaPct)  || 0
    const ice_p = parseFloat(icePct) || 0
    if (!c) return

    const ga      = c * ga_p / 100
    const base    = c + ga
    const ice     = base * ice_p / 100
    const iva     = base * 14.94 / 100
    const total   = ga + ice + iva
    const totalBob = total * t

    setResultado({ cif: c, ga, baseIva: base, ice, iva, total, totalBob, ga_pct: ga_p, ice_pct: ice_p, tc: t })
  }

  async function buscarNandina() {
    if (!nandina || nandina.length < 4) return
    setBuscando(true)
    try {
      const r = await fetch(`${API_BASE}/api/nandina?q=${encodeURIComponent(nandina)}`)
      const d = await r.json()
      if (d.results?.[0]) {
        const item = d.results[0]
        setGaPct(String(parseFloat(item.ga) || 0))
        setIcePct(String(parseFloat(item.ice) || 0))
      }
    } catch {}
    setBuscando(false)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Calculadora de Tributos</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Calcula GA, IVA e ICE para tu importación en Bolivia</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Panel de entrada */}
        <div className="space-y-4">

          {/* FOB -> CIF */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#EFF6FF] rounded-full flex items-center justify-center text-xs font-bold text-[#1E6FD9]">1</div>
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Valor de la mercadería</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">
                  Valor FOB (USD) <span className="text-[#94A3B8] font-normal">— opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">$</span>
                  <input type="number" value={fob} onChange={e => setFob(e.target.value)}
                    placeholder="0.00" min={0}
                    className="w-full pl-7 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 flex items-center gap-1">
                  <Info size={10} /> El estimado agrega +10% sobre el FOB para flete y seguro.
                </p>
              </div>
              <button onClick={estimarCif}
                className="w-full border border-[#1E6FD9] text-[#1E6FD9] text-sm py-2 rounded-lg hover:bg-[#EFF6FF] transition-colors font-medium">
                Estimar CIF desde FOB →
              </button>
            </div>
          </div>

          {/* CIF directo */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#EFF6FF] rounded-full flex items-center justify-center text-xs font-bold text-[#1E6FD9]">2</div>
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Clasificación arancelaria</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">Valor CIF (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">$</span>
                  <input type="number" value={cif} onChange={e => setCif(e.target.value)}
                    placeholder="0.00" min={0}
                    className="w-full pl-7 pr-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">Código NANDINA</label>
                <div className="flex gap-2">
                  <input type="text" value={nandina} onChange={e => setNandina(e.target.value)}
                    placeholder="Ej: 8415.10.10.00" maxLength={14}
                    className="flex-1 px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                  <button onClick={buscarNandina} disabled={buscando}
                    className="px-3 py-2.5 bg-[#0F2B5B] text-white rounded-lg hover:bg-[#1A3560] transition-colors text-xs font-medium flex items-center gap-1.5 disabled:opacity-50">
                    <Search size={14} />
                    {buscando ? "..." : "Buscar"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">GA (%)</label>
                  <input type="number" value={gaPct} onChange={e => setGaPct(e.target.value)}
                    placeholder="0" min={0} max={100} step={0.1}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">ICE (%)</label>
                  <input type="number" value={icePct} onChange={e => setIcePct(e.target.value)}
                    placeholder="0" min={0} step={0.1}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Tipo de cambio */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#EFF6FF] rounded-full flex items-center justify-center text-xs font-bold text-[#1E6FD9]">3</div>
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Parámetros</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-[#475569] block mb-1.5">Tipo de cambio BOB/USD</label>
              <input type="number" value={tc} onChange={e => setTc(e.target.value)}
                min={1} step={0.01}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
              <p className="text-xs text-[#94A3B8] mt-1">Tipo de cambio oficial BCB</p>
            </div>
          </div>

          <button onClick={calcular}
            className="w-full bg-[#1E6FD9] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1558B0] transition-colors flex items-center justify-center gap-2 text-sm">
            <Calculator size={18} />
            Calcular Tributos
          </button>
        </div>

        {/* Panel resultado */}
        <div>
          {!resultado ? (
            <div className="h-full bg-white border border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
              <Calculator size={40} className="text-[#E2E8F0] mb-4" />
              <p className="text-[#94A3B8] text-sm">Completa los datos y presiona{" "}
                <span className="font-semibold text-[#0F2B5B]">Calcular Tributos</span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desglose */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Desglose del Cálculo</h3>
                <div className="space-y-2">
                  {[
                    { l: "Valor CIF",                  v: fmt(resultado.cif),     c: "#0F2B5B", sub: false },
                    { l: `GA (${resultado.ga_pct}%)`,  v: fmt(resultado.ga),      c: "#C8500A", sub: true  },
                    { l: "Base IVA (CIF + GA)",         v: fmt(resultado.baseIva), c: "#475569", sub: false },
                    ...(resultado.ice_pct > 0 ? [{ l: `ICE (${resultado.ice_pct}%)`, v: fmt(resultado.ice), c: "#DB2777", sub: true }] : []),
                    { l: "IVA (14.94%)",               v: fmt(resultado.iva),     c: "#4F46E5", sub: true  },
                  ].map(row => (
                    <div key={row.l}
                      className={`flex justify-between items-center py-2 ${row.sub ? "pl-4 border-l-2 border-[#F1F5F9]" : "border-t border-[#F1F5F9]"}`}>
                      <span className="text-sm text-[#475569]">{row.l}</span>
                      <span className="text-sm font-mono font-semibold" style={{ color: row.c }}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-[#0F2B5B] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-sm">Total Tributos</span>
                  <span className="text-white font-bold font-mono text-lg">{fmt(resultado.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] text-sm">Total en Bolivianos</span>
                  <span className="text-[#7C94CA] font-bold font-mono text-lg">{fmtBob(resultado.totalBob)}</span>
                </div>
                <div className="border-t border-[#1A3560] pt-3 flex justify-between items-center">
                  <span className="text-[#94A3B8] text-sm">Costo Total Landed</span>
                  <span className="text-white font-bold font-mono text-xl">{fmt(resultado.cif + resultado.total)}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors text-sm">
                  <FileText size={16} /> Exportar PDF
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#0D7A3E] text-white font-medium py-3 rounded-xl hover:bg-[#0a6233] transition-colors text-sm">
                  <MessageCircle size={16} /> Enviar por WA
                </button>
              </div>

              <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
                * Estimación referencial. El monto final puede variar según tipo de cambio oficial y otros tributos aplicables.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
