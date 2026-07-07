"use client"
import { useState } from "react"
import { Calculator, Search, Info, Package, Truck, Building2, ReceiptText, ChevronDown, ChevronUp, FileText, MessageCircle } from "lucide-react"
import { api } from "@/lib/api"

const fmt    = (v: number) => "$ " + v.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtBob = (v: number) => "Bs. " + v.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const n      = (s: string) => parseFloat(s) || 0

function Tip({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1 text-xs text-[#94A3B8] mt-1 leading-relaxed">
      <Info size={10} className="mt-0.5 flex-shrink-0" /> {text}
    </p>
  )
}

function Field({ label, value, onChange, placeholder = "0.00", prefix = "$", tip, highlight }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; tip?: string; highlight?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-medium text-[#475569] block mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} min={0} step="0.01"
          className={`w-full ${prefix ? "pl-7" : "pl-3"} pr-3 py-2.5 border rounded-lg text-sm font-mono text-[#0F2B5B] focus:outline-none transition-colors
            ${highlight ? "border-[#1E6FD9] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white focus:border-[#1E6FD9]"}`} />
      </div>
      {tip && <Tip text={tip} />}
    </div>
  )
}

function SectionHeader({ num, icon: Icon, title, subtitle, color }: {
  num: string; icon: React.ElementType; title: string; subtitle: string
  color: { bg: string; text: string; border: string }
}) {
  return (
    <div className={`flex items-center gap-3 mb-4 pb-3 border-b ${color.border}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${color.bg}`}>
        <Icon size={15} className={color.text} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${color.text} opacity-60`}>BLOQUE {num}</span>
        </div>
        <h3 className="font-semibold text-[#0F2B5B] text-sm leading-tight">{title}</h3>
        <p className="text-xs text-[#94A3B8]">{subtitle}</p>
      </div>
    </div>
  )
}

type Resultado = {
  fob: number; flete: number; seguro: number; ajustesVGA: number; cif: number
  ga: number; ice: number; iva: number; totalTributos: number; ga_pct: number; ice_pct: number
  gastosPuerto: number; almacenaje: number; fleteInterno: number; honorarios: number; otrosLocales: number
  totalGastosLocales: number; totalLanded: number; totalLandedBob: number; tc: number
}

export default function CalculadoraPage() {
  // Bloque A
  const [fob,        setFob]        = useState("")
  const [fleteInt,   setFleteInt]   = useState("")
  const [seguroMode, setSeguroMode] = useState<"pct"|"fijo">("pct")
  const [seguroPct,  setSeguroPct]  = useState("0.5")
  const [seguroFijo, setSeguroFijo] = useState("")
  const [ajustesVGA, setAjustesVGA] = useState("")
  const [cif,        setCif]        = useState("")

  // Bloque B
  const [nandina, setNandina] = useState("")
  const [gaPct,   setGaPct]   = useState("")
  const [icePct,  setIcePct]  = useState("")
  const [tc,      setTc]      = useState("6.96")
  const [buscando, setBuscando] = useState(false)
  const [nandinaDesc, setNandinaDesc] = useState("")

  // Bloque C
  const [gastosPuerto,  setGastosPuerto]  = useState("")
  const [almacenaje,    setAlmacenaje]    = useState("")
  const [fleteInterno,  setFleteInterno]  = useState("")
  const [honorMode,     setHonorMode]     = useState<"pct"|"fijo">("pct")
  const [honorPct,      setHonorPct]      = useState("1.5")
  const [honorFijo,     setHonorFijo]     = useState("")
  const [otrosLocales,  setOtrosLocales]  = useState("")

  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [showDesglose, setShowDesglose] = useState(true)

  function estimarCif() {
    const f   = n(fob)
    const fl  = n(fleteInt) || f * 0.07
    const seg = seguroMode === "pct" ? f * n(seguroPct) / 100 : n(seguroFijo)
    const aj  = n(ajustesVGA)
    const c   = f + fl + seg + aj
    setFleteInt(String(fl.toFixed(2)))
    setSeguroFijo(String(seg.toFixed(2)))
    setSeguroMode("fijo")
    setCif(c.toFixed(2))
  }

  function calcular() {
    const cifVal  = n(cif)
    const fobVal  = n(fob) || cifVal
    const flVal   = n(fleteInt)
    const segVal  = seguroMode === "pct" ? fobVal * n(seguroPct) / 100 : n(seguroFijo)
    const ajVal   = n(ajustesVGA)
    const tcVal   = n(tc) || 6.96
    const ga_p    = n(gaPct)
    const ice_p   = n(icePct)

    if (!cifVal) return

    const ga     = cifVal * ga_p / 100
    const ice    = (cifVal + ga) * ice_p / 100
    const iva    = (cifVal + ga + ice) * 14.94 / 100
    const total  = ga + ice + iva

    const gPuerto  = n(gastosPuerto)
    const gAlmac   = n(almacenaje)
    const gFlete   = n(fleteInterno)
    const gHonor   = honorMode === "pct" ? cifVal * n(honorPct) / 100 : n(honorFijo)
    const gOtros   = n(otrosLocales)
    const totalGL  = gPuerto + gAlmac + gFlete + gHonor + gOtros

    const landed    = cifVal + total + totalGL
    const landedBob = landed * tcVal

    setResultado({
      fob: fobVal, flete: flVal, seguro: segVal, ajustesVGA: ajVal, cif: cifVal,
      ga, ice, iva, totalTributos: total, ga_pct: ga_p, ice_pct: ice_p,
      gastosPuerto: gPuerto, almacenaje: gAlmac, fleteInterno: gFlete,
      honorarios: gHonor, otrosLocales: gOtros, totalGastosLocales: totalGL,
      totalLanded: landed, totalLandedBob: landedBob, tc: tcVal
    })
    setShowDesglose(true)
  }

  async function buscarNandina() {
    if (!nandina || nandina.length < 4) return
    setBuscando(true)
    try {
      const d = await api.get(`/nandina?q=${encodeURIComponent(nandina)}`)
      if (d.results?.[0]) {
        const item = d.results[0]
        setGaPct(String(parseFloat(item.ga_porcentaje) || 0))
        setIcePct(String(parseFloat(item.ice_especifico) || 0))
        setNandinaDesc(item.descripcion?.substring(0, 80) || "")
      }
    } catch {}
    setBuscando(false)
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Encabezado */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-4 py-1.5 mb-3">
          <Calculator size={14} className="text-[#1E6FD9]" />
          <span className="text-xs font-semibold text-[#1E6FD9]">Cotizador Profesional de Importación</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Calculadora de Tributos</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Calcula el costo total de importación a Bolivia: tributos, gastos locales y honorarios</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">

        {/* ═══════════ COLUMNA FORMULARIO ═══════════ */}
        <div className="space-y-4">

          {/* ── BLOQUE A: VALOR EN ADUANA ── */}
          <div className="bg-white border border-[#BFDBFE] rounded-2xl p-5 shadow-sm">
            <SectionHeader num="A" icon={Package}
              title="Valor en Aduana (CIF)"
              subtitle="Base imponible para el cálculo de tributos"
              color={{ bg: "bg-[#EFF6FF]", text: "text-[#1E6FD9]", border: "border-[#BFDBFE]" }} />

            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Valor FOB (USD)" value={fob} onChange={setFob}
                  tip="Precio de la mercadería en el punto de embarque, sin flete ni seguro" />
                <Field label="Flete Internacional (USD)" value={fleteInt} onChange={setFleteInt}
                  tip="Costo de transporte desde origen hasta Bolivia (marítimo/aéreo/terrestre)" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#475569]">Seguro</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#E2E8F0] text-xs">
                    {(["pct","fijo"] as const).map(m => (
                      <button key={m} onClick={() => setSeguroMode(m)}
                        className={`px-3 py-1 font-medium transition-colors
                          ${seguroMode === m ? "bg-[#1E6FD9] text-white" : "bg-white text-[#475569] hover:bg-[#F8FAFC]"}`}>
                        {m === "pct" ? "% FOB" : "Monto fijo"}
                      </button>
                    ))}
                  </div>
                </div>
                {seguroMode === "pct"
                  ? <Field label="" value={seguroPct} onChange={setSeguroPct} placeholder="0.5" prefix="%"
                      tip="Generalmente 0.5% a 1% del valor FOB. Exigido por aduana boliviana" />
                  : <Field label="" value={seguroFijo} onChange={setSeguroFijo}
                      tip="Monto exacto del seguro según póliza" />
                }
              </div>

              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">
                  Ajustes VGA <span className="text-[#94A3B8] font-normal">— opcional</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">$</span>
                  <input type="number" value={ajustesVGA} onChange={e => setAjustesVGA(e.target.value)}
                    placeholder="0.00" min={0} step="0.01"
                    className="w-full pl-7 pr-3 py-2.5 border border-[#E2E8F0] bg-white rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
                <Tip text="Comisiones, envases, materiales, royalties u otros gastos que el comprador pague como condición de venta (DS 25870 Art. 8)" />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 items-end">
                <button onClick={estimarCif}
                  className="h-10 border-2 border-[#1E6FD9] text-[#1E6FD9] text-sm rounded-xl hover:bg-[#EFF6FF] transition-colors font-semibold">
                  Calcular CIF →
                </button>
                <Field label="Valor CIF (USD) *" value={cif} onChange={setCif} highlight
                  tip="Base imponible oficial para tributos aduaneros" />
              </div>
            </div>
          </div>

          {/* ── BLOQUE B: CLASIFICACIÓN ARANCELARIA ── */}
          <div className="bg-white border border-[#FED7AA] rounded-2xl p-5 shadow-sm">
            <SectionHeader num="B" icon={ReceiptText}
              title="Clasificación Arancelaria y Tributos"
              subtitle="GA, ICE e IVA según NANDINA Bolivia"
              color={{ bg: "bg-[#FFF7ED]", text: "text-[#C8500A]", border: "border-[#FED7AA]" }} />

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">Código NANDINA</label>
                <div className="flex gap-2">
                  <input type="text" value={nandina} onChange={e => setNandina(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && buscarNandina()}
                    placeholder="Ej: 8415.10.10.00"
                    className="flex-1 px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#C8500A] focus:outline-none transition-colors" />
                  <button onClick={buscarNandina} disabled={buscando}
                    className="px-4 py-2.5 bg-[#C8500A] text-white rounded-lg hover:bg-[#a03e08] transition-colors text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50">
                    <Search size={13} />
                    {buscando ? "..." : "Buscar"}
                  </button>
                </div>
                {nandinaDesc
                  ? <p className="text-xs text-[#C8500A] mt-1 font-medium truncate">{nandinaDesc}</p>
                  : <Tip text="Ingresa el código de 10 dígitos o busca por nombre para obtener GA e ICE automáticamente" />
                }
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">GA (%)</label>
                  <div className="relative">
                    <input type="number" value={gaPct} onChange={e => setGaPct(e.target.value)}
                      placeholder="0" min={0} max={40} step={0.1}
                      className="w-full pl-3 pr-7 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#C8500A] focus:outline-none transition-colors" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">%</span>
                  </div>
                  <Tip text="Gravamen aduanero: 0%, 5%, 10%, 15% o 20%" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">ICE (%)</label>
                  <div className="relative">
                    <input type="number" value={icePct} onChange={e => setIcePct(e.target.value)}
                      placeholder="0" min={0} step={0.1}
                      className="w-full pl-3 pr-7 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#C8500A] focus:outline-none transition-colors" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">%</span>
                  </div>
                  <Tip text="Solo para bienes suntuarios, bebidas, tabaco y vehículos" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">T/C BOB/USD</label>
                  <input type="number" value={tc} onChange={e => setTc(e.target.value)}
                    min={1} step={0.01}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#C8500A] focus:outline-none transition-colors" />
                  <Tip text="Tipo oficial BCB" />
                </div>
              </div>
            </div>
          </div>

          {/* ── BLOQUE C: GASTOS LOCALES ── */}
          <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm">
            <SectionHeader num="C" icon={Building2}
              title="Gastos Locales"
              subtitle="No suman al CIF ni a la base imponible, pero integran el costo final"
              color={{ bg: "bg-[#F0FDF4]", text: "text-[#16A34A]", border: "border-[#BBF7D0]" }} />

            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Gastos Puerto / AADAA (USD)" value={gastosPuerto} onChange={setGastosPuerto}
                  tip="Handling, visto bueno, derechos de almacenaje en puerto de ingreso" />
                <Field label="Almacenaje (USD)" value={almacenaje} onChange={setAlmacenaje}
                  tip="Depósito aduanero, almacén general o zona franca" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Flete Interno (USD)" value={fleteInterno} onChange={setFleteInterno}
                  tip="Transporte desde aduana o puerto hasta bodega del cliente" />
                <Field label="Otros Gastos (USD)" value={otrosLocales} onChange={setOtrosLocales}
                  tip="Fumigación, rotulado, certificaciones, gastos bancarios, etc." />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#475569]">Honorarios Agencia Despachante</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#E2E8F0] text-xs">
                    {(["pct","fijo"] as const).map(m => (
                      <button key={m} onClick={() => setHonorMode(m)}
                        className={`px-3 py-1 font-medium transition-colors
                          ${honorMode === m ? "bg-[#16A34A] text-white" : "bg-white text-[#475569] hover:bg-[#F8FAFC]"}`}>
                        {m === "pct" ? "% CIF" : "Monto fijo"}
                      </button>
                    ))}
                  </div>
                </div>
                {honorMode === "pct"
                  ? <Field label="" value={honorPct} onChange={setHonorPct} placeholder="1.5" prefix="%"
                      tip="Generalmente entre 1% y 3% del valor CIF. Puedes ajustar según tu tarifa." />
                  : <Field label="" value={honorFijo} onChange={setHonorFijo}
                      tip="Monto fijo acordado con el importador en USD" />
                }
              </div>
            </div>
          </div>

          {/* Botón Calcular */}
          <button onClick={calcular}
            className="w-full bg-gradient-to-r from-[#0F2B5B] to-[#1E6FD9] text-white font-bold py-4 rounded-2xl hover:from-[#0a1f42] hover:to-[#1558B0] transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#1E6FD9]/20">
            <Calculator size={18} />
            Calcular Costo Total de Importación
          </button>
        </div>

        {/* ═══════════ COLUMNA RESULTADO ═══════════ */}
        <div className="lg:sticky lg:top-6">
          {!resultado ? (
            <div className="bg-white border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center p-10 text-center min-h-[500px]">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-4">
                <Calculator size={28} className="text-[#CBD5E1]" />
              </div>
              <p className="text-[#94A3B8] text-sm font-medium">Completa los datos y presiona</p>
              <p className="text-[#0F2B5B] font-bold text-sm mt-0.5">Calcular Costo Total</p>
              <div className="mt-6 space-y-2 text-left w-full max-w-xs">
                {[
                  { c: "bg-[#EFF6FF] text-[#1E6FD9]", t: "A", l: "CIF = FOB + Flete + Seguro + Ajustes" },
                  { c: "bg-[#FFF7ED] text-[#C8500A]", t: "B", l: "Tributos = GA + ICE + IVA sobre CIF" },
                  { c: "bg-[#F0FDF4] text-[#16A34A]", t: "C", l: "Landed = CIF + Tributos + Gastos" },
                ].map(row => (
                  <div key={row.t} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${row.c}`}>{row.t}</span>
                    <span className="text-xs text-[#64748B]">{row.l}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">

              {/* RESUMEN RÁPIDO */}
              <div className="bg-gradient-to-br from-[#0F2B5B] to-[#1A3A6B] rounded-2xl p-5 text-white">
                <p className="text-xs text-[#7C94CA] font-semibold uppercase tracking-wider mb-3">Cotización Total</p>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[#94A3B8] text-xs">Total Landed (USD)</p>
                    <p className="text-3xl font-bold font-mono">{fmt(resultado.totalLanded)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#94A3B8] text-xs">Total Landed (BOB)</p>
                    <p className="text-lg font-bold font-mono text-[#7FBFFF]">{fmtBob(resultado.totalLandedBob)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-[#1A3560] pt-3">
                  {[
                    { l: "CIF", v: fmt(resultado.cif), c: "text-[#60A5FA]" },
                    { l: "Tributos", v: fmt(resultado.totalTributos), c: "text-[#FCA775]" },
                    { l: "Gastos Loc.", v: fmt(resultado.totalGastosLocales), c: "text-[#6EE7B7]" },
                  ].map(r => (
                    <div key={r.l} className="text-center">
                      <p className="text-[#94A3B8] text-[10px]">{r.l}</p>
                      <p className={`text-xs font-bold font-mono ${r.c}`}>{r.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESGLOSE */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
                <button onClick={() => setShowDesglose(!showDesglose)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
                  <span className="text-sm font-semibold text-[#0F2B5B]">Desglose detallado</span>
                  {showDesglose ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
                </button>

                {showDesglose && (
                  <div className="px-5 pb-5 space-y-4">

                    {/* Bloque A */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 bg-[#EFF6FF] text-[#1E6FD9] rounded text-[10px] font-bold flex items-center justify-center">A</span>
                        <span className="text-xs font-semibold text-[#1E6FD9] uppercase tracking-wider">Valor en Aduana</span>
                      </div>
                      {[
                        resultado.fob        > 0 && { l: "FOB",        v: resultado.fob        },
                        resultado.flete      > 0 && { l: "Flete Int.", v: resultado.flete      },
                        resultado.seguro     > 0 && { l: "Seguro",     v: resultado.seguro     },
                        resultado.ajustesVGA > 0 && { l: "Ajustes VGA",v: resultado.ajustesVGA },
                      ].filter(Boolean).map((r: any) => (
                        <div key={r.l} className="flex justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
                          <span className="text-xs text-[#64748B] pl-2">{r.l}</span>
                          <span className="text-xs font-mono text-[#0F2B5B]">{fmt(r.v)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 mt-1 bg-[#EFF6FF] rounded-lg px-3">
                        <span className="text-xs font-bold text-[#1E6FD9]">= CIF (Base Imponible)</span>
                        <span className="text-xs font-bold font-mono text-[#1E6FD9]">{fmt(resultado.cif)}</span>
                      </div>
                    </div>

                    {/* Bloque B */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 bg-[#FFF7ED] text-[#C8500A] rounded text-[10px] font-bold flex items-center justify-center">B</span>
                        <span className="text-xs font-semibold text-[#C8500A] uppercase tracking-wider">Tributos Aduaneros</span>
                      </div>
                      {[
                        { l: `GA (${resultado.ga_pct}%)`, v: resultado.ga, sub: `sobre CIF ${fmt(resultado.cif)}` },
                        ...(resultado.ice_pct > 0 ? [{ l: `ICE (${resultado.ice_pct}%)`, v: resultado.ice, sub: `sobre CIF+GA` }] : []),
                        { l: "IVA (14.94%)", v: resultado.iva, sub: "sobre CIF+GA+ICE" },
                      ].map(r => (
                        <div key={r.l} className="flex justify-between items-center py-1.5 border-b border-[#F1F5F9] last:border-0 pl-2">
                          <div>
                            <span className="text-xs text-[#64748B]">{r.l}</span>
                            <p className="text-[10px] text-[#94A3B8]">{r.sub}</p>
                          </div>
                          <span className="text-xs font-mono text-[#C8500A]">{fmt(r.v)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 mt-1 bg-[#FFF7ED] rounded-lg px-3">
                        <span className="text-xs font-bold text-[#C8500A]">= Total Tributos</span>
                        <span className="text-xs font-bold font-mono text-[#C8500A]">{fmt(resultado.totalTributos)}</span>
                      </div>
                    </div>

                    {/* Bloque C */}
                    {resultado.totalGastosLocales > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-[#F0FDF4] text-[#16A34A] rounded text-[10px] font-bold flex items-center justify-center">C</span>
                          <span className="text-xs font-semibold text-[#16A34A] uppercase tracking-wider">Gastos Locales</span>
                        </div>
                        {[
                          resultado.gastosPuerto  > 0 && { l: "Gastos Puerto/AADAA", v: resultado.gastosPuerto  },
                          resultado.almacenaje    > 0 && { l: "Almacenaje",          v: resultado.almacenaje    },
                          resultado.fleteInterno  > 0 && { l: "Flete Interno",       v: resultado.fleteInterno  },
                          resultado.honorarios    > 0 && { l: "Honorarios Agencia",  v: resultado.honorarios    },
                          resultado.otrosLocales  > 0 && { l: "Otros Gastos",        v: resultado.otrosLocales  },
                        ].filter(Boolean).map((r: any) => (
                          <div key={r.l} className="flex justify-between py-1.5 border-b border-[#F1F5F9] last:border-0 pl-2">
                            <span className="text-xs text-[#64748B]">{r.l}</span>
                            <span className="text-xs font-mono text-[#16A34A]">{fmt(r.v)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between py-2 mt-1 bg-[#F0FDF4] rounded-lg px-3">
                          <span className="text-xs font-bold text-[#16A34A]">= Total Gastos Locales</span>
                          <span className="text-xs font-bold font-mono text-[#16A34A]">{fmt(resultado.totalGastosLocales)}</span>
                        </div>
                      </div>
                    )}

                    {/* Total final */}
                    <div className="border-t-2 border-[#0F2B5B] pt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-[#0F2B5B]">TOTAL LANDED COST</p>
                          <p className="text-[10px] text-[#94A3B8]">CIF + Tributos + Gastos Locales</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold font-mono text-[#0F2B5B]">{fmt(resultado.totalLanded)}</p>
                          <p className="text-xs font-mono text-[#64748B]">{fmtBob(resultado.totalLandedBob)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] font-semibold py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors text-sm">
                  <FileText size={15} /> Exportar PDF
                </button>
                <button className="flex items-center justify-center gap-2 bg-[#0D7A3E] text-white font-semibold py-3 rounded-xl hover:bg-[#0a6233] transition-colors text-sm">
                  <MessageCircle size={15} /> Enviar por WA
                </button>
              </div>

              <p className="text-[10px] text-[#94A3B8] text-center leading-relaxed px-2">
                Estimación referencial. Los montos finales pueden variar según el tipo de cambio oficial del BCB y otros tributos aplicables. Verifique siempre con el SENASAG y la Aduana Nacional.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
