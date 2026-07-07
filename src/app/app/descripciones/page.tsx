"use client"
import { useState, useRef } from "react"
import { Search, FileText, Copy, CheckCircle2, AlertCircle, ChevronRight, Info, HelpCircle, Printer } from "lucide-react"
import { api } from "@/lib/api"

interface Articulo {
  found: boolean
  partida?: string
  numero?: number
  capitulo?: string
  partidas_txt?: string
  campos?: string[]
  ejemplos?: Record<string, string>
  notas?: Record<string, string>
}

interface AnexoValores {
  found: boolean
  producto?: string
  valores?: Record<string, string[]>
}

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center ml-1.5" style={{ verticalAlign: "middle" }}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(v => !v)}
        className="text-[#1E6FD9] hover:text-[#0F2B5B] transition-colors"
        aria-label="Ver guía"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span className="absolute z-50 left-5 top-0 w-72 bg-[#1E293B] text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed"
              style={{ whiteSpace: "pre-wrap" }}>
          {text}
        </span>
      )}
    </span>
  )
}

export default function DescripcionesPage() {
  const [nandina,     setNandina]     = useState("")
  const [articulo,    setArticulo]    = useState<Articulo | null>(null)
  const [anexo,       setAnexo]       = useState<AnexoValores | null>(null)
  const [valores,     setValores]     = useState<Record<string, string>>({})
  const [descripcion, setDescripcion] = useState("")
  const [loadingArt,  setLoadingArt]  = useState(false)
  const [copiado,     setCopiado]     = useState(false)
  const [error,       setError]       = useState("")
  const printRef = useRef<HTMLDivElement>(null)

  async function buscarArticulo() {
    const code = nandina.replace(/\D/g, "")
    if (code.length < 4) { setError("Ingresa al menos 4 dígitos del código NANDINA"); return }
    setLoadingArt(true); setError(""); setArticulo(null); setAnexo(null); setValores({}); setDescripcion("")
    try {
      const r = await api.get(`/descripciones/articulo?nandina=${code}`)
      setArticulo(r)
      if (!r.found) setError(`No se encontró artículo para la partida ${code.slice(0,4)}.`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al buscar")
    }
    setLoadingArt(false)
  }

  async function buscarAnexo(nombreProducto: string) {
    if (!nombreProducto || nombreProducto.length < 3) return
    try {
      const r = await api.get(`/descripciones/anexo?producto=${encodeURIComponent(nombreProducto)}`)
      setAnexo(r)
    } catch {
      setAnexo({ found: false })
    }
  }

  async function generarDescripcion() {
    if (!articulo?.campos) return
    try {
      const r = await api.post("/descripciones/generar", { campos: valores })
      setDescripcion(r.descripcion)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al generar")
    }
  }

  function copiarDescripcion() {
    navigator.clipboard.writeText(descripcion)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function imprimir() {
    window.print()
  }

  const camposEditables = articulo?.campos?.filter(c => c && !c.toLowerCase().includes("nombre")) ?? []

  return (
    <>
      {/* Estilos impresion */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F2B5B]">Descripciones Mínimas</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Guía según RD 01-099-24 — Aduana Nacional de Bolivia</p>
          </div>
          {articulo?.found && (
            <button onClick={imprimir}
              className="no-print flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] transition-colors">
              <Printer size={14} /> Imprimir guía
            </button>
          )}
        </div>

        {/* Buscador */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6 no-print">
          <label className="text-sm font-semibold text-[#0F2B5B] mb-2 block">Código NANDINA</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={nandina}
              onChange={e => setNandina(e.target.value)}
              onKeyDown={e => e.key === "Enter" && buscarArticulo()}
              placeholder="Ej: 0101, 2710.12, 8471.30.00.00"
              className="flex-1 px-4 py-3 border-2 border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E6FD9] font-mono"
            />
            <button onClick={buscarArticulo} disabled={loadingArt}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: "#1E6FD9" }}>
              <Search size={16} />
              {loadingArt ? "Buscando..." : "Buscar"}
            </button>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            Ingresa los primeros 4 dígitos de la partida o el código completo
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-5 py-4 mb-6 text-sm text-[#B91C1C] no-print">
            <AlertCircle size={16} className="flex-shrink-0" /> {error}
          </div>
        )}

        {/* Contenido imprimible */}
        {articulo?.found && (
          <div id="print-area" ref={printRef}>
            {/* Info articulo */}
            <div className="bg-[#F0F6FF] border border-[#BFDBFE] rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-[#1E6FD9] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#1E6FD9] uppercase tracking-wide mb-1">
                    Artículo {articulo.numero} — Partida {articulo.partida}
                  </div>
                  <div className="text-sm font-semibold text-[#0F2B5B] mb-1">{articulo.capitulo}</div>
                  <div className="text-xs text-[#475569]">{articulo.partidas_txt}</div>
                </div>
              </div>
            </div>

            {/* Guia de campos con notas */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
              <h2 className="text-base font-bold text-[#0F2B5B] mb-1">Campos requeridos</h2>
              <p className="text-xs text-[#94A3B8] mb-5">
                Completa los campos aplicables. El icono <HelpCircle size={11} className="inline text-[#1E6FD9]" /> muestra la guía oficial de cada campo.
              </p>

              {/* Nombre de la mercancía */}
              <div className="mb-4">
                <label className="text-xs font-bold text-[#0F2B5B] uppercase tracking-wide flex items-center mb-1.5">
                  Nombre de la Mercancía <span className="text-[#B91C1C] ml-1">*</span>
                  {articulo.notas?.["Nombre de la Mercancía"] && (
                    <Tooltip text={articulo.notas["Nombre de la Mercancía"]} />
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Ej: PAPA, TELEVISOR LED, ACEITE DE SOJA..."
                  value={valores["Nombre de la Mercancía"] || ""}
                  onChange={e => {
                    const val = e.target.value
                    setValores(v => ({ ...v, "Nombre de la Mercancía": val }))
                    if (val.length >= 3) buscarAnexo(val)
                  }}
                  className="no-print w-full px-4 py-2.5 border-2 border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E6FD9]"
                />
                {/* Vista impresion */}
                <div className="hidden print:block text-sm border-b border-gray-300 py-1 min-h-[28px]">
                  {valores["Nombre de la Mercancía"] || ""}
                </div>
                {anexo?.found && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0D7A3E] no-print">
                    <CheckCircle2 size={13} /> Producto en Anexo — valores aceptados disponibles abajo
                  </div>
                )}
              </div>

              {/* Resto de campos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {camposEditables.map(campo => {
                  const campoKey = campo.split(".")[0].trim()
                  const nota = articulo.notas?.[campo] || articulo.notas?.[campoKey] || ""
                  const anexoKey = anexo?.valores
                    ? Object.keys(anexo.valores).find(k =>
                        k.toLowerCase().includes(campoKey.toLowerCase().split(" ")[0]))
                    : null
                  const opcionesAnexo = anexoKey ? anexo!.valores![anexoKey] : null
                  const ejemplo = articulo.ejemplos?.[campo]

                  return (
                    <div key={campo}>
                      <label className="text-xs font-bold text-[#475569] uppercase tracking-wide flex items-center mb-1.5">
                        {campoKey}
                        {nota && <Tooltip text={nota} />}
                        {ejemplo && !nota && (
                          <span className="ml-2 text-[10px] font-normal text-[#94A3B8] normal-case">
                            ({ejemplo})
                          </span>
                        )}
                      </label>

                      {/* Nota expandida solo en impresion */}
                      {nota && (
                        <div className="hidden print:block text-[10px] text-gray-500 italic mb-1">
                          {nota}
                        </div>
                      )}

                      {opcionesAnexo && opcionesAnexo.length > 0 ? (
                        <select
                          value={valores[campoKey] || ""}
                          onChange={e => setValores(v => ({ ...v, [campoKey]: e.target.value }))}
                          className="no-print w-full px-3 py-2.5 border-2 border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E6FD9] bg-white"
                        >
                          <option value="">— Seleccionar —</option>
                          {opcionesAnexo.map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                          <option value="OTRO">OTRO (especificar)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={valores[campoKey] || ""}
                          onChange={e => setValores(v => ({ ...v, [campoKey]: e.target.value }))}
                          placeholder={ejemplo || nota.split(".")[0].slice(0, 60) || ""}
                          className="no-print w-full px-3 py-2.5 border-2 border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E6FD9]"
                        />
                      )}
                      {/* Campo impresion */}
                      <div className="hidden print:block text-sm border-b border-gray-300 py-1 min-h-[28px]">
                        {valores[campoKey] || ""}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button onClick={generarDescripcion}
                className="no-print mt-6 px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2"
                style={{ background: "#0F2B5B" }}>
                <ChevronRight size={16} /> Generar descripción mínima
              </button>
            </div>

            {/* Descripcion generada */}
            {descripcion && (
              <div className="bg-white border-2 border-[#1E6FD9] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-[#0F2B5B]">Descripción generada</h2>
                  <button onClick={copiarDescripcion}
                    className="no-print flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    style={{ color: copiado ? "#0D7A3E" : "#475569" }}>
                    {copiado ? <><CheckCircle2 size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 font-mono text-sm text-[#0F172A] leading-relaxed break-words">
                  {descripcion}
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-[#94A3B8]">
                  <Info size={12} />
                  {descripcion.length} caracteres — Listo para copiar al DEMIS/DAM
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial */}
        {!articulo && !error && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center">
            <FileText size={40} className="text-[#CBD5E1] mx-auto mb-4" />
            <p className="text-[#475569] font-semibold mb-1">Ingresa un código NANDINA para comenzar</p>
            <p className="text-sm text-[#94A3B8]">
              El sistema muestra los campos requeridos con guía oficial para cada uno, según el Reglamento RD 01-099-24.
            </p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-[#94A3B8]">
              {[["1501","Grasas animales"],["2710","Aceites minerales"],["8471","Computadoras"],["6204","Ropa mujer"]].map(([c,n]) => (
                <button key={c} onClick={() => setNandina(c)}
                  className="px-3 py-2 border border-[#E2E8F0] rounded-lg hover:border-[#1E6FD9] hover:text-[#1E6FD9] transition-colors text-left">
                  <span className="font-mono font-bold block">{c}</span>
                  <span>{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
