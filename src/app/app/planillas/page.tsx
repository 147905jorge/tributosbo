"use client"
import { useState } from "react"
import { FileText, Download, MessageCircle, Plus, Trash2, Calculator, Printer } from "lucide-react"
import { getUser } from "@/lib/auth"

type Linea = { desc: string; valor: number }

const PLANTILLAS = ["Cotización de importación","Liquidación de tributos","Planilla DIM","Presupuesto de servicios"]

export default function PlanillasPage() {
  const [cliente,  setCliente]  = useState("")
  const [nit,      setNit]      = useState("")
  const [dim,      setDim]      = useState("")
  const [aduana,   setAduana]   = useState("Tambo Quemado")
  const [tipo,     setTipo]     = useState("Cotización de importación")
  const [obs,      setObs]      = useState("")
  const [lineas,   setLineas]   = useState<Linea[]>([
    { desc: "Honorarios de despacho",      valor: 350 },
    { desc: "Almacenaje (estimado 5 días)", valor: 120 },
    { desc: "Gestión documental",          valor: 80  },
    { desc: "Transporte interno (est.)",   valor: 200 },
  ])

  const user = getUser()
  const subtotal = lineas.reduce((s, l) => s + l.valor, 0)
  const iva      = subtotal * 0.13
  const total    = subtotal + iva

  function addLinea() { setLineas(p => [...p, { desc: "", valor: 0 }]) }
  function removeLinea(i: number) { setLineas(p => p.filter((_, j) => j !== i)) }
  function updateLinea(i: number, field: keyof Linea, v: string) {
    setLineas(p => p.map((l, j) => j !== i ? l : { ...l, [field]: field === "valor" ? parseFloat(v) || 0 : v }))
  }

  const fmt = (v: number) => "$ " + v.toLocaleString("es-BO", { minimumFractionDigits: 2 })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Generador de Planillas</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Crea cotizaciones y planillas con la identidad de tu agencia</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* FORMULARIO */}
        <div className="space-y-5">

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-[#0F2B5B] text-sm">Tipo de documento</h3>
            <div>
              <label className="text-xs font-medium text-[#475569] block mb-1.5">Plantilla</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none bg-white">
                {PLANTILLAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">Nº DIM / EXP</label>
                <input value={dim} onChange={e => setDim(e.target.value)} placeholder="DIM-2024-XXXX"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">Aduana</label>
                <input value={aduana} onChange={e => setAduana(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-[#0F2B5B] text-sm">Datos del cliente</h3>
            <div>
              <label className="text-xs font-medium text-[#475569] block mb-1.5">Razón social</label>
              <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Empresa importadora S.R.L."
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#475569] block mb-1.5">NIT</label>
              <input value={nit} onChange={e => setNit(e.target.value)} placeholder="1234567890"
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Conceptos y honorarios</h3>
              <button onClick={addLinea} className="flex items-center gap-1.5 text-xs font-medium text-[#1E6FD9] hover:text-[#1558B0] transition-colors">
                <Plus size={13} /> Agregar línea
              </button>
            </div>
            <div className="space-y-2">
              {lineas.map((linea, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={linea.desc} onChange={e => updateLinea(i, "desc", e.target.value)} placeholder="Descripción del concepto"
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">$</span>
                    <input type="number" value={linea.valor || ""} onChange={e => updateLinea(i, "valor", e.target.value)}
                      placeholder="0.00" min={0} step={0.01}
                      className="w-full pl-6 pr-2 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                  </div>
                  <button onClick={() => removeLinea(i)} className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-1.5">
              <div className="flex justify-between text-sm text-[#475569]"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-[#4F46E5]"><span>IVA (13%)</span><span className="font-mono">{fmt(iva)}</span></div>
              <div className="flex justify-between text-sm font-bold text-[#0F2B5B] pt-1 border-t border-[#E2E8F0]"><span>TOTAL</span><span className="font-mono">{fmt(total)}</span></div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <label className="text-xs font-medium text-[#475569] block mb-1.5">Observaciones</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Notas adicionales para el cliente..."
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-[#0F2B5B] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#1A3560] transition-colors">
              <FileText size={16} /> Generar PDF
            </button>
            <button className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] text-sm font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
              <Calculator size={16} /> Ir a calculadora
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div>
          <div id="print-area" className="sticky top-4 bg-white border border-[#E2E8F0] rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 flex items-start justify-between" style={{ background: user?.color_prim || "#0F2B5B" }}>
              <div>
                <div className="text-white font-bold text-base">{user?.empresa || "Tu Agencia"}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>Despachantes de Aduana</div>
              </div>
              <div className="text-right text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                <div>{user?.email || "contacto@agencia.com"}</div>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#EFF6FF] border-b border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#1E6FD9] uppercase tracking-widest">{tipo}</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">Nº COT-0123 · {new Date().toLocaleDateString("es-BO")}</div>
            </div>

            <div className="px-6 py-4 border-b border-[#F1F5F9]">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider mb-1">CLIENTE</div>
                  <div className="text-[#0F2B5B] font-semibold">{cliente || "—"}</div>
                  {nit && <div className="text-[#475569]">NIT: {nit}</div>}
                </div>
                <div>
                  <div className="text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider mb-1">TRÁMITE</div>
                  {dim && <div className="text-[#0F2B5B] font-mono font-semibold">{dim}</div>}
                  <div className="text-[#475569]">{aduana}</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="text-left text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider pb-2">Concepto</th>
                    <th className="text-right text-[#94A3B8] font-semibold uppercase text-[9px] tracking-wider pb-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.filter(l => l.desc || l.valor).map((l, i) => (
                    <tr key={i} className="border-b border-[#F8FAFC]">
                      <td className="py-1.5 text-[#475569]">{l.desc || "—"}</td>
                      <td className="py-1.5 text-right font-mono text-[#0F2B5B]">{fmt(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t-2 border-[#0F2B5B] space-y-1">
                <div className="flex justify-between text-xs text-[#475569]"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-xs text-[#4F46E5]"><span>IVA 13%</span><span className="font-mono">{fmt(iva)}</span></div>
                <div className="flex justify-between text-sm font-bold text-[#0F2B5B] pt-1 border-t border-[#E2E8F0]"><span>TOTAL</span><span className="font-mono">{fmt(total)}</span></div>
              </div>
              {obs && <div className="mt-3 p-2.5 bg-[#F8FAFC] rounded-lg text-xs text-[#475569]"><span className="font-semibold">Obs: </span>{obs}</div>}
            </div>

            <div className="px-6 pb-5 grid grid-cols-2 gap-3">
              <button onClick={() => window.print()}
                className="flex items-center justify-center gap-2 bg-[#0F2B5B] text-white text-xs font-medium py-2.5 rounded-lg hover:bg-[#1A3560] transition-colors">
                <Printer size={13} /> Imprimir / PDF
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#0D7A3E] text-white text-xs font-medium py-2.5 rounded-lg hover:bg-[#0a6233] transition-colors">
                <MessageCircle size={13} /> Enviar por WA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
