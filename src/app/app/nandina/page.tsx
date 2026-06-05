"use client"
import { useState, useRef } from "react"
import { Search, Calculator, AlertTriangle, ChevronDown, X } from "lucide-react"

import { api } from "@/lib/api"
const API_BASE = "/api/tb"

type NandinaItem = {
  codigo: string; descripcion: string
  ga: string; iva: string; ice: string
  pref_can: string; tipo_doc: string; permiso: string; unidad: string
}

type Suggestion = { codigo: string; descripcion: string }

export default function NandinaPage() {
  const [query,       setQuery]       = useState("")
  const [results,     setResults]     = useState<NandinaItem[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [searched,    setSearched]    = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function buscar(q = query) {
    if (!q.trim() || q.length < 2) return
    setLoading(true); setShowSuggest(false); setSearched(true)
    try {
      const d = await api.get(`/nandina?q=${encodeURIComponent(q)}`)
      setResults(d.results || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  function onInput(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); setShowSuggest(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const d = await api.get(`/nandina/suggest?q=${encodeURIComponent(val)}`)
        setSuggestions(d.suggestions || [])
        setShowSuggest((d.suggestions || []).length > 0)
      } catch {}
    }, 280)
  }

  function selectSuggest(s: Suggestion) {
    setQuery(s.codigo)
    setShowSuggest(false)
    buscar(s.codigo)
  }

  function usarEnCalc(item: NandinaItem) {
    const params = new URLSearchParams({
      ga: item.ga || "0", ice: item.ice || "0",
      codigo: item.codigo, desc: item.descripcion.substring(0, 60)
    })
    window.location.href = `/app/calculadora?${params}`
  }

  const ga    = (v: string) => parseFloat(v) || 0
  const can   = (v: string) => parseFloat(v)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Buscador NANDINA</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Nomenclatura Arancelaria Común de la Comunidad Andina · Bolivia
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-6">
        <div className="relative">
          <div className={`flex items-center gap-3 border-2 rounded-xl px-4 transition-colors ${showSuggest ? "border-[#1E6FD9] rounded-b-none" : "border-[#E2E8F0] focus-within:border-[#1E6FD9]"}`}>
            <Search size={18} className="text-[#94A3B8] flex-shrink-0" />
            <input
              type="text" value={query}
              onChange={e => onInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") buscar() }}
              placeholder="Busca por nombre del producto o código NANDINA..."
              className="flex-1 py-3.5 text-sm text-[#0F2B5B] placeholder-[#94A3B8] bg-transparent outline-none" />
            {query && (
              <button onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false) }}
                className="text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
            )}
            <button onClick={() => buscar()}
              className="bg-[#0F2B5B] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#1A3560] transition-colors flex-shrink-0">
              Buscar
            </button>
          </div>

          {/* Sugerencias */}
          {showSuggest && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border-2 border-t-0 border-[#1E6FD9] rounded-b-xl shadow-lg z-20 overflow-hidden">
              {suggestions.map(s => (
                <button key={s.codigo} onClick={() => selectSuggest(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors text-left border-b border-[#F1F5F9] last:border-0">
                  <span className="text-xs font-mono font-bold text-[#1E6FD9] w-28 flex-shrink-0">{s.codigo}</span>
                  <span className="text-sm text-[#475569] truncate">{s.descripcion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-[#94A3B8] mt-2 ml-1">
          Busca por nombre del producto o por código arancelario. El autocompletado aparece mientras escribes.
        </p>
      </div>

      {/* Resultados */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-[#1E6FD9] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#94A3B8]">Buscando...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl">
          <Search size={40} className="text-[#E2E8F0] mx-auto mb-4" />
          <p className="text-[#475569] font-medium">No se encontraron resultados</p>
          <p className="text-sm text-[#94A3B8] mt-1">Intenta con otro término o código arancelario</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-[#94A3B8] mb-3 text-right">
            {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {results.map(item => (
              <div key={item.codigo}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                style={{ borderTop: `3px solid #0F2B5B` }}>
                <div className="p-4">
                  <div className="text-xs font-mono font-bold text-[#1E6FD9] uppercase tracking-widest mb-1.5">
                    📄 {item.codigo}
                  </div>
                  <p className="text-sm text-[#0F2B5B] font-medium leading-snug mb-3 min-h-[36px]">
                    {item.descripcion}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="bg-[#EFF6FF] text-[#1E6FD9] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      GA: {ga(item.ga)}%
                    </span>
                    <span className="bg-[#F0FDF4] text-[#166534] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      IVA: 14.94%
                    </span>
                    {ga(item.ice) > 0 && (
                      <span className="bg-[#FFF7ED] text-[#C2410C] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        ICE: {item.ice}
                      </span>
                    )}
                    {item.unidad && (
                      <span className="bg-[#F5F3FF] text-[#6D28D9] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {item.unidad}
                      </span>
                    )}
                    {!isNaN(can(item.pref_can)) && can(item.pref_can) < 100 && (
                      <span className="bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        CAN: {item.pref_can}%
                      </span>
                    )}
                  </div>

                  {/* Permiso previo */}
                  {item.tipo_doc && (
                    <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2 mb-3">
                      <AlertTriangle size={13} className="text-[#DC2626] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[#DC2626] font-medium">
                        Requiere {item.permiso || item.tipo_doc}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acción */}
                <div className="border-t border-[#F1F5F9] px-4 py-3">
                  <button onClick={() => usarEnCalc(item)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#1E6FD9] hover:text-[#1558B0] transition-colors">
                    <Calculator size={14} />
                    Usar en calculadora
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-16 bg-white border border-dashed border-[#E2E8F0] rounded-2xl">
          <Search size={40} className="text-[#E2E8F0] mx-auto mb-4" />
          <p className="text-[#475569] font-medium">Ingresa un término para buscar</p>
          <p className="text-sm text-[#94A3B8] mt-1">Ej: arroz, 8528, zapatos, maquinaria...</p>
        </div>
      )}
    </div>
  )
}
