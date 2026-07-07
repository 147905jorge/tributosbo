"use client"
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  FileText, Plus, Trash2, Search, Download, Save, FolderOpen,
  ChevronDown, ChevronUp, X, Check, AlertCircle, RefreshCw,
  Upload, Database, Users
} from "lucide-react"
import { api, apiFetch } from "@/lib/api"
import {
  parseDAMJson, parseDIMJson, parseDEXJson, parseDAVXml,
  detectFileType, readFileAsText, type EntityData
} from "./_parse"
import {
  upsertLocal, findByNit, searchLocal, fetchFromBackend,
  searchBackend, pushToBackend, bulkUpsert, loadAll, deleteEntity,
  exportBackup, importBackup, getStats, type Entity
} from "./_entities"
import type {
  TipoDoc, DAMFormState, DIMFormState, DEXFormState, DAVFormState,
  ItemForm, FacturaForm, DocEmbarqueForm, ProveedorForm,
  DEXItemForm, DAVItemForm
} from "./_types"
import {
  ADUANAS, PAISES, PUERTOS, VIAS_TRANSPORTE, TIPO_DOC_EMBARQUE,
  TIPO_DOCUMENTO, REGIMENES_DESTINO, MODALIDADES_REGIMEN, MODALIDADES_DESPACHO,
  FORMAS_ENVIO, INCOTERMS, MONEDAS, NATURALEZA_TRANSACCION,
  FORMAS_PAGO, MEDIOS_PAGO, CONDICION_VENDEDOR, DESTINO_MERCANCIA,
  NIVEL_COMERCIAL, ESTADO_MERCANCIA, EMBALAJE, ACUERDO_COMERCIAL,
  UNIDAD_COMERCIAL, TIPOS_DESPACHO_DIM, TRATAMIENTOS_ESPECIALES, EMI_PAR_REC,
  REGIMENES_DEX, MODALIDADES_DEX, TIPO_EMBARQUE, CRITERIO_CALIFICACION_ORIGEN,
  TIPO_MERCANCIA, DESC_MIN_SCHEMA, type DescMinField,
  FRV_MARCA, FRV_CLASE, FRV_COMBUSTIBLE, FRV_TRACCION, FRV_TRANSMISION,
  COLORES, ISM_USO, ISM_CARACTERISTICA_ESPECIAL, ISM_TIPO_FRRS, ISM_CLASE_FRRS,
  ISM_TIPO_DESPLAZAMIENTO, TIPO_FABRICACION,
  type CatItem
} from "./_cat"
import {
  buildDAMJson, buildDIMJson, buildDEXJson, buildDAVXml,
  downloadJson, downloadXml
} from "./_export"
import { saveDraft, getDrafts, deleteDraft, getDraftCount, type Draft } from "./_drafts"
import { validateDAM, validateDIM, validateDEX, validateDAV, isAeropuerto } from "./_validate"
import jspreadsheet from 'jspreadsheet-ce'
import 'jspreadsheet-ce/dist/jspreadsheet.css'

/* ── Cargar archivo (JSON / XML) ─────────────────────────────────────────── */

type LoadResult = { type: TipoDoc; entities: number; items: number; ref: string }

function LoadFileButton({ onLoad, accept = ".json,.xml" }:
  { onLoad: (result: LoadResult) => void; accept?: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle")
  const [msg, setMsg] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setStatus("idle"); setMsg("Leyendo...")
      const text = await readFileAsText(file)
      const detected = detectFileType(text)
      if (!detected) throw new Error("Formato no reconocido. Sube un JSON de DAM/DIM/DEX o XML de DAV.")
      const result: LoadResult = { type: detected, entities: 0, items: 0, ref: "" }

      if (detected === "DAM") {
        const raw = JSON.parse(text)
        const { state, entities } = parseDAMJson(raw)
        result.entities = bulkUpsert(entities)
        result.items = state.items.length
        result.ref = state.nroReferencia
        window.dispatchEvent(new CustomEvent("load-dam", { detail: state }))
      } else if (detected === "DIM") {
        const raw = JSON.parse(text)
        const { state, entities } = parseDIMJson(raw)
        result.entities = bulkUpsert(entities)
        result.items = state.items.length
        result.ref = state.nroReferencia
        window.dispatchEvent(new CustomEvent("load-dim", { detail: state }))
      } else if (detected === "DEX") {
        const raw = JSON.parse(text)
        const { state, entities } = parseDEXJson(raw)
        result.entities = bulkUpsert(entities)
        result.items = state.items.length
        result.ref = state.nroReferencia
        window.dispatchEvent(new CustomEvent("load-dex", { detail: state }))
      } else if (detected === "DAV") {
        const { state, entities } = parseDAVXml(text)
        result.entities = bulkUpsert(entities)
        result.items = state.items.length
        result.ref = state.refDam
        window.dispatchEvent(new CustomEvent("load-dav", { detail: state }))
      }

      setStatus("ok")
      setMsg(`${detected} cargado${result.ref ? ` · Ref: ${result.ref}` : ""}${result.entities ? ` · ${result.entities} entidades guardadas` : ""}`)
      onLoad(result)
    } catch (err) {
      setStatus("err")
      setMsg(err instanceof Error ? err.message : "Error al leer el archivo")
    }
    if (ref.current) ref.current.value = ""
    setTimeout(() => setStatus("idle"), 5000)
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={ref} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <button type="button" onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#475569] border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] transition-colors">
        <Upload size={14} /> Cargar archivo
      </button>
      {status !== "idle" && (
        <span className={`text-xs flex items-center gap-1 ${status === "ok" ? "text-green-600" : "text-red-600"}`}>
          {status === "ok" ? <Check size={12} /> : <AlertCircle size={12} />}
          {msg}
        </span>
      )}
    </div>
  )
}

/* ── NIT Autocomplete ────────────────────────────────────────────────────── */

function NitInput({ label, value, onChange, tipo, onFound, required, className }:
  { label: string; value: string; onChange: (v: string) => void
    tipo: Entity["tipo"]; onFound: (e: Entity) => void
    required?: boolean; className?: string }) {
  const [sugs, setSugs] = useState<Entity[]>([])
  const [found, setFound] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setSugs([]) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  useEffect(() => {
    // when value changes externally (e.g. file load), check if entity exists
    if (value && value.length >= 5) {
      const local = findByNit(value, tipo)
      if (local) { setFound(local); onFound(local) }
      else setFound(null)
    } else {
      setFound(null)
    }
  }, [value])

  function handleChange(v: string) {
    onChange(v)
    setFound(null)
    clearTimeout(debRef.current)
    if (!v || v.length < 2) { setSugs([]); return }

    // instant local search
    const local = searchLocal(v, tipo)
    setSugs(local)
    const exact = findByNit(v, tipo)
    if (exact) { setFound(exact); onFound(exact); setSugs([]); return }

    // debounced backend search
    debRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const remote = await fetchFromBackend(v)
        if (remote && remote.tipo === tipo) {
          setFound(remote); onFound(remote); setSugs([])
        } else if (!local.length) {
          const remSearch = await searchBackend(v, tipo)
          setSugs(remSearch)
        }
      } finally { setLoading(false) }
    }, 500)
  }

  function select(e: Entity) {
    onChange(e.nit); setFound(e); onFound(e); setSugs([])
  }

  return (
    <div ref={wrapRef} className={`flex flex-col gap-1 relative ${className ?? ""}`}>
      <label className="text-xs font-medium text-[#475569]">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className={`flex items-center border rounded-lg transition-colors ${found ? "border-green-400 bg-green-50" : "border-[#E2E8F0]"}`}>
        <input
          value={value} onChange={e => handleChange(e.target.value)}
          className="flex-1 text-sm px-3 py-2 bg-transparent font-mono focus:outline-none rounded-lg"
        />
        {loading && <RefreshCw size={12} className="animate-spin text-[#94A3B8] mr-2 flex-shrink-0" />}
        {found && <Check size={12} className="text-green-500 mr-2 flex-shrink-0" />}
      </div>
      {found && (
        <div className="text-xs text-green-700 truncate">{found.razonSocial}</div>
      )}
      {sugs.length > 0 && !found && (
        <div className="absolute top-full left-0 z-50 w-full min-w-[320px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
          {sugs.map(s => (
            <button key={`${s.nit}-${s.tipo}`} type="button"
              className="w-full text-left px-3 py-2 hover:bg-[#F1F5F9] transition-colors border-b border-[#F8FAFC] last:border-0"
              onMouseDown={() => select(s)}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#0F2B5B]">{s.nit || "—"}</span>
                <span className="text-xs text-[#64748B] truncate">{s.razonSocial}</span>
              </div>
              {s.paisCod && <span className="text-[10px] text-[#94A3B8]">{s.paisCod} {s.email ? `· ${s.email}` : ""}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Entity Panel (directorio de entidades) ─────────────────────────────── */

function EntityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState("")
  const [tipo, setTipo] = useState<Entity["tipo"] | "">("")
  const [entities, setEntities] = useState<Entity[]>([])
  const [stats, setStats] = useState(getStats())

  useEffect(() => {
    if (open) { setEntities(loadAll()); setStats(getStats()) }
  }, [open])

  const filtered = entities.filter(e =>
    (!tipo || e.tipo === tipo) &&
    (!filter || e.nit?.includes(filter) || e.razonSocial?.toLowerCase().includes(filter.toLowerCase()))
  )

  function handleDelete(e: Entity) {
    deleteEntity(e.nit, e.tipo)
    setEntities(loadAll())
    setStats(getStats())
  }

  function handleExport() {
    const blob = new Blob([exportBackup()], { type: "application/json" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
    a.download = `tributosbo_entidades_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const r = importBackup(text)
    setEntities(loadAll()); setStats(getStats())
    alert(`Importadas: ${r.imported}${r.errors.length ? `\nErrores: ${r.errors.join("\n")}` : ""}`)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-bold text-[#0F2B5B] text-lg">Directorio de Entidades</h2>
            <div className="flex gap-3 mt-1 text-xs text-[#94A3B8]">
              <span>{stats.importadores} importadores</span>
              <span>{stats.exportadores} exportadores</span>
              <span>{stats.proveedores} proveedores</span>
              <span>{stats.consignatarios} consignatarios</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleExport} className="text-xs px-3 py-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9]">
              <Download size={12} className="inline mr-1" />Exportar
            </button>
            <label className="text-xs px-3 py-1.5 border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9] cursor-pointer">
              <Upload size={12} className="inline mr-1" />Importar
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button type="button" onClick={onClose} className="text-[#64748B] hover:text-[#0F2B5B] p-1"><X size={18} /></button>
          </div>
        </div>
        <div className="px-5 py-3 border-b border-[#E2E8F0] flex gap-2">
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Buscar por NIT o razón social..."
            className="flex-1 text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1E6FD9]" />
          <select value={tipo} onChange={e => setTipo(e.target.value as Entity["tipo"] | "")}
            className="text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white">
            <option value="">Todos</option>
            <option value="importador">Importadores</option>
            <option value="exportador">Exportadores</option>
            <option value="proveedor">Proveedores</option>
            <option value="consignatario">Consignatarios</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#94A3B8]">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay entidades guardadas aún.</p>
              <p className="text-xs mt-1">Se guardan automáticamente al cargar archivos JSON o al exportar declaraciones.</p>
            </div>
          )}
          {filtered.map(e => (
            <div key={`${e.nit}-${e.tipo}`} className="flex items-start justify-between py-3 border-b border-[#F1F5F9] last:border-0 group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${e.tipo === "importador" ? "bg-blue-100 text-blue-700" : e.tipo === "exportador" ? "bg-green-100 text-green-700" : e.tipo === "proveedor" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}>
                    {e.tipo.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-[#475569]">{e.nit || "—"}</span>
                  <span className="text-sm font-medium text-[#0F2B5B] truncate">{e.razonSocial || "(sin nombre)"}</span>
                </div>
                <div className="flex gap-3 mt-0.5 text-[10px] text-[#94A3B8]">
                  {e.paisCod && <span>{e.paisCod}</span>}
                  {e.email && <span>{e.email}</span>}
                  {e.telefonoFax && <span>{e.telefonoFax}</span>}
                </div>
              </div>
              <button type="button" onClick={() => handleDelete(e)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Drafts Panel ───────────────────────────────────────────────────────── */

function DraftsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [tipo, setTipo] = useState<"" | "DAM" | "DIM" | "DEX" | "DAV">("")

  useEffect(() => { if (open) setDrafts(getDrafts()) }, [open])

  const filtered = tipo ? drafts.filter(d => d.tipo === tipo) : drafts

  function handleLoad(d: Draft) {
    window.dispatchEvent(new CustomEvent(`load-${d.tipo.toLowerCase()}`, { detail: d.data }))
    onClose()
  }

  const tipoBadge: Record<string, string> = {
    DAM: "bg-blue-100 text-blue-700",
    DIM: "bg-purple-100 text-purple-700",
    DEX: "bg-green-100 text-green-700",
    DAV: "bg-amber-100 text-amber-700",
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-bold text-[#0F2B5B] text-lg">Historial de Borradores</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">{drafts.length} declaraciones guardadas (máx. 15 por tipo)</p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}
              className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1.5 bg-white">
              <option value="">Todos</option>
              {["DAM", "DIM", "DEX", "DAV"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="button" onClick={onClose} className="text-[#64748B] hover:text-[#0F2B5B] p-1"><X size={18} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#94A3B8]">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay borradores guardados.</p>
              <p className="text-xs mt-1">Se guardan automáticamente al exportar una declaración.</p>
            </div>
          )}
          {filtered.map(d => (
            <div key={d.id} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0 group">
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${tipoBadge[d.tipo]}`}>{d.tipo}</span>
                  <span className="text-sm font-medium text-[#0F2B5B] truncate">{d.nombre}</span>
                  {d.ref && d.nombre !== d.ref && <span className="text-xs text-[#94A3B8] font-mono flex-shrink-0">{d.ref}</span>}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">{new Date(d.fecha).toLocaleString("es-BO")}</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button type="button" onClick={() => handleLoad(d)}
                  className="text-xs px-2.5 py-1.5 bg-[#1E6FD9] text-white rounded-lg hover:bg-[#1558B0] font-medium">
                  Cargar
                </button>
                <button type="button" onClick={() => { deleteDraft(d.id); setDrafts(getDrafts()) }}
                  className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── UI helpers ─────────────────────────────────────────────────────────── */

const STORAGE_KEY = "tributosbo_declaraciones_v3"

function uid() { return Math.random().toString(36).slice(2, 9) }
function n(v: string | undefined | null) { return parseFloat(v || "0") || 0 }
function fmt2(v: number) { return v.toFixed(2) }

// Replica exacta de la validacion de email del VBA (frmProveedor)
// Debe tener @, punto despues del @, sin dobles puntos, no terminar en punto
function validaEmail(email: string): boolean {
  if (!email) return true
  const atIdx = email.indexOf("@")
  if (atIdx < 0) return false
  const afterAt = email.slice(atIdx + 1)
  if (!afterAt.includes(".")) return false
  if (email.includes("..")) return false
  if (email.endsWith(".")) return false
  return true
}

type Sel = { label: string; value: string }
function catToSel(list: CatItem[]): Sel[] { return list.map(c => ({ value: c.cod, label: `${c.cod} - ${c.desc}` })) }

function Select({ label, value, onChange, options, required, className, disabled }:
  { label: string; value: string; onChange: (v: string) => void; options: Sel[]; required?: boolean; className?: string; disabled?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <label className="text-xs font-medium text-[#475569]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E6FD9] focus:border-transparent ${disabled ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed" : "bg-white text-[#0F2B5B]"}`}
      >
        <option value="">— seleccione —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Input({ label, value, onChange, type = "text", placeholder, required, className, mono }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean; className?: string; mono?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${className || ""}`}>
      <label className="text-xs font-medium text-[#475569]">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E6FD9] focus:border-transparent ${mono ? "font-mono" : ""}`}
      />
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? "bg-[#1E6FD9]" : "bg-[#CBD5E1]"} relative`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
      <span className="text-sm text-[#475569]">{label}</span>
    </div>
  )
}

function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group inline-block w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-64 text-xs text-white bg-[#1E293B] rounded-lg px-3 py-2 shadow-lg pointer-events-none leading-relaxed">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
      </div>
    </div>
  )
}

function Section({ title, children, defaultOpen = true }:
  { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mb-4">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors">
        <span className="font-semibold text-sm text-[#0F2B5B]">{title}</span>
        {open ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  )
}

/* ── NANDINA autocomplete ─────────────────────────────────────────────────── */

type NanResult = { codigo: string; descripcion: string; ga_porcentaje: number; ice_especifico: number; unidad_medida: string }

function NandinaCell({ value, onChange, onSelect, cellKey, onCellFocus, onCellKeyDown, inputClassName }: {
  value: string
  onChange: (v: string) => void
  onSelect: (r: NanResult) => void
  cellKey?: string
  onCellFocus?: () => void
  onCellKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  inputClassName?: string
}) {
  const [results, setResults] = useState<NanResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setResults([]) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleChange(v: string) {
    onChange(v)
    clearTimeout(debounce.current)
    // Buscar sin puntos: "5901.10.00" → "590110000" para la query
    const q = v.replace(/\./g, "")
    if (q.length < 3) { setResults([]); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const d = await api.get(`/nandina?q=${encodeURIComponent(q)}`)
        setResults(d.results?.slice(0, 12) ?? [])
      } catch { setResults([]) }
      setLoading(false)
    }, 250)
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1">
        <input
          value={value} onChange={e => handleChange(e.target.value)}
          placeholder="Nandina..."
          className={inputClassName ?? "w-full text-xs border border-[#E2E8F0] rounded px-2 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#1E6FD9]"}
          data-cell={cellKey}
          onFocus={onCellFocus}
          onKeyDown={onCellKeyDown}
        />
        {loading && <RefreshCw size={12} className="animate-spin text-[#94A3B8] flex-shrink-0" />}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 z-50 w-[420px] bg-white border border-[#E2E8F0] rounded-lg shadow-xl mt-1 max-h-72 overflow-y-auto">
          {results.map(r => (
            <button key={r.codigo} type="button"
              className="w-full text-left px-3 py-2 hover:bg-[#F1F5F9] transition-colors border-b border-[#F1F5F9] last:border-0"
              onMouseDown={() => { onSelect(r); setResults([]) }}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#0F2B5B] font-semibold flex-shrink-0">{r.codigo}</span>
                <span className="text-xs text-[#475569] truncate flex-1">{r.descripcion}</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[10px] text-[#94A3B8]">GA: {r.ga_porcentaje}%</span>
                {r.ice_especifico > 0 && <span className="text-[10px] text-[#94A3B8]">ICE: {r.ice_especifico}%</span>}
                <span className="text-[10px] text-[#94A3B8]">{r.unidad_medida}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Ref auto-numbering input ───────────────────────────────────────────── */

function RefInput({ value, onChange, tipoDoc }: { value: string; onChange: (v: string) => void; tipoDoc: TipoDoc }) {
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const data = await api.get(`/ref/next?tipo=${tipoDoc}`)
      if (data?.ref) onChange(data.ref)
    } catch {
      const y = new Date().getFullYear()
      onChange(`${y}-0001`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#475569]">N. Referencia<span className="text-red-500 ml-0.5">*</span></label>
      <div className="flex gap-1">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="2025-0001"
          className="flex-1 text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-[#1E6FD9]" />
        <button type="button" onClick={generate} disabled={loading}
          title="Generar número automático desde el servidor"
          className="px-2.5 py-2 text-xs bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg hover:bg-[#E2E8F0] text-[#475569] flex items-center gap-1 disabled:opacity-50 transition-colors whitespace-nowrap">
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Generar
        </button>
      </div>
    </div>
  )
}

/* ── Export bar with validation ─────────────────────────────────────────── */

function ExportBar({ tipoDoc, validation, onExport, onSave, saved }: {
  tipoDoc: TipoDoc
  validation: { ok: boolean; errors: string[] }
  onExport: () => void
  onSave: () => void
  saved: boolean
}) {
  const [showErr, setShowErr] = useState(false)
  const colors: Record<TipoDoc, string> = { DAM: "#0F2B5B", DIM: "#7C3AED", DEX: "#0D7A3E", DAV: "#B45309" }
  const ext = tipoDoc === "DAV" ? ".xml" : ".json"

  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <LoadFileButton onLoad={r => {
        if (r.type !== tipoDoc) alert(`El archivo es ${r.type}. Cambia a la pestaña ${r.type} para cargarlo.`)
      }} />
      <div className="relative">
        {!validation.ok ? (
          <>
            <button type="button" onClick={() => setShowErr(v => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100">
              <AlertCircle size={12} />
              {validation.errors.length} campo{validation.errors.length !== 1 ? "s" : ""} requerido{validation.errors.length !== 1 ? "s" : ""}
              {showErr ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {showErr && (
              <div className="absolute top-full left-0 z-50 mt-1 w-80 bg-white border border-red-200 rounded-xl p-4 shadow-xl max-h-64 overflow-y-auto">
                <ul className="space-y-1.5">
                  {validation.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-green-600 px-2 py-2">
            <Check size={12} /> Listo para exportar
          </span>
        )}
      </div>
      <div className="flex-1" />
      <button type="button" onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#475569] border border-[#E2E8F0] rounded-lg hover:bg-[#F1F5F9]">
        {saved ? <><Check size={14} className="text-green-500" /> Guardado</> : <><Save size={14} /> Guardar borrador</>}
      </button>
      <button type="button" onClick={onExport} disabled={!validation.ok}
        title={validation.ok ? "" : "Complete los campos requeridos antes de exportar"}
        style={validation.ok ? { background: colors[tipoDoc] } : undefined}
        className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all ${validation.ok ? "text-white hover:opacity-90" : "text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] cursor-not-allowed"}`}>
        <Download size={14} /> Exportar {tipoDoc}{ext}
      </button>
    </div>
  )
}

/* ── CSV import for items ────────────────────────────────────────────────── */

function parseCsvItems(text: string): Partial<ItemForm>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n")
  if (lines.length < 2) return []
  const parseVal = (v: string) => v.trim().replace(/^["']/, "").replace(/["']$/, "")
  const headers = lines[0].split(",").map(parseVal).map(h => h.toLowerCase())
  const colMap: Record<number, keyof ItemForm> = {}
  const aliases: Record<string, keyof ItemForm> = {
    nandina: "nandina", subpartida: "nandina", codigo: "nandina",
    descripcion: "nandinaDesc", desc: "nandinaDesc", nombre: "nandinaDesc", description: "nandinaDesc",
    cantidad: "cantFisica", qty: "cantFisica", cant: "cantFisica",
    precio: "precioUnit", price: "precioUnit", precio_unit: "precioUnit", pu: "precioUnit",
    pais: "paisOrigen", pais_origen: "paisOrigen", origin: "paisOrigen",
    peso: "pesoNeto", peso_neto: "pesoNeto", weight: "pesoNeto",
    factura: "nroFactura", invoice: "nroFactura", nro_factura: "nroFactura",
    fob: "fobItem", valor_fob: "fobItem", fob_item: "fobItem",
  }
  headers.forEach((h, i) => { if (aliases[h]) colMap[i] = aliases[h] })

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = line.split(",").map(parseVal)
    const item: Partial<ItemForm> = {}
    Object.entries(colMap).forEach(([idx, key]) => {
      const v = vals[parseInt(idx)] ?? ""
      if (v) (item as Record<string, string>)[key as string] = v
    })
    return item
  }).filter(item => item.nandina || item.nandinaDesc)
}

function CsvImportButton({ onImport }: { onImport: (rows: Partial<ItemForm>[]) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const rows = parseCsvItems(text)
    if (rows.length) onImport(rows)
    else alert("No se encontraron filas válidas. Columnas esperadas: nandina, descripción, cantidad, precio")
    if (ref.current) ref.current.value = ""
  }
  return (
    <>
      <input ref={ref} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
      <button type="button" onClick={() => ref.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#0D7A3E] border border-[#0D7A3E] rounded-lg hover:bg-[#F0FDF4] transition-colors">
        <Upload size={12} /> Importar CSV
      </button>
    </>
  )
}

/* ── Shared item grid (DAM/DIM) ──────────────────────────────────────────── */

function mkItem(): ItemForm {
  return {
    id: uid(), nroFactura: "", nandina: "", nandinaDesc: "",
    tipoMercancia: "COMUN", descMinima: {},
    umFisica: "NMB", cantFisica: "", unidadFisicaConversion: "", cantFisicaConversion: "",
    umComercial: "NMB", umComercialEspecifique: "", cantComercial: "",
    precioUnit: "", paisOrigen: "CN", acuerdoComercial: "NA", criterioCalificacionOrigen: "",
    pesoNeto: "", embalaje: "CT", estado: "1", estadoEspecifique: "", marcas: "", relacionItemBulto: "",
    valorTransaccionItem: "", fobItem: "", ga_pct: "", ice_pct: "", iva_pct: "14.94",
    observaciones: "",
    codigoRitex: "", cantidadRitex: "", resolucionRitex: "",
    incExeIva: "", timbre: "", ime: "", regCodNal: "",
    declaracionPresedente: "", itemPresedente: "", subRegimenPresedente: ""
  }
}

function calcTributos(item: ItemForm, fobTotal: number, fleteTotal: number, segTotal: number, tc = 6.97) {
  const fob = n(item.fobItem) || n(item.cantFisica) * n(item.precioUnit)
  const ratio = fobTotal > 0 ? fob / fobTotal : 0
  const cif = fob + ratio * (fleteTotal + segTotal)
  const ga = cif * n(item.ga_pct) / 100
  const ice = (cif + ga) * n(item.ice_pct) / 100
  const iva = (cif + ga + ice) * 14.94 / 100
  const total = ga + ice + iva
  return { fob, cif, ga, ice, iva, total, gaBs: ga * tc, iceBs: ice * tc, ivaBs: iva * tc, totalBs: total * tc, cifBs: cif * tc }
}

type DemisCampo = {
  campo: string; etiqueta: string; tipo: "text" | "dropdown"
  opciones: string[]; placeholder?: string; ayuda?: string; requerido?: boolean
  valor_defecto?: string; aplica?: boolean
}
type DemisData = {
  nandina: string; modo: string; source: string; campos: DemisCampo[]
}
function normDemisResponse(raw: any): DemisData {
  return {
    nandina: raw.nandina ?? "",
    modo: raw.modo ?? raw.tipo ?? "generico",
    source: raw.source ?? raw.tipo ?? "",
    campos: (raw.campos ?? []).map((c: any): DemisCampo => ({
      campo: c.campo ?? c.nombre ?? "",
      etiqueta: c.etiqueta ?? c.campo ?? c.nombre ?? "",
      tipo: (c.tipo === "dropdown" || c.tipo_input === "dropdown") ? "dropdown" : "text",
      opciones: Array.isArray(c.opciones) ? c.opciones : [],
      placeholder: c.placeholder ?? "",
      ayuda: c.ayuda ?? c.nota_ayuda ?? "",
      requerido: c.requerido !== false,
      valor_defecto: c.valor_defecto ?? "",
      aplica: c.aplica !== false,
    }))
  }
}
const MODO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  anexo_especifico: { bg: "#DCFCE7", text: "#166534", label: "ANEXO ESPECIFICO" },
  articulo:         { bg: "#DBEAFE", text: "#1E40AF", label: "ARTICULO" },
  completo:         { bg: "#EDE9FE", text: "#5B21B6", label: "ART + ANEXO" },
  anexo:            { bg: "#DCFCE7", text: "#166534", label: "ANEXO" },
  generico:         { bg: "#F1F5F9", text: "#475569", label: "GENERICO" },
}
function DemisPanel({ nandina, descMinima, onChange, onClose, itemIndex }: {
  nandina: string; descMinima: Record<string, string>
  onChange: (k: string, v: string) => void; onClose: () => void; itemIndex: number
}) {
  const [data, setData] = useState<DemisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  useEffect(() => {
    if (!nandina || nandina.length < 4) { setData(null); return }
    setLoading(true); setErr("")
    api.get(`/demis/reglas/${encodeURIComponent(nandina)}`)
      .then((raw: any) => {
        const d = normDemisResponse(raw)
        setData(d)
        setLoading(false)
        d.campos.forEach(campo => {
          if (campo.aplica === false) {
            onChange(campo.campo, "-")
          } else if (campo.valor_defecto && Object.keys(descMinima).length === 0) {
            onChange(campo.campo, campo.valor_defecto)
          }
        })
      })
      .catch(e => { setErr(e.message); setLoading(false) })
  }, [nandina])
  const badge = data ? MODO_BADGE[data.modo] : null
  return (
    <div className="p-4 bg-[#EFF6FF] border-x border-b border-[#BFDBFE]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#1E40AF]">
            Descripción Mínima - Ítem {itemIndex + 1}: {nandina}
          </span>
          {badge && (
            <span style={{ background: badge.bg, color: badge.text }}
              className="text-xs px-2 py-0.5 rounded-full font-medium">{badge.label}</span>
          )}
          {data && <span className="text-xs text-[#64748B]">{data.source}</span>}
        </div>
        <button type="button" onClick={onClose} className="text-[#64748B] hover:text-[#0F2B5B] shrink-0"><X size={16} /></button>
      </div>
      {!nandina || nandina.length < 4
        ? <p className="text-xs text-[#94A3B8]">Ingresa el código NANDINA del ítem primero.</p>
        : loading
        ? <p className="text-xs text-[#64748B] animate-pulse">Cargando campos DEMIS...</p>
        : err
        ? <p className="text-xs text-red-500">{err}</p>
        : data
        ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.campos.map(campo => {
              const noAplica = campo.aplica === false
              return (
              <div key={campo.campo} className={`flex flex-col gap-1 ${noAplica ? "opacity-50" : ""}`}>
                <label className="text-xs font-medium text-[#3730A3] flex items-center gap-1">
                  {campo.etiqueta}{campo.requerido && <span className="text-red-400 ml-0.5">*</span>}
                  {noAplica && <span className="text-[#94A3B8] text-[9px] ml-0.5">(N/A)</span>}
                  {campo.ayuda && !noAplica && (
                    <span className="relative group ml-0.5 cursor-default">
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#C7D2FE] text-[#3730A3] text-[9px] font-bold leading-none select-none">?</span>
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 bg-[#1E1B4B] text-white text-[11px] leading-snug rounded-lg px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
                        {campo.ayuda}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E1B4B]" />
                      </span>
                    </span>
                  )}
                </label>
                {noAplica
                  ? (
                    <input value="-" readOnly
                      className="text-sm border border-[#E2E8F0] rounded px-2 py-1.5 bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed" />
                  )
                  : campo.tipo === "dropdown" && campo.opciones.length > 0
                  ? (
                    <select value={descMinima[campo.campo] || ""}
                      onChange={e => onChange(campo.campo, e.target.value)}
                      className="text-sm border border-[#C7D2FE] rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#6366F1]">
                      <option value="">-- Seleccionar --</option>
                      {campo.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={descMinima[campo.campo] || ""}
                      onChange={e => onChange(campo.campo, e.target.value)}
                      placeholder={campo.placeholder || campo.etiqueta}
                      className="text-sm border border-[#C7D2FE] rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  )}
              </div>
              )
            })}
          </div>
        )
        : null}
    </div>
  )
}

/* ── DESC MIN SCHEMA - mapeo URL → catalogo estatico ─────────────────────── */

const DM_CAT_MAP: Record<string, CatItem[]> = {
  frvClase:                  FRV_CLASE,
  frvMarca:                  FRV_MARCA,
  frvTraccion:               FRV_TRACCION,
  frvCombustible:            FRV_COMBUSTIBLE,
  frvTransmision:            FRV_TRANSMISION,
  ism_color:                 COLORES,
  color:                     COLORES,
  Paises:                    PAISES,
  traccion:                  FRV_TRACCION,
  ism_traccion:              FRV_TRACCION,
  ism_uso:                   ISM_USO,
  ism_caracteristica_especial: ISM_CARACTERISTICA_ESPECIAL,
  tipofabricacion:           TIPO_FABRICACION,
  ism_tipo_desplazamiento:   ISM_TIPO_DESPLAZAMIENTO,
  ism_tipo_frrs:             ISM_TIPO_FRRS,
  ism_clase_frrs:            ISM_CLASE_FRRS,
  estadoMercancia:           ESTADO_MERCANCIA,
  embalaje:                  EMBALAJE,
  unidadComercial:           UNIDAD_COMERCIAL,
}

const DM_OPTS_MAP: Record<string, string[]> = {
  'readfile/sino': ['SI', 'NO'],
  ism_unidad_potencia:  ['HP', 'CV', 'KW'],
  unidadpotencia:       ['HP', 'CV', 'KW'],
}

function DescMinSchemaPanel({
  tipoMercancia, values, onChange, inp, lbl
}: {
  tipoMercancia: string
  values: Record<string, string>
  onChange: (k: string, v: string) => void
  inp: React.CSSProperties
  lbl: React.CSSProperties
}) {
  const fields = DESC_MIN_SCHEMA[tipoMercancia]
  if (!fields || fields.length === 0) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 8px', marginTop: 6 }}>
      {fields.map((f: DescMinField) => {
        const key = f.nombreCorto
        const val = values[key] ?? ''
        const cat = f.tipo === 'combobox' ? DM_CAT_MAP[f.url] : undefined
        const opts = f.tipo === 'combobox' && !cat ? DM_OPTS_MAP[f.url] : undefined
        const dis = f.disabled

        return (
          <div key={key}>
            <label style={{ ...lbl, color: dis ? '#bbb' : f.requerido ? '#1a1a1a' : '#444' }}>
              {f.nombre.replace(/\(\*\)/g, '').replace(/\[.*?\]/g, '').trim()}
              {f.requerido && !dis && <span style={{ color: '#c00' }}>*</span>}
            </label>
            {dis ? (
              <input value={val} readOnly style={{ ...inp, background: '#efefef', color: '#999' }} />
            ) : cat ? (
              <select value={val} onChange={e => onChange(key, e.target.value)} style={inp}>
                <option value="">-- seleccione --</option>
                {cat.map(o => (
                  <option key={o.cod} value={o.cod}>{o.cod} - {o.desc}</option>
                ))}
              </select>
            ) : opts ? (
              <select value={val} onChange={e => onChange(key, e.target.value)} style={inp}>
                <option value="">-- seleccione --</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                value={val}
                onChange={e => onChange(key, e.target.value)}
                style={inp}
                placeholder={f.nombre.slice(0, 30)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ItemDetailModal({ items, modalIdx, setModalIdx, setItems, facturas, showRitex, tc, fobTotal, fleteTotal, segTotal }: {
  items: ItemForm[]; modalIdx: number
  setModalIdx: (n: number | null) => void
  setItems: (fn: (prev: ItemForm[]) => ItemForm[]) => void
  facturas: FacturaForm[]; showRitex: boolean; tc: number
  fobTotal: number; fleteTotal: number; segTotal: number
}) {
  const [local, setLocal] = useState<ItemForm>({ ...items[modalIdx] })
  const [demisData, setDemisData] = useState<DemisData | null>(null)
  const [demisLoading, setDemisLoading] = useState(false)
  const [propagMsg, setPropagMsg] = useState<string | null>(null)

  useEffect(() => {
    const nd = local.nandina
    if (!nd || nd.length < 4) { setDemisData(null); return }
    let cancelled = false
    setDemisLoading(true)
    api.get(`/demis/reglas/${encodeURIComponent(nd)}`)
      .then((raw: any) => { if (!cancelled) { setDemisData(normDemisResponse(raw)); setDemisLoading(false) } })
      .catch(() => { if (!cancelled) setDemisLoading(false) })
    return () => { cancelled = true }
  }, [local.nandina])

  const setF = (k: keyof ItemForm, v: string) => setLocal(l => ({ ...l, [k]: v }))
  const setDM = (k: string, v: string) => setLocal(l => ({ ...l, descMinima: { ...l.descMinima, [k]: v } }))

  // Map DEMIS campo to static schema nombreCorto key so DescMinGrid can display the value
  function demisStorageKey(c: DemisCampo): string {
    const fields = (DESC_MIN_SCHEMA[local.tipoMercancia] ?? []) as DescMinField[]
    if (fields.length) {
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
      const etiq = norm(c.etiqueta)
      const match = fields.find(f => norm(f.nombre) === etiq)
      if (match) return match.nombreCorto
    }
    return c.campo
  }

  function commit() { setItems(is => is.map((item, i) => i === modalIdx ? { ...local } : item)) }
  function goTo(idx: number) {
    setItems(is => is.map((item, i) => i === modalIdx ? { ...local } : item))
    setLocal({ ...items[idx] }); setDemisData(null); setModalIdx(idx)
  }
  function saveAndContinue() {
    commit()
    if (modalIdx < items.length - 1) {
      setLocal({ ...items[modalIdx + 1] })
      setDemisData(null)
      setModalIdx(modalIdx + 1)
    } else {
      setModalIdx(null)
    }
  }
  function copyItem() {
    const clone = { ...local, id: uid() }
    setItems(is => { const s = is.map((item, i) => i === modalIdx ? { ...local } : item); const n = [...s]; n.splice(modalIdx + 1, 0, clone); return n })
    setLocal({ ...clone }); setDemisData(null); setModalIdx(modalIdx + 1)
  }
  function deleteItem() {
    setItems(is => is.filter((_, i) => i !== modalIdx))
    setModalIdx(items.length > 1 ? Math.max(0, modalIdx - 1) : null)
  }
  function addNewItem() {
    const ni = { ...mkItem(), nroFactura: local.nroFactura }
    setItems(is => {
      const saved = is.map((item, i) => i === modalIdx ? { ...local } : item)
      return [...saved, ni]
    })
    setLocal({ ...ni }); setDemisData(null); setModalIdx(items.length)
  }

  function propagarNandina() {
    const nan = (local.nandina ?? '').trim()
    if (!nan) { setPropagMsg('Sin NANDINA definida'); setTimeout(() => setPropagMsg(null), 2000); return }
    const hasDM = Object.values(local.descMinima ?? {}).some(v => String(v ?? '').trim())
    if (!hasDM) { setPropagMsg('Rellena al menos un campo de descripcion primero'); setTimeout(() => setPropagMsg(null), 2500); return }
    const count = items.filter((item, i) => i !== modalIdx && (item.nandina ?? '').trim() === nan).length
    if (count === 0) { setPropagMsg('No hay otros items con la misma NANDINA'); setTimeout(() => setPropagMsg(null), 2500); return }
    setItems(is => is.map((item, i) => {
      if (i === modalIdx) return { ...local }
      if ((item.nandina ?? '').trim() === nan) return { ...item, tipoMercancia: local.tipoMercancia, descMinima: { ...local.descMinima } }
      return item
    }))
    setPropagMsg(`Aplicado a ${count} item(s) con NANDINA ${nan.slice(0, 11)}`)
    setTimeout(() => setPropagMsg(null), 3500)
  }

  const total = items.length; const current = modalIdx + 1
  const fobUnitario = n(local.cantComercial) > 0
    ? (n(local.valorTransaccionItem || local.fobItem) / n(local.cantComercial)).toFixed(2) : ""
  const t = calcTributos(local, fobTotal, fleteTotal, segTotal, tc)
  const factOpts = facturas.map(f => ({ v: f.nroFactura, l: `${f.nroFactura}${f.proveedorRazonSocial ? ' | ' + f.proveedorRazonSocial.slice(0, 28) : ''}` }))

  const lbl: React.CSSProperties = { fontSize: 10, color: '#444', display: 'block', marginBottom: 2, fontWeight: 600 }
  const inp: React.CSSProperties = { width: '100%', fontSize: 11, border: '1px solid #aaa', borderRadius: 2, padding: '3px 6px', background: '#fff', height: 22, boxSizing: 'border-box' }
  const ro: React.CSSProperties = { ...inp, background: '#efefef', color: '#777' }
  const sec: React.CSSProperties = { border: '1px solid #ccc', borderRadius: 3, padding: '8px 10px', marginBottom: 8, background: '#fafafa' }
  const secTtl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#333', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const navBtn: React.CSSProperties = { fontSize: 13, padding: '1px 9px', border: '1px solid #999', borderRadius: 2, background: '#f0f0f0', cursor: 'pointer' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) { commit(); setModalIdx(null) } }}>
      <div style={{ background: '#f2f2f2', border: '1px solid #666', borderRadius: 4, width: 820, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 20px rgba(0,0,0,0.35)', fontSize: 11 }}>

        {/* Título */}
        <div style={{ background: '#0F2B5B', color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '3px 3px 0 0' }}>
          <span>DAM - Datos del ítem</span>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15, padding: 0, lineHeight: 1 }}>✕</button>
        </div>

        {/* Navegación */}
        <div style={{ display: 'flex', gap: 4, padding: '5px 12px', background: '#e0e0e0', borderBottom: '1px solid #bbb', alignItems: 'center' }}>
          <button type="button" onClick={() => goTo(0)} disabled={modalIdx === 0} style={navBtn}>«</button>
          <button type="button" onClick={() => goTo(modalIdx - 1)} disabled={modalIdx === 0} style={navBtn}>‹</button>
          <span style={{ fontSize: 11, padding: '1px 10px', border: '1px solid #999', background: '#fff', borderRadius: 2, minWidth: 34, textAlign: 'center', display: 'inline-block' }}>{current}</span>
          <button type="button" onClick={() => goTo(modalIdx + 1)} disabled={modalIdx >= total - 1} style={navBtn}>›</button>
          <button type="button" onClick={() => goTo(total - 1)} disabled={modalIdx >= total - 1} style={navBtn}>»</button>
          <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>Ítem {current} de {total}</span>
        </div>

        {/* Contenido scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px' }}>

          {/* DETALLE */}
          <div style={sec}>
            <div style={secTtl}>Detalle</div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 1fr 190px', gap: '5px 8px', alignItems: 'end' }}>
              <div><label style={lbl}>H1. Nro ítem</label><input value={current} readOnly style={ro} /></div>
              <div><label style={lbl}>H1. Parcial</label><input value="0" readOnly style={ro} /></div>
              <div>
                <label style={lbl}>Factura *</label>
                <select value={local.nroFactura} onChange={e => setF('nroFactura', e.target.value)} style={inp}>
                  <option value="">— seleccione —</option>
                  {factOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>H3. Subpartida arancelaria *</label>
                <NandinaCell
                  value={local.nandina}
                  onChange={v => setF('nandina', v)}
                  onSelect={r => setLocal(l => ({
                    ...l,
                    nandina: r.codigo, nandinaDesc: r.descripcion,
                    ga_pct: String(r.ga_porcentaje),
                    ice_pct: String(r.ice_especifico || ""),
                    umFisica: r.unidad_medida.startsWith("KG") ? "KGM" : "NMB",
                    umComercial: r.unidad_medida.startsWith("KG") ? "KGM" : "NMB"
                  }))}
                  inputClassName="w-full text-[11px] border border-[#aaa] rounded-sm px-1.5 font-mono bg-white focus:outline-none focus:border-[#1E6FD9]"
                />
              </div>
            </div>
            <div style={{ marginTop: 5 }}>
              <label style={lbl}>Descripción arancelaria</label>
              <input value={local.nandinaDesc} onChange={e => setF('nandinaDesc', e.target.value)} style={{ ...inp, background: '#f8f8f8' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 85px 85px 85px', gap: '5px 8px', marginTop: 6, alignItems: 'end' }}>
              <div>
                <label style={lbl}>H6. Unidad de medida</label>
                <select value={local.umFisica} onChange={e => setF('umFisica', e.target.value)} style={inp}>
                  {UNIDAD_COMERCIAL.map(u => <option key={u.cod} value={u.cod}>{u.cod} - {u.desc}</option>)}
                </select>
              </div>
              <div><label style={lbl}>H7. Cant. física *</label><input type="number" value={local.cantFisica} onChange={e => setF('cantFisica', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>H6.1. UM conversión</label><input value={local.unidadFisicaConversion} onChange={e => setF('unidadFisicaConversion', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>H7.1. Cant. conversión</label><input type="number" value={local.cantFisicaConversion} onChange={e => setF('cantFisicaConversion', e.target.value)} style={inp} /></div>
            </div>
          </div>

          {/* DESCRIPCIÓN MÍNIMA */}
          <div style={sec}>
            <div style={{ ...secTtl, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Descripción Mínima de la Mercancía</span>
                {demisLoading && <span style={{ fontWeight: 400, color: '#888' }}>cargando DEMIS...</span>}
                {demisData && <span style={{ fontWeight: 400, color: '#1E6FD9', fontSize: 9 }}>{demisData.nandina} · {MODO_BADGE[demisData.modo]?.label}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {propagMsg && (
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: propagMsg.startsWith('Aplicado') ? '#dcfce7' : '#fef9c3', color: propagMsg.startsWith('Aplicado') ? '#166534' : '#713f12', fontWeight: 400 }}>
                    {propagMsg}
                  </span>
                )}
                <button type="button" onClick={propagarNandina}
                  style={{ fontSize: 9, padding: '2px 8px', border: '1px solid #1E6FD9', borderRadius: 2, background: '#EFF6FF', color: '#1E6FD9', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Propagar a igual NANDINA
                </button>
              </div>
            </div>

            {/* Selector tipo mercancia - 122 tipos del Excel */}
            <div style={{ marginBottom: 6 }}>
              <label style={lbl}>Tipo de mercancía (*)</label>
              <select
                value={local.tipoMercancia}
                onChange={e => setLocal(l => ({ ...l, tipoMercancia: e.target.value, descMinima: {} }))}
                style={{ ...inp, maxWidth: 360 }}
              >
                {TIPO_MERCANCIA.map(t => (
                  <option key={t.cod} value={t.cod}>{t.cod} - {t.desc}</option>
                ))}
              </select>
            </div>

            {/* Campos DEMIS (prioritarios si disponibles) */}
            {demisData ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 8px' }}>
                {demisData.campos.map(c => {
                  const key = demisStorageKey(c)
                  const val = local.descMinima[key] ?? ""
                  const off = c.aplica === false
                  return (
                    <div key={c.campo}>
                      <label style={{ ...lbl, color: off ? '#bbb' : c.requerido ? '#111' : '#444' }}>
                        {c.etiqueta.replace(/\(\*\)/g, '')}
                        {!off && c.requerido && <span style={{ color: '#c00' }}>*</span>}
                      </label>
                      {c.tipo === 'dropdown' ? (
                        <select value={val} onChange={e => setDM(key, e.target.value)} disabled={off}
                          style={{ ...inp, background: off ? '#efefef' : '#fff', color: off ? '#bbb' : '#111' }}>
                          <option value="">[Seleccione]</option>
                          {c.opciones.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input value={val} onChange={e => setDM(key, e.target.value)} disabled={off}
                          style={{ ...inp, background: off ? '#efefef' : '#fff', color: off ? '#bbb' : '#111' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Campos del schema estatico del Excel (fallback cuando DEMIS no responde) */
              <DescMinSchemaPanel
                tipoMercancia={local.tipoMercancia}
                values={local.descMinima}
                onChange={setDM}
                inp={inp}
                lbl={lbl}
              />
            )}
          </div>

          {/* IDENTIFICACIÓN Y VALORES */}
          <div style={sec}>
            <div style={secTtl}>Identificación y Valores</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 85px 85px', gap: '5px 8px', marginBottom: 6 }}>
              <div>
                <label style={lbl}>H9. Unidad comercial *</label>
                <select value={local.umComercial} onChange={e => setF('umComercial', e.target.value)} style={inp}>
                  {UNIDAD_COMERCIAL.map(u => <option key={u.cod} value={u.cod}>{u.cod} - {u.desc}</option>)}
                </select>
              </div>
              <div><label style={lbl}>H9.1. Especifique</label><input value={local.umComercialEspecifique} onChange={e => setF('umComercialEspecifique', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>H10. Cant. comercial *</label><input type="number" value={local.cantComercial} onChange={e => setF('cantComercial', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>H11. Precio unit. (USD) *</label><input type="number" value={local.precioUnit} onChange={e => setF('precioUnit', e.target.value)} style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 8px', marginBottom: 6 }}>
              <div>
                <label style={lbl}>H12. País de origen *</label>
                <select value={local.paisOrigen} onChange={e => setF('paisOrigen', e.target.value)} style={inp}>
                  {PAISES.map(p => <option key={p.cod} value={p.cod}>{p.cod} - {p.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>H12. Acuerdo comercial</label>
                <select value={local.acuerdoComercial} onChange={e => setF('acuerdoComercial', e.target.value)} style={inp}>
                  {ACUERDO_COMERCIAL.map(a => <option key={a.cod} value={a.cod}>{a.cod} - {a.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>H15. Criterio origen</label>
                <select value={local.criterioCalificacionOrigen} onChange={e => setF('criterioCalificacionOrigen', e.target.value)}
                  disabled={local.acuerdoComercial === 'NA' || !local.acuerdoComercial} style={inp}>
                  {CRITERIO_CALIFICACION_ORIGEN.map(c => <option key={c.cod} value={c.cod}>{c.cod || '-'}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>H16. Embalaje *</label>
                <select value={local.embalaje} onChange={e => setF('embalaje', e.target.value)} style={inp}>
                  {EMBALAJE.map(em => <option key={em.cod} value={em.cod}>{em.cod} - {em.desc}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 1fr 1fr', gap: '5px 8px', marginBottom: 6 }}>
              <div><label style={lbl}>H19. Peso neto (Kg.) *</label><input type="number" value={local.pesoNeto} onChange={e => setF('pesoNeto', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>H19.1. Rel. Item-Bulto</label><input type="number" value={local.relacionItemBulto} onChange={e => setF('relacionItemBulto', e.target.value)} style={inp} step="0.01" /></div>
              <div><label style={lbl}>H20. Marcas</label><input value={local.marcas} onChange={e => setF('marcas', e.target.value)} style={inp} /></div>
              <div>
                <label style={lbl}>H21. Estado *</label>
                <select value={local.estado} onChange={e => setF('estado', e.target.value)} style={inp}>
                  {ESTADO_MERCANCIA.map(em => <option key={em.cod} value={em.cod}>{em.cod} - {em.desc}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={lbl}>H21.1. Especifique (estado)</label>
              <input value={local.estadoEspecifique} onChange={e => setF('estadoEspecifique', e.target.value)} style={inp} />
            </div>
            {showRitex && (
              <div style={{ marginBottom: 6, border: '1px solid #d0d8e8', borderRadius: 3, padding: '6px 8px', background: '#f0f4fb' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#446', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campos DIM</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px', marginBottom: 4 }}>
                  <div><label style={lbl}>Código RITEX</label><input value={local.codigoRitex} onChange={e => setF('codigoRitex', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Cantidad RITEX</label><input type="number" value={local.cantidadRitex} onChange={e => setF('cantidadRitex', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Resolución RITEX</label><input value={local.resolucionRitex} onChange={e => setF('resolucionRitex', e.target.value)} style={inp} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 8px', marginBottom: 4 }}>
                  <div><label style={lbl}>Declaración Precedente</label><input value={local.declaracionPresedente} onChange={e => setF('declaracionPresedente', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Ítem Precedente</label><input type="number" value={local.itemPresedente} onChange={e => setF('itemPresedente', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Sub-régimen Precedente</label><input value={local.subRegimenPresedente} onChange={e => setF('subRegimenPresedente', e.target.value)} style={inp} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px 8px' }}>
                  <div><label style={lbl}>IMEI / Serie</label><input value={local.ime} onChange={e => setF('ime', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Inc/Exe IVA</label><input value={local.incExeIva} onChange={e => setF('incExeIva', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Timbre Fiscal</label><input value={local.timbre} onChange={e => setF('timbre', e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Reg. Cód. Nacional</label><input value={local.regCodNal} onChange={e => setF('regCodNal', e.target.value)} style={inp} /></div>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px 8px', marginBottom: 6 }}>
              <div>
                <label style={lbl}>I2. Valor FOB ítem (USD) *</label>
                <input type="number" value={local.fobItem} onChange={e => setF('fobItem', e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>I1. Valor transacción ítem (USD) *</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" value={local.valorTransaccionItem} onChange={e => setF('valorTransaccionItem', e.target.value)} style={{ ...inp, flex: 1 }} placeholder={local.fobItem || "0"} />
                  <button type="button" title="Calcular proporcional desde FOB (VBA CommandButton3)"
                    onClick={() => {
                      const factura = facturas.find(f => f.nroFactura === local.nroFactura)
                      if (!factura) return
                      const vt = parseFloat(factura.valorTransaccion) || 0
                      const fobTot = parseFloat(factura.valorFobTotal) || 0
                      const fobIt = parseFloat(local.fobItem) || 0
                      if (fobTot > 0 && fobIt > 0)
                        setF('valorTransaccionItem', (Math.round(vt * (fobIt / fobTot) * 1000) / 1000).toString())
                    }}
                    style={{ padding: '2px 7px', border: '1px solid #1E6FD9', borderRadius: 2, background: '#EFF6FF', color: '#1E6FD9', cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Calc.
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>I3. Valor FOB unitario (USD)</label>
                <input value={fobUnitario} readOnly style={ro} />
              </div>
            </div>
            <div>
              <label style={lbl}>J1. Observaciones del ítem</label>
              <textarea value={local.observaciones} onChange={e => setF('observaciones', e.target.value)}
                style={{ ...inp, height: 38, resize: 'vertical' }} />
            </div>
          </div>

          {/* Tributos en tiempo real */}
          <div style={{ background: '#0F2B5B', color: '#fff', borderRadius: 4, padding: '7px 12px', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, alignItems: 'center' }}>
            <span style={{ color: '#93C5FD', fontSize: 10 }}>TC Bs {tc.toFixed(2)}/USD</span>
            <span>CIF: <strong>${fmt2(t.cif)}</strong></span>
            <span>GA: Bs {fmt2(t.gaBs)}</span>
            <span>ICE: Bs {fmt2(t.iceBs)}</span>
            <span>IVA: Bs {fmt2(t.ivaBs)}</span>
            <span style={{ fontWeight: 700, color: '#4ADE80', fontSize: 13, marginLeft: 'auto' }}>TOTAL: Bs {fmt2(t.totalBs)}</span>
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid #bbb', background: '#e8e8e8', justifyContent: 'center', borderRadius: '0 0 3px 3px' }}>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }}
            style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Cerrar</button>
          <button type="button" onClick={saveAndContinue}
            style={{ padding: '4px 14px', border: '1px solid #0A5C2B', borderRadius: 2, background: '#217346', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Grabar y continuar</button>
          <button type="button" onClick={addNewItem}
            style={{ padding: '4px 14px', border: '1px solid #1E6FD9', borderRadius: 2, background: '#EFF6FF', color: '#1E6FD9', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Nuevo ítem</button>
          <button type="button" onClick={copyItem}
            style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Copiar ítem</button>
          <button type="button" onClick={deleteItem}
            style={{ padding: '4px 14px', border: '1px solid #c00', borderRadius: 2, background: '#fff0f0', color: '#c00', cursor: 'pointer', fontSize: 12 }}>Borrar ítem</button>
        </div>
      </div>
    </div>
  )
}

// ── Jspreadsheet items grid ───────────────────────────────────────────────────

/* ── DescMin Grid (grilla Excel paso 5) ─────────────────────────────────── */

const DM_FIXED = 4 // #, NANDINA, Descripcion, TipoMerc (readonly)

function DescMinGrid({ items, setItems }: {
  items: ItemForm[]
  setItems: (fn: (prev: ItemForm[]) => ItemForm[]) => void
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<jspreadsheet.WorksheetInstance | null>(null)
  const fromJss = useRef(false)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const setItemsRef = useRef(setItems)
  setItemsRef.current = setItems
  const [propagMsg, setPropagMsg] = useState<string | null>(null)

  function toRow(item: ItemForm, idx: number): string[] {
    return [
      String(idx + 1),
      item.nandina || '',
      item.nandinaDesc || '',
      item.tipoMercancia || '',
      ...DM_ALL_KEYS.map(k => String(item.descMinima?.[k] ?? ''))
    ]
  }

  function fromGrid(): ItemForm[] {
    const raw = (sheetRef.current?.getData() ?? []) as string[][]
    return raw.map((row, y) => {
      const existing = itemsRef.current[y]
      if (!existing) return existing as ItemForm
      const dm: Record<string, string> = { ...(existing.descMinima ?? {}) }
      DM_ALL_KEYS.forEach((k, i) => {
        const v = String(row[DM_FIXED + i] ?? '').trim()
        if (v) dm[k] = v; else delete dm[k]
      })
      return { ...existing, descMinima: dm }
    })
  }

  function propagarPorNandina() {
    if (sheetRef.current) {
      const ws = sheetRef.current as any
      if (ws.edition) ws.closeEditor(ws.edition[0], true)
    }
    const current = fromGrid()
    const groups: Record<string, number[]> = {}
    current.forEach((item, idx) => {
      if (!item) return
      const key = (item.nandina ?? '').trim() || '__empty__'
      if (!groups[key]) groups[key] = []
      groups[key].push(idx)
    })
    let affected = 0
    const newItems = [...current]
    Object.entries(groups).forEach(([nan, indices]) => {
      if (nan === '__empty__' || indices.length < 2) return
      const sourceIdx = indices.find(i => {
        const dm = newItems[i]?.descMinima ?? {}
        return Object.values(dm).some(v => String(v ?? '').trim())
      })
      if (sourceIdx === undefined) return
      const sourceDM = newItems[sourceIdx]?.descMinima ?? {}
      indices.forEach(idx => {
        if (idx === sourceIdx) return
        newItems[idx] = { ...newItems[idx], descMinima: { ...sourceDM } }
        affected++
      })
    })
    if (affected > 0) {
      fromJss.current = true
      setItemsRef.current(() => newItems)
      if (sheetRef.current) sheetRef.current.setData(newItems.map((it, i) => toRow(it, i)))
      setPropagMsg(`${affected} item(s) actualizados`)
    } else {
      setPropagMsg('Sin cambios: rellena al menos un campo de desc. minima primero')
    }
    setTimeout(() => setPropagMsg(null), 3500)
  }

  useEffect(() => {
    if (!divRef.current) return
    const el = divRef.current
    const realItems = items.filter(i => (i.nandina ?? '').trim())
    const initData = realItems.length > 0
      ? realItems.map((it, i) => toRow(it, i))
      : [Array(DM_FIXED + DM_ALL_KEYS.length).fill('')]

    const sheets = jspreadsheet(el, {
      onchange: () => { fromJss.current = true; setItemsRef.current(() => fromGrid()) },
      onblur: (instance: jspreadsheet.WorksheetInstance) => {
        if (instance.edition) instance.closeEditor(instance.edition[0], true)
      },
      worksheets: [{
        data: initData,
        columns: [
          { title: '#', type: 'numeric', width: 34, readOnly: true },
          { title: 'NANDINA', type: 'text', width: 110, readOnly: true },
          { title: 'Descripción', type: 'text', width: 220, readOnly: true },
          { title: 'Tipo Merc.', type: 'text', width: 95, readOnly: true },
          ...DM_ALL_COLS.map(c => ({ title: c.label, type: 'text' as const, width: 105 })),
        ],
        minDimensions: [DM_FIXED + DM_ALL_KEYS.length, Math.max(realItems.length, 3)] as [number, number],
        columnResize: true,
        allowInsertRow: false,
        allowDeleteRow: false,
        allowManualInsertRow: false,
        allowManualInsertColumn: false,
      }],
    })
    sheetRef.current = sheets[0]
    fromJss.current = true // evita que el sync sobreescriba initData con filas vacías
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { jspreadsheet.destroy(el as any) } catch {}
      sheetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fromJss.current) { fromJss.current = false; return }
    if (!sheetRef.current) return
    const nonEmpty = items.filter(i => (i.nandina ?? '').trim())
    const data = nonEmpty.length > 0
      ? nonEmpty.map((it, i) => toRow(it, i))
      : [Array(DM_FIXED + DM_ALL_KEYS.length).fill('')]
    sheetRef.current.setData(data)
  }, [items])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <p className="text-xs text-[#94A3B8]">
          Columnas grises = referencia. Completa los campos hacia la derecha. Tab/Enter=navegar · Ctrl+C/V=copiar · arrastra esquina para rellenar.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {propagMsg && (
            <span className={`text-xs px-2 py-1 rounded ${propagMsg.startsWith('Sin') ? 'text-amber-600 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
              {propagMsg}
            </span>
          )}
          <button type="button" onClick={propagarPorNandina}
            className="text-xs px-3 py-1.5 rounded border border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#EFF6FF] font-medium whitespace-nowrap">
            Propagar por NANDINA
          </button>
        </div>
      </div>
      <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 4 }}>
        <div ref={divRef} style={{ minWidth: 'max-content' }} />
      </div>
    </div>
  )
}

const ITEM_KEYS: (keyof ItemForm)[] = [
  'nroFactura', 'nandina', 'nandinaDesc', 'umFisica',
  'cantFisica', 'precioUnit', 'paisOrigen', 'pesoNeto', 'fobItem',
  'ga_pct', 'ice_pct'
]

// Todos los campos posibles de descMinima (union de todos los tipoMercancia)
const DM_ALL_COLS: { key: string; label: string }[] = (() => {
  const seen = new Set<string>()
  const out: { key: string; label: string }[] = []
  for (const fields of Object.values(DESC_MIN_SCHEMA)) {
    for (const f of fields as DescMinField[]) {
      if (!seen.has(f.nombreCorto)) {
        seen.add(f.nombreCorto)
        out.push({
          key: f.nombreCorto,
          label: f.nombre.replace(/\(\*\)/g, '').replace(/\[.*?\]/g, '').trim()
        })
      }
    }
  }
  return out
})()
const DM_ALL_KEYS = DM_ALL_COLS.map(c => c.key)

function ItemsGrid({ items, setItems, facturas, fobTotal, fleteTotal, segTotal, tc = 6.97, showRitex = false }:
  {
    items: ItemForm[]
    setItems: (fn: (prev: ItemForm[]) => ItemForm[]) => void
    facturas: FacturaForm[]
    fobTotal: number; fleteTotal: number; segTotal: number
    tc?: number; showRitex?: boolean
  }) {
  const divRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<jspreadsheet.WorksheetInstance | null>(null)
  const fromJss = useRef(false)
  const autoFilling = useRef(false)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const setItemsRef = useRef(setItems)
  setItemsRef.current = setItems
  const [modalIdx, setModalIdx] = useState<number | null>(null)

  const UM = ['NMB', 'KGM', 'LTR', 'MTR', 'M2', 'M3', 'PAR', 'GRM', 'TON', 'SET', 'JGO', 'ROL', 'CAJ', 'BLS']
  const PAIS_SOURCE = PAISES.map(p => ({ id: p.cod, name: `${p.cod} - ${p.desc}` }))

  function toRow(it: ItemForm): string[] {
    return ITEM_KEYS.map(k => String(it[k] ?? ''))
  }

  function fromGrid(): ItemForm[] {
    const raw = (sheetRef.current?.getData() ?? []) as string[][]
    return raw.map((row, y) => {
      const existing = itemsRef.current[y]
      return {
        ...(existing ?? mkItem()),
        id: existing?.id ?? uid(),
        ...Object.fromEntries(ITEM_KEYS.map((k, x) => [k, String(row[x] ?? '')]))
      } as ItemForm
    })
  }

  // Auto-fetch arancel cuando se escribe un codigo NANDINA valido
  async function fetchNandina(code: string, rowIdx: number) {
    try {
      const clean = code.replace(/\D/g, '')
      if (clean.length < 8) return
      const data = await api.get(`/nandina?q=${encodeURIComponent(clean)}`)
      const item = data?.results?.[0]
      if (!item || !sheetRef.current) return
      autoFilling.current = true
      const s = sheetRef.current
      // Solo llenar descripcion si esta vacia
      const descActual = String(s.getValueFromCoords(2, rowIdx) ?? '').trim()
      if (!descActual) s.setValueFromCoords(2, rowIdx, item.descripcion ?? '')
      // Siempre llenar UM, GA%, ICE%
      if (item.unidad_medida) s.setValueFromCoords(3, rowIdx, item.unidad_medida)
      s.setValueFromCoords(9, rowIdx, String(item.ga_porcentaje ?? ''))
      s.setValueFromCoords(10, rowIdx, String(item.ice_especifico ?? ''))
      autoFilling.current = false
      fromJss.current = true
      setItemsRef.current(() => fromGrid())
    } catch { autoFilling.current = false }
  }

  useEffect(() => {
    if (!divRef.current) return
    const el = divRef.current
    const factSrc = facturas.map(f => f.nroFactura).filter(Boolean)
    const realItems = items.filter(i => (i.nandina ?? '').trim() || (i.nroFactura ?? '').trim())
    const initData: string[][] = realItems.length > 0 ? realItems.map(toRow) : [ITEM_KEYS.map(() => '')]

    const sheets = jspreadsheet(el, {
      onchange: (instance, cell, colIndex, rowIndex, newValue) => {
        if (!autoFilling.current) {
          fromJss.current = true
          setItemsRef.current(() => fromGrid())
        }
        // Auto-completar arancel cuando columna NANDINA cambia
        if (!autoFilling.current && Number(colIndex) === 1) {
          const val = String(newValue ?? '').replace(/\D/g, '')
          if (val.length >= 8) fetchNandina(String(newValue ?? ''), Number(rowIndex))
        }
      },
      oninsertrow: () => { fromJss.current = true; setTimeout(() => setItemsRef.current(() => fromGrid()), 0) },
      ondeleterow: () => { fromJss.current = true; setTimeout(() => setItemsRef.current(() => fromGrid()), 0) },
      onblur: (instance: jspreadsheet.WorksheetInstance) => {
        if (instance.edition) instance.closeEditor(instance.edition[0], true)
      },
      worksheets: [{
        data: initData,
        columns: [
          { title: 'Factura', type: factSrc.length > 0 ? 'autocomplete' : 'text', source: factSrc, width: 120 },
          { title: 'NANDINA', type: 'text', width: 115 },
          { title: 'Descripcion Comercial', type: 'text', width: 260 },
          { title: 'UM', type: 'dropdown', source: UM, width: 58 },
          { title: 'Cant.', type: 'numeric', width: 72 },
          { title: 'P.Unit USD', type: 'numeric', width: 92, decimal: '.', mask: '#,##0.0000' },
          { title: 'Pais', type: 'autocomplete', source: PAIS_SOURCE, width: 72 },
          { title: 'KG Neto', type: 'numeric', width: 72 },
          { title: 'FOB Item', type: 'numeric', width: 88, decimal: '.', mask: '#,##0.00' },
          { title: 'GA%', type: 'numeric', width: 48 },
          { title: 'ICE%', type: 'numeric', width: 48 },
        ],
        minDimensions: [11, Math.max(realItems.length, 3)] as [number, number],
        columnResize: true,
        allowInsertRow: true,
        allowDeleteRow: true,
        allowManualInsertRow: true,
        allowManualInsertColumn: false,
        tableOverflow: true,
        tableWidth: '100%',
        tableHeight: '380px',
      }],
    })
    sheetRef.current = sheets[0]
    fromJss.current = true // evita que el sync effect sobreescriba initData con filas vacías
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { jspreadsheet.destroy(el as any) } catch {}
      sheetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync React → jspreadsheet (cambios externos: CSV import, modal, etc.)
  useEffect(() => {
    if (fromJss.current) { fromJss.current = false; return }
    if (!sheetRef.current) return
    sheetRef.current.setData(items.length > 0 ? items.map(toRow) : [ITEM_KEYS.map(() => '')])
  }, [items])

  const totals = useMemo(() => items.reduce((acc, item) => {
    const t = calcTributos(item, fobTotal, fleteTotal, segTotal, tc)
    return { fob: acc.fob + t.fob, cif: acc.cif + t.cif, ga: acc.ga + t.ga, ice: acc.ice + t.ice, iva: acc.iva + t.iva, total: acc.total + t.total, gaBs: acc.gaBs + t.gaBs, iceBs: acc.iceBs + t.iceBs, ivaBs: acc.ivaBs + t.ivaBs, totalBs: acc.totalBs + t.totalBs }
  }, { fob: 0, cif: 0, ga: 0, ice: 0, iva: 0, total: 0, gaBs: 0, iceBs: 0, ivaBs: 0, totalBs: 0 }), [items, fobTotal, fleteTotal, segTotal, tc])

  const sinFactura = items.filter(i => i.nandina && !i.nroFactura).length

  return (
    <div className="flex flex-col gap-2">
      {sinFactura > 0 && (
        <span className="text-xs text-amber-600 font-medium">{sinFactura} item{sinFactura > 1 ? 's' : ''} sin factura</span>
      )}
      <div style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, position: 'relative' }}>
        <div ref={divRef} />
      </div>

      {items.filter(i => i.nandina || i.cantFisica).length > 0 && (
        <div style={{ background: '#0F2B5B', color: '#fff', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          <div style={{ fontSize: 10, color: '#93C5FD', marginRight: 16, whiteSpace: 'nowrap' }}>
            TC: <strong style={{ color: '#fff' }}>Bs {tc.toFixed(2)}</strong>/USD
          </div>
          <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {([['FOB', `$${fmt2(totals.fob)}`], ['CIF', `$${fmt2(totals.cif)}`], ['GA', `Bs ${fmt2(totals.gaBs)}`], ['ICE', `Bs ${fmt2(totals.iceBs)}`], ['IVA', `Bs ${fmt2(totals.ivaBs)}`]] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ fontSize: 10 }}>
                <span style={{ color: '#93C5FD' }}>{label} </span>
                <span style={{ fontFamily: 'monospace' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 16, marginLeft: 8 }}>
            TOTAL A PAGAR
            <span style={{ fontFamily: 'monospace', fontSize: 16, marginLeft: 8, color: '#4ADE80' }}>
              Bs {fmt2(totals.totalBs)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => setItems(is => [...is, mkItem()])}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF] transition-colors">
          <Plus size={14} /> Agregar item
        </button>
        <button type="button" onClick={() => {
          if (items.length === 0) {
            setItems(is => [...is, mkItem()])
            setModalIdx(0)
            return
          }
          const sel = sheetRef.current?.getSelectedRows()
          if (sel && sel.length > 0) setModalIdx(sel[0])
          else setModalIdx(0)
        }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#0D7A3E] border border-[#0D7A3E] rounded-lg hover:bg-[#F0FDF4] transition-colors">
          Editar detalle
        </button>
        <CsvImportButton onImport={rows => {
          const defaultFact = facturas.length === 1 ? facturas[0].nroFactura : (items[items.length - 1]?.nroFactura ?? '')
          setItems(is => [...is, ...rows.map(r => ({ ...mkItem(), ...r, id: uid(), nroFactura: r.nroFactura || defaultFact }))])
        }} />
        <span className="text-xs text-[#94A3B8]">
          Enter=bajar · Tab=derecha · Flechas=navegar · Ctrl+C/V=copiar/pegar · Arrastrar esquina=rellenar · Clic derecho=mas opciones
        </span>
      </div>

      {modalIdx !== null && modalIdx < items.length && (
        <ItemDetailModal
          items={items} modalIdx={modalIdx} setModalIdx={setModalIdx} setItems={setItems}
          facturas={facturas} showRitex={showRitex} tc={tc}
          fobTotal={fobTotal} fleteTotal={fleteTotal} segTotal={segTotal}
        />
      )}
    </div>
  )
}
/* ── Facturas shared component ───────────────────────────────────────────── */

function mkFactura(): FacturaForm {
  return {
    id: uid(), nroFactura: "", fechaFactura: "", proveedorRazonSocial: "",
    proveedorNroDoc: "", proveedorCondicion: "03", especifiqueCondVendedor: "",
    proveedorPaisAdquisicion: "CN",
    incoterm: "FOB", lugarIncoterm: "", especifiqueIncoterm: "",
    naturaleza: "01", especifiqueNaturaleza: "",
    moneda: "USD", valorTransaccion: "", tipoCambio: "1",
    formaPago: "3", especifiqueFormaPago: "",
    medioPago: "3", especifiqueMedioPago: "",
    destinoMercancia: "02", especifiqueDestino: "",
    facturaSujetoDescuento: "NO",
    nivelComercial: "05",
    valorFobTotal: "", valorCifTotal: "0",
    totalPaginas: "1", totalItems: "", totalPesoNeto: "",
    observaciones: ""
  }
}

/* ── Factura Detail Modal ────────────────────────────────────────────────── */

function FacturaDetailModal({ facturas, modalIdx, setModalIdx, setFacturas }: {
  facturas: FacturaForm[]; modalIdx: number
  setModalIdx: (n: number | null) => void
  setFacturas: (fn: (prev: FacturaForm[]) => FacturaForm[]) => void
}) {
  const [local, setLocal] = useState<FacturaForm>({ ...facturas[modalIdx] })
  const setF = (k: keyof FacturaForm, v: string) => setLocal(l => ({ ...l, [k]: v }))

  function commit() { setFacturas(fs => fs.map((f, i) => i === modalIdx ? { ...local } : f)) }
  function goTo(idx: number) {
    setFacturas(fs => fs.map((f, i) => i === modalIdx ? { ...local } : f))
    setLocal({ ...facturas[idx] }); setModalIdx(idx)
  }
  function saveAndNext() { commit(); if (modalIdx < facturas.length - 1) setModalIdx(modalIdx + 1); else setModalIdx(null) }
  function copyFac() {
    const clone = { ...local, id: uid() }
    setFacturas(fs => {
      const saved = fs.map((f, i) => i === modalIdx ? { ...local } : f)
      const n = [...saved]; n.splice(modalIdx + 1, 0, clone); return n
    })
    setLocal({ ...clone }); setModalIdx(modalIdx + 1)
  }
  function deleteFac() {
    setFacturas(fs => fs.filter((_, i) => i !== modalIdx))
    setModalIdx(facturas.length > 1 ? Math.max(0, modalIdx - 1) : null)
  }

  const lbl: React.CSSProperties = { fontSize: 10, color: '#444', display: 'block', marginBottom: 2, fontWeight: 600 }
  const inp: React.CSSProperties = { width: '100%', fontSize: 11, border: '1px solid #aaa', borderRadius: 2, padding: '3px 6px', background: '#fff', height: 22, boxSizing: 'border-box' }
  const sec: React.CSSProperties = { border: '1px solid #ccc', borderRadius: 3, padding: '8px 10px', marginBottom: 8, background: '#fafafa' }
  const secTtl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#333', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const navBtn: React.CSSProperties = { fontSize: 13, padding: '1px 9px', border: '1px solid #999', borderRadius: 2, background: '#f0f0f0', cursor: 'pointer' }
  const total = facturas.length; const current = modalIdx + 1

  const mkSel = (val: string, onChange: (v: string) => void, list: CatItem[]) => (
    <select value={val} onChange={e => onChange(e.target.value)} style={inp}>
      <option value="">— sel —</option>
      {list.map(it => <option key={it.cod} value={it.cod}>{it.cod} - {it.desc}</option>)}
    </select>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) { commit(); setModalIdx(null) } }}>
      <div style={{ background: '#f2f2f2', border: '1px solid #666', borderRadius: 4, width: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 20px rgba(0,0,0,0.35)', fontSize: 11 }}>
        <div style={{ background: '#0F2B5B', color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '3px 3px 0 0' }}>
          <span>DAM - Datos de la Factura</span>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '5px 12px', background: '#e0e0e0', borderBottom: '1px solid #bbb', alignItems: 'center' }}>
          <button type="button" onClick={() => goTo(0)} disabled={modalIdx === 0} style={navBtn}>«</button>
          <button type="button" onClick={() => goTo(modalIdx - 1)} disabled={modalIdx === 0} style={navBtn}>‹</button>
          <span style={{ fontSize: 11, padding: '1px 10px', border: '1px solid #999', background: '#fff', borderRadius: 2, minWidth: 34, textAlign: 'center', display: 'inline-block' }}>{current}</span>
          <button type="button" onClick={() => goTo(modalIdx + 1)} disabled={modalIdx >= total - 1} style={navBtn}>›</button>
          <button type="button" onClick={() => goTo(total - 1)} disabled={modalIdx >= total - 1} style={navBtn}>»</button>
          <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>Factura {current} de {total}</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px' }}>

          {/* Bloque 1: Identificacion */}
          <div style={sec}>
            <div style={secTtl}>Identificación</div>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 130px 1fr', gap: '5px 8px', marginBottom: 6 }}>
              <div><label style={lbl}>N. Factura *</label><input value={local.nroFactura} onChange={e => setF('nroFactura', e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} /></div>
              <div><label style={lbl}>Fecha Factura *</label><input type="date" value={local.fechaFactura} onChange={e => setF('fechaFactura', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Razón Social Proveedor *</label><input value={local.proveedorRazonSocial} onChange={e => setF('proveedorRazonSocial', e.target.value)} style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px 8px' }}>
              <div>
                <label style={lbl}>Condición Vendedor</label>
                {mkSel(local.proveedorCondicion, v => { setF('proveedorCondicion', v); if (v !== '04') setF('especifiqueCondVendedor', '') }, CONDICION_VENDEDOR)}
              </div>
              {local.proveedorCondicion === '04' && (
                <div className="col-span-2"><label style={lbl}>Especifique condición vendedor *</label><input value={local.especifiqueCondVendedor} onChange={e => setF('especifiqueCondVendedor', e.target.value)} style={inp} /></div>
              )}
              <div><label style={lbl}>País Adquisición</label>{mkSel(local.proveedorPaisAdquisicion, v => setF('proveedorPaisAdquisicion', v), PAISES)}</div>
              <div><label style={lbl}>N. Documento Proveedor</label><input value={local.proveedorNroDoc} onChange={e => setF('proveedorNroDoc', e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} /></div>
            </div>
          </div>

          {/* Bloque 2: Condiciones de Entrega */}
          <div style={sec}>
            <div style={secTtl}>Condiciones de Entrega</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 8px' }}>
              <div><label style={lbl}>Incoterms *</label>{mkSel(local.incoterm, v => { setF('incoterm', v); if (v !== 'OTR') setF('especifiqueIncoterm', '') }, INCOTERMS)}</div>
              <div><label style={lbl}>Lugar Incoterms</label><input value={local.lugarIncoterm} onChange={e => setF('lugarIncoterm', e.target.value)} style={inp} /></div>
              {local.incoterm === 'OTR' && <div><label style={lbl}>Especifique incoterm *</label><input value={local.especifiqueIncoterm} onChange={e => setF('especifiqueIncoterm', e.target.value)} style={inp} /></div>}
              <div><label style={lbl}>Naturaleza Transacción</label>{mkSel(local.naturaleza, v => { setF('naturaleza', v); if (v !== '22') setF('especifiqueNaturaleza', '') }, NATURALEZA_TRANSACCION)}</div>
              {local.naturaleza === '22' && <div><label style={lbl}>Especifique naturaleza *</label><input value={local.especifiqueNaturaleza} onChange={e => setF('especifiqueNaturaleza', e.target.value)} style={inp} /></div>}
              <div><label style={lbl}>Destino Mercancía</label>{mkSel(local.destinoMercancia, v => { setF('destinoMercancia', v); if (v !== '04') setF('especifiqueDestino', '') }, DESTINO_MERCANCIA)}</div>
              {local.destinoMercancia === '04' && <div><label style={lbl}>Especifique destino *</label><input value={local.especifiqueDestino} onChange={e => setF('especifiqueDestino', e.target.value)} style={inp} /></div>}
              <div><label style={lbl}>Nivel Comercial</label>{mkSel(local.nivelComercial, v => setF('nivelComercial', v), NIVEL_COMERCIAL)}</div>
            </div>
          </div>

          {/* Bloque 3: Valores */}
          <div style={sec}>
            <div style={secTtl}>Valores</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '5px 8px', alignItems: 'end' }}>
              <div><label style={lbl}>Moneda *</label>{mkSel(local.moneda, v => { setF('moneda', v); if (v === 'USD') setF('tipoCambio', '1') }, MONEDAS)}</div>
              <div><label style={lbl}>Valor Transacción *</label><input type="number" value={local.valorTransaccion} onChange={e => setF('valorTransaccion', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Tipo de Cambio</label><input type="number" value={local.tipoCambio} onChange={e => setF('tipoCambio', e.target.value)} style={{ ...inp, opacity: local.moneda === 'USD' ? 0.5 : 1 }} /></div>
              <div><label style={lbl}>FOB Total USD *</label><input type="number" value={local.valorFobTotal} onChange={e => setF('valorFobTotal', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>CIF Total USD</label><input type="number" value={local.valorCifTotal} onChange={e => setF('valorCifTotal', e.target.value)} style={inp} /></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={lbl}>Sujeto descuento</label>
                <div style={{ display: 'flex', gap: 10, height: 22, alignItems: 'center' }}>
                  {['SI', 'NO'].map(v => (
                    <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11 }}>
                      <input type="radio" name={`fsd-modal-${modalIdx}`} value={v} checked={local.facturaSujetoDescuento === v} onChange={() => setF('facturaSujetoDescuento', v)} /> {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 4: Pago */}
          <div style={sec}>
            <div style={secTtl}>Forma y Medio de Pago</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px 8px' }}>
              <div><label style={lbl}>Forma Pago</label>{mkSel(local.formaPago, v => { setF('formaPago', v); if (v !== '4' && v !== '6') setF('especifiqueFormaPago', '') }, FORMAS_PAGO)}</div>
              {(local.formaPago === '4' || local.formaPago === '6') && <div><label style={lbl}>Especifique forma pago *</label><input value={local.especifiqueFormaPago} onChange={e => setF('especifiqueFormaPago', e.target.value)} style={inp} /></div>}
              <div><label style={lbl}>Medio Pago</label>{mkSel(local.medioPago, v => { setF('medioPago', v); if (v !== '7') setF('especifiqueMedioPago', '') }, MEDIOS_PAGO)}</div>
              {local.medioPago === '7' && <div><label style={lbl}>Especifique medio pago *</label><input value={local.especifiqueMedioPago} onChange={e => setF('especifiqueMedioPago', e.target.value)} style={inp} /></div>}
            </div>
          </div>

          {/* Bloque 5: Totales de control */}
          <div style={sec}>
            <div style={secTtl}>Totales de Control</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '5px 8px' }}>
              <div><label style={lbl}>Total Páginas *</label><input type="number" value={local.totalPaginas} onChange={e => setF('totalPaginas', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Total Ítems</label><input type="number" value={local.totalItems} onChange={e => setF('totalItems', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Peso Neto (kg)</label><input type="number" value={local.totalPesoNeto} onChange={e => setF('totalPesoNeto', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Observaciones</label><input value={local.observaciones} onChange={e => setF('observaciones', e.target.value)} style={inp} /></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid #bbb', background: '#e8e8e8', justifyContent: 'center', borderRadius: '0 0 3px 3px' }}>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Cerrar</button>
          <button type="button" onClick={saveAndNext} style={{ padding: '4px 14px', border: '1px solid #0A5C2B', borderRadius: 2, background: '#217346', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Grabar y continuar</button>
          <button type="button" onClick={copyFac} style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Copiar factura</button>
          <button type="button" onClick={deleteFac} style={{ padding: '4px 14px', border: '1px solid #c00', borderRadius: 2, background: '#fff0f0', color: '#c00', cursor: 'pointer', fontSize: 12 }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

/* ── Facturas Grid (Excel-style) ─────────────────────────────────────────── */

const FAC_KEYS: (keyof FacturaForm)[] = [
  'nroFactura', 'fechaFactura', 'proveedorRazonSocial', 'proveedorPaisAdquisicion',
  'incoterm', 'lugarIncoterm', 'naturaleza', 'moneda',
  'valorTransaccion', 'tipoCambio', 'valorFobTotal', 'valorCifTotal',
  'formaPago', 'medioPago', 'totalPaginas', 'facturaSujetoDescuento'
]

function FacturasSection({ facturas, setFacturas }:
  { facturas: FacturaForm[]; setFacturas: (fn: (p: FacturaForm[]) => FacturaForm[]) => void }) {
  const divRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<jspreadsheet.WorksheetInstance | null>(null)
  const fromJss = useRef(false)
  const facsRef = useRef(facturas)
  facsRef.current = facturas
  const setFacsRef = useRef(setFacturas)
  setFacsRef.current = setFacturas
  const [modalIdx, setModalIdx] = useState<number | null>(null)

  const PAISES_SRC = PAISES.map(p => ({ id: p.cod, name: `${p.cod} - ${p.desc}` }))
  const INCO_SRC = INCOTERMS.map(i => i.cod)
  const NAT_SRC = NATURALEZA_TRANSACCION.map(i => i.cod)
  const MON_SRC = MONEDAS.map(m => m.cod)
  const FP_SRC = FORMAS_PAGO.map(f => f.cod)
  const MP_SRC = MEDIOS_PAGO.map(m => m.cod)

  function toRow(f: FacturaForm): string[] { return FAC_KEYS.map(k => String(f[k] ?? '')) }

  function fromGrid(): FacturaForm[] {
    const raw = (sheetRef.current?.getData() ?? []) as string[][]
    return raw.map((row, y) => {
      const existing = facsRef.current[y]
      return {
        ...(existing ?? mkFactura()),
        id: existing?.id ?? uid(),
        ...Object.fromEntries(FAC_KEYS.map((k, x) => [k, String(row[x] ?? '')]))
      } as FacturaForm
    })
  }

  useEffect(() => {
    if (!divRef.current) return
    const el = divRef.current
    const initData = facturas.length > 0 ? facturas.map(toRow) : [FAC_KEYS.map(() => '')]

    const sheets = jspreadsheet(el, {
      onchange: () => { fromJss.current = true; setFacsRef.current(() => fromGrid()) },
      oninsertrow: () => { fromJss.current = true; setTimeout(() => setFacsRef.current(() => fromGrid()), 0) },
      ondeleterow: () => { fromJss.current = true; setTimeout(() => setFacsRef.current(() => fromGrid()), 0) },
      onblur: (instance: jspreadsheet.WorksheetInstance) => {
        if (instance.edition) instance.closeEditor(instance.edition[0], true)
      },
      worksheets: [{
        data: initData,
        columns: [
          { title: 'N. Factura *', type: 'text', width: 110 },
          { title: 'Fecha', type: 'calendar', width: 100, options: { format: 'YYYY-MM-DD' } },
          { title: 'Razón Social Proveedor *', type: 'text', width: 240 },
          { title: 'País Adq.', type: 'autocomplete', source: PAISES_SRC, width: 75 },
          { title: 'Incoterm', type: 'dropdown', source: INCO_SRC, width: 70 },
          { title: 'Lugar Incoterm', type: 'text', width: 130 },
          { title: 'Naturaleza', type: 'dropdown', source: NAT_SRC, width: 70 },
          { title: 'Moneda', type: 'dropdown', source: MON_SRC, width: 65 },
          { title: 'Valor Trans.', type: 'numeric', width: 95, decimal: '.', mask: '#,##0.00' },
          { title: 'TC', type: 'numeric', width: 55, decimal: '.' },
          { title: 'FOB Total', type: 'numeric', width: 95, decimal: '.', mask: '#,##0.00' },
          { title: 'CIF Total', type: 'numeric', width: 95, decimal: '.', mask: '#,##0.00' },
          { title: 'F.Pago', type: 'dropdown', source: FP_SRC, width: 60 },
          { title: 'M.Pago', type: 'dropdown', source: MP_SRC, width: 60 },
          { title: 'Pags.', type: 'numeric', width: 50 },
          { title: 'Desc.', type: 'dropdown', source: ['SI', 'NO'], width: 55 },
        ],
        minDimensions: [16, Math.max(facturas.length, 3)] as [number, number],
        columnResize: true,
        allowInsertRow: true,
        allowDeleteRow: true,
        allowManualInsertRow: true,
        allowManualInsertColumn: false,
        tableOverflow: true,
        tableWidth: '100%',
        tableHeight: `${Math.max(facturas.length + 2, 5) * 24 + 26}px`,
      }],
    })
    sheetRef.current = sheets[0]
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { jspreadsheet.destroy(el as any) } catch {}
      sheetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fromJss.current) { fromJss.current = false; return }
    if (!sheetRef.current) return
    sheetRef.current.setData(facturas.length > 0 ? facturas.map(toRow) : [FAC_KEYS.map(() => '')])
  }, [facturas])

  return (
    <div className="flex flex-col gap-2">
      <div style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, position: 'relative' }}>
        <div ref={divRef} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <button type="button" onClick={() => setFacturas(fs => [...fs, mkFactura()])}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF] transition-colors">
          <Plus size={14} /> Agregar factura
        </button>
        <button type="button" onClick={() => {
          const sel = sheetRef.current?.getSelectedRows()
          if (sel && sel.length > 0) setModalIdx(sel[0])
          else if (facturas.length > 0) setModalIdx(0)
        }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#0D7A3E] border border-[#0D7A3E] rounded-lg hover:bg-[#F0FDF4] transition-colors">
          Editar detalle / campos condicionales
        </button>
        <span className="text-xs text-[#94A3B8]">Enter=bajar · Tab=derecha · Ctrl+C/V=copiar/pegar · Clic derecho=más opciones</span>
      </div>
      {modalIdx !== null && modalIdx < facturas.length && (
        <FacturaDetailModal facturas={facturas} modalIdx={modalIdx} setModalIdx={setModalIdx} setFacturas={setFacturas} />
      )}
    </div>
  )
}

/* ── Proveedor Detail Modal ──────────────────────────────────────────────── */

function ProveedorDetailModal({ proveedores, modalIdx, setModalIdx, setProveedores }: {
  proveedores: ProveedorForm[]; modalIdx: number
  setModalIdx: (n: number | null) => void
  setProveedores: (fn: (prev: ProveedorForm[]) => ProveedorForm[]) => void
}) {
  const [local, setLocal] = useState<ProveedorForm>({ ...proveedores[modalIdx] })
  const setF = (k: keyof ProveedorForm, v: string) => setLocal(l => ({ ...l, [k]: v }))

  function commit() { setProveedores(ps => ps.map((p, i) => i === modalIdx ? { ...local } : p)) }
  function goTo(idx: number) {
    setProveedores(ps => ps.map((p, i) => i === modalIdx ? { ...local } : p))
    setLocal({ ...proveedores[idx] }); setModalIdx(idx)
  }
  function copyProv() {
    const clone = { ...local, id: uid() }
    setProveedores(ps => {
      const saved = ps.map((p, i) => i === modalIdx ? { ...local } : p)
      const n = [...saved]; n.splice(modalIdx + 1, 0, clone); return n
    })
    setLocal({ ...clone }); setModalIdx(modalIdx + 1)
  }
  function deleteProv() {
    setProveedores(ps => ps.filter((_, i) => i !== modalIdx))
    setModalIdx(proveedores.length > 1 ? Math.max(0, modalIdx - 1) : null)
  }

  const cityOpts = PUERTOS.filter(pt => pt.cod.startsWith(local.paisCod))
  const lbl: React.CSSProperties = { fontSize: 10, color: '#444', display: 'block', marginBottom: 2, fontWeight: 600 }
  const inp: React.CSSProperties = { width: '100%', fontSize: 11, border: '1px solid #aaa', borderRadius: 2, padding: '3px 6px', background: '#fff', height: 22, boxSizing: 'border-box' }
  const sec: React.CSSProperties = { border: '1px solid #ccc', borderRadius: 3, padding: '8px 10px', marginBottom: 8, background: '#fafafa' }
  const secTtl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#333', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const navBtn: React.CSSProperties = { fontSize: 13, padding: '1px 9px', border: '1px solid #999', borderRadius: 2, background: '#f0f0f0', cursor: 'pointer' }
  const total = proveedores.length; const current = modalIdx + 1

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) { commit(); setModalIdx(null) } }}>
      <div style={{ background: '#f2f2f2', border: '1px solid #666', borderRadius: 4, width: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '4px 4px 20px rgba(0,0,0,0.35)', fontSize: 11 }}>
        <div style={{ background: '#0F2B5B', color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '3px 3px 0 0' }}>
          <span>DAM - Datos del Proveedor</span>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '5px 12px', background: '#e0e0e0', borderBottom: '1px solid #bbb', alignItems: 'center' }}>
          <button type="button" onClick={() => goTo(0)} disabled={modalIdx === 0} style={navBtn}>«</button>
          <button type="button" onClick={() => goTo(modalIdx - 1)} disabled={modalIdx === 0} style={navBtn}>‹</button>
          <span style={{ fontSize: 11, padding: '1px 10px', border: '1px solid #999', background: '#fff', borderRadius: 2, minWidth: 34, textAlign: 'center', display: 'inline-block' }}>{current}</span>
          <button type="button" onClick={() => goTo(modalIdx + 1)} disabled={modalIdx >= total - 1} style={navBtn}>›</button>
          <button type="button" onClick={() => goTo(total - 1)} disabled={modalIdx >= total - 1} style={navBtn}>»</button>
          <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>Proveedor {current} de {total}</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '10px 14px' }}>
          <div style={sec}>
            <div style={secTtl}>Identificación</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 140px', gap: '5px 8px' }}>
              <div><label style={lbl}>Razón Social *</label><input value={local.razonSocial} onChange={e => setF('razonSocial', e.target.value)} style={inp} /></div>
              <div>
                <label style={lbl}>Tipo Documento</label>
                <select value={local.tipoDoc} onChange={e => setF('tipoDoc', e.target.value)} style={inp}>
                  <option value="">— sel —</option>
                  {TIPO_DOCUMENTO.map(t => <option key={t.cod} value={t.cod}>{t.cod} - {t.desc}</option>)}
                </select>
              </div>
              <div><label style={lbl}>N. Documento</label><input value={local.nroDoc} onChange={e => setF('nroDoc', e.target.value)} style={{ ...inp, fontFamily: 'monospace' }} /></div>
            </div>
          </div>
          <div style={sec}>
            <div style={secTtl}>Domicilio</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px', gap: '5px 8px', marginBottom: 6 }}>
              <div><label style={lbl}>Calle/Avenida *</label><input value={local.calleAvenida} onChange={e => setF('calleAvenida', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Número</label><input value={local.numero} onChange={e => setF('numero', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Barrio/Zona</label><input value={local.barrioZona} onChange={e => setF('barrioZona', e.target.value)} style={inp} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
              <div>
                <label style={lbl}>País *</label>
                <select value={local.paisCod} onChange={e => { setF('paisCod', e.target.value); setF('ciudadCod', '') }} style={inp}>
                  {PAISES.map(p => <option key={p.cod} value={p.cod}>{p.cod} - {p.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Ciudad / Localidad *</label>
                <select value={local.ciudadCod} onChange={e => setF('ciudadCod', e.target.value)} style={inp}>
                  <option value="">— seleccione —</option>
                  {cityOpts.map(c => <option key={c.cod} value={c.cod}>{c.cod} - {c.desc}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={sec}>
            <div style={secTtl}>Contacto</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
              <div><label style={lbl}>Teléfono/Fax *</label><input value={local.telefonoFax} onChange={e => setF('telefonoFax', e.target.value)} style={inp} /></div>
              <div>
                <label style={lbl}>Email *</label>
                <input value={local.email} onChange={e => setF('email', e.target.value)} style={{ ...inp, borderColor: local.email && !validaEmail(local.email) ? '#c00' : '#aaa' }} />
                {local.email && !validaEmail(local.email) && <span style={{ fontSize: 10, color: '#c00' }}>Email inválido</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px', borderTop: '1px solid #bbb', background: '#e8e8e8', justifyContent: 'center', borderRadius: '0 0 3px 3px' }}>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Cerrar</button>
          <button type="button" onClick={() => { commit(); setModalIdx(null) }} style={{ padding: '4px 14px', border: '1px solid #0A5C2B', borderRadius: 2, background: '#217346', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Guardar</button>
          <button type="button" onClick={copyProv} style={{ padding: '4px 14px', border: '1px solid #999', borderRadius: 2, background: '#f5f5f5', cursor: 'pointer', fontSize: 12 }}>Copiar proveedor</button>
          <button type="button" onClick={deleteProv} style={{ padding: '4px 14px', border: '1px solid #c00', borderRadius: 2, background: '#fff0f0', color: '#c00', cursor: 'pointer', fontSize: 12 }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

/* ── Proveedor Grid (Excel-style) ────────────────────────────────────────── */

const PROV_KEYS: (keyof ProveedorForm)[] = [
  'razonSocial', 'tipoDoc', 'nroDoc', 'calleAvenida',
  'numero', 'barrioZona', 'paisCod', 'ciudadCod', 'telefonoFax', 'email'
]

function ProveedoresSection({ proveedores, setProveedores }:
  { proveedores: ProveedorForm[]; setProveedores: (fn: (p: ProveedorForm[]) => ProveedorForm[]) => void }) {
  const divRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<jspreadsheet.WorksheetInstance | null>(null)
  const fromJss = useRef(false)
  const provsRef = useRef(proveedores)
  provsRef.current = proveedores
  const setProvsRef = useRef(setProveedores)
  setProvsRef.current = setProveedores
  const [modalIdx, setModalIdx] = useState<number | null>(null)

  const PAISES_SRC = PAISES.map(p => ({ id: p.cod, name: `${p.cod} - ${p.desc}` }))
  const TDOC_SRC = TIPO_DOCUMENTO.map(t => t.cod)

  function toRow(p: ProveedorForm): string[] { return PROV_KEYS.map(k => String(p[k] ?? '')) }

  function fromGrid(): ProveedorForm[] {
    const raw = (sheetRef.current?.getData() ?? []) as string[][]
    return raw.map((row, y) => {
      const existing = provsRef.current[y]
      return {
        ...(existing ?? mkProv()),
        id: existing?.id ?? uid(),
        ...Object.fromEntries(PROV_KEYS.map((k, x) => [k, String(row[x] ?? '')]))
      } as ProveedorForm
    })
  }

  useEffect(() => {
    if (!divRef.current) return
    const el = divRef.current
    const initData = proveedores.length > 0 ? proveedores.map(toRow) : [PROV_KEYS.map(() => '')]

    const sheets = jspreadsheet(el, {
      onchange: () => { fromJss.current = true; setProvsRef.current(() => fromGrid()) },
      oninsertrow: () => { fromJss.current = true; setTimeout(() => setProvsRef.current(() => fromGrid()), 0) },
      ondeleterow: () => { fromJss.current = true; setTimeout(() => setProvsRef.current(() => fromGrid()), 0) },
      onblur: (instance: jspreadsheet.WorksheetInstance) => {
        if (instance.edition) instance.closeEditor(instance.edition[0], true)
      },
      worksheets: [{
        data: initData,
        columns: [
          { title: 'Razón Social *', type: 'text', width: 230 },
          { title: 'Tipo Doc', type: 'dropdown', source: TDOC_SRC, width: 80 },
          { title: 'N. Documento', type: 'text', width: 130 },
          { title: 'Calle/Avenida', type: 'text', width: 200 },
          { title: 'Número', type: 'text', width: 65 },
          { title: 'Barrio/Zona', type: 'text', width: 110 },
          { title: 'País', type: 'autocomplete', source: PAISES_SRC, width: 80 },
          { title: 'Ciudad', type: 'text', width: 110 },
          { title: 'Teléfono/Fax', type: 'text', width: 130 },
          { title: 'Email', type: 'text', width: 190 },
        ],
        minDimensions: [10, Math.max(proveedores.length, 3)] as [number, number],
        columnResize: true,
        allowInsertRow: true,
        allowDeleteRow: true,
        allowManualInsertRow: true,
        allowManualInsertColumn: false,
        tableOverflow: true,
        tableWidth: '100%',
        tableHeight: `${Math.max(proveedores.length + 2, 5) * 24 + 26}px`,
      }],
    })
    sheetRef.current = sheets[0]
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { jspreadsheet.destroy(el as any) } catch {}
      sheetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fromJss.current) { fromJss.current = false; return }
    if (!sheetRef.current) return
    sheetRef.current.setData(proveedores.length > 0 ? proveedores.map(toRow) : [PROV_KEYS.map(() => '')])
  }, [proveedores])

  return (
    <div className="flex flex-col gap-2">
      <div style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, position: 'relative' }}>
        <div ref={divRef} />
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <button type="button" onClick={() => setProveedores(ps => [...ps, mkProv()])}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF] transition-colors">
          <Plus size={14} /> Agregar proveedor
        </button>
        <button type="button" onClick={() => {
          const sel = sheetRef.current?.getSelectedRows()
          if (sel && sel.length > 0) setModalIdx(sel[0])
          else if (proveedores.length > 0) setModalIdx(0)
        }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#0D7A3E] border border-[#0D7A3E] rounded-lg hover:bg-[#F0FDF4] transition-colors">
          Editar detalle
        </button>
        <span className="text-xs text-[#94A3B8]">Enter=bajar · Tab=derecha · Ctrl+C/V=copiar/pegar · Clic derecho=más opciones</span>
      </div>
      {modalIdx !== null && modalIdx < proveedores.length && (
        <ProveedorDetailModal proveedores={proveedores} modalIdx={modalIdx} setModalIdx={setModalIdx} setProveedores={setProveedores} />
      )}
    </div>
  )
}


function mkProv(): ProveedorForm {
  return { id: uid(), razonSocial: "", tipoDoc: "", nroDoc: "", calleAvenida: "", numero: "", barrioZona: "", paisCod: "CN", ciudadCod: "", telefonoFax: "", email: "" }
}


/* ── Docs Embarque ───────────────────────────────────────────────────────── */

function mkDoc(): DocEmbarqueForm {
  return { id: uid(), tipoDoc: "TR-002", nroDoc: "", fechaEmbarque: "", lugarEmbarqueCod: "CNNGB", paisEmbarqueCod: "CN", provieneZonaFranca: "2" }
}

function DocsEmbarqueSection({ docs, setDocs }:
  { docs: DocEmbarqueForm[]; setDocs: (fn: (p: DocEmbarqueForm[]) => DocEmbarqueForm[]) => void }) {
  function setField(id: string, k: keyof DocEmbarqueForm, v: string) {
    setDocs(ds => ds.map(d => d.id === id ? { ...d, [k]: v } : d))
  }
  return (
    <div className="space-y-3">
      {docs.map((d, idx) => (
        <div key={d.id} className="border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#0F2B5B]">Doc. Embarque #{idx + 1}</span>
            {docs.length > 1 && (
              <button type="button" onClick={() => setDocs(ds => ds.filter(x => x.id !== d.id))}
                className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Select label="Tipo Documento" value={d.tipoDoc} onChange={v => setField(d.id, "tipoDoc", v)} options={catToSel(TIPO_DOC_EMBARQUE)} required />
            <Input label="N. BL / AWB / CRT" value={d.nroDoc} onChange={v => setField(d.id, "nroDoc", v)} required mono />
            <Input label="Fecha Embarque" value={d.fechaEmbarque} onChange={v => setField(d.id, "fechaEmbarque", v)} type="date" required />
            <Select label="Lugar Embarque" value={d.lugarEmbarqueCod} onChange={v => setField(d.id, "lugarEmbarqueCod", v)} options={catToSel(PUERTOS)} />
            <Select label="País Embarque" value={d.paisEmbarqueCod} onChange={v => setField(d.id, "paisEmbarqueCod", v)} options={catToSel(PAISES)} />
            <Select label="Proviene Zona Franca" value={d.provieneZonaFranca}
              onChange={v => setField(d.id, "provieneZonaFranca", v)}
              options={[{ value: "1", label: "1 - SI" }, { value: "2", label: "2 - NO" }]} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setDocs(ds => [...ds, mkDoc()])}
        className="flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF]">
        <Plus size={14} /> Agregar documento de embarque
      </button>
    </div>
  )
}

/* ── Estado compartido entre formularios (singleton en el modulo) ──────── */
let _sharedDAM: DAMFormState | null = null
let _sharedDIM: DIMFormState | null = null
let _sharedDAV: DAVFormState | null = null

function davToDAM(dav: DAVFormState): Partial<DAMFormState> {
  const items: ItemForm[] = dav.items.map((di, idx) => ({
    ...mkItem(),
    nroItem: String(idx + 1),
    nandina: di.nandina,
    nandinaDesc: di.descComercial,
    nroFactura: di.nroFactura,
    cantFisica: di.cantidad,
    fobItem: di.fobItem,
    paisOrigen: di.paisOrigen,
    acuerdoComercial: di.acuerdoComercial || "NA",
    criterioCalificacionOrigen: "",
    ga_pct: di.ga_pct,
    pesoNeto: di.pesoNeto,
    embalaje: di.embalaje,
    tipoMercancia: di.tipoMercancia || "COMUN",
  }))
  const prov0: ProveedorForm = {
    id: uid(),
    razonSocial: dav.vendedorRazonSocial,
    tipoDoc: "", nroDoc: "",
    calleAvenida: dav.vendedorCalle,
    numero: "", barrioZona: "",
    paisCod: dav.vendedorPais,
    ciudadCod: dav.vendedorCiudad,
    telefonoFax: dav.vendedorTel,
    email: dav.vendedorEmail,
  }
  return {
    nroReferencia: dav.refDam || "",
    aduanaDespacho: dav.aduana || "201",
    nitImportador: dav.importadorNroDoc,
    tipoDocImportador: dav.importadorTipoDoc || "NIT",
    totalFob: dav.fobTotal,
    fleteTotal: dav.flete || "0",
    seguroTotal: dav.seguro || "0",
    proveedores: dav.vendedorRazonSocial ? [prov0] : undefined,
    facturas: dav.incoterm ? [{
      id: uid(),
      nroFactura: dav.facturas,
      fechaFactura: "",
      proveedorRazonSocial: dav.vendedorRazonSocial,
      proveedorNroDoc: "",
      proveedorCondicion: dav.vendedorCondicion || "03",
      especifiqueCondVendedor: "",
      proveedorPaisAdquisicion: dav.vendedorPais || "CN",
      incoterm: dav.incoterm,
      lugarIncoterm: dav.lugarIncoterm,
      especifiqueIncoterm: "",
      naturaleza: dav.tipoVenta || "01",
      especifiqueNaturaleza: "",
      moneda: "USD", valorTransaccion: dav.fobTotal,
      tipoCambio: "1",
      formaPago: dav.formaPago || "3",
      especifiqueFormaPago: "",
      medioPago: dav.medioPago || "3",
      especifiqueMedioPago: "",
      destinoMercancia: "02",
      especifiqueDestino: "",
      facturaSujetoDescuento: "NO",
      nivelComercial: "05",
      valorFobTotal: dav.fobTotal, valorCifTotal: dav.cifTotal || "0",
      totalPaginas: "1", totalItems: "", totalPesoNeto: "", observaciones: "",
    }] : undefined,
    items: items.length ? items : undefined,
  }
}

/* ── DAM FORM ────────────────────────────────────────────────────────────── */

const DAM_INIT: DAMFormState = {
  nroReferencia: "", aduanaDespacho: "201", formaEnvio: "02",
  cargaConsolidada: "2", destinoRegimen: "40", modalidadRegimen: "4000",
  modalidadDespacho: "01", tipoDam: "PREVIO", desRegPosCod: "40",
  modDesPosCode: "01", emiParRec: "2", tipMercaderia: [],
  nitImportador: "", tipoDocImportador: "NIT", razonSocialImportador: "",
  nitConsignatario: "", tipoDocConsignatario: "NIT", razonSocialConsignatario: "",
  paisExportacion: "CN", paisProcedencia: "CN", paisTransito: "CL",
  aduanaIngreso: "422", aduanaDestino: "201", lugarEntrega: "LA PAZ",
  viaHastaFrontera: "6", viaDesdefrontera: "3", cargaPeligrosa: false,
  docsEmbarque: [mkDoc()],
  totalFob: "", totalBultos: "", totalPesoBruto: "", totalPesoNeto: "", fleteTotal: "0", seguroTotal: "0",
  proveedores: [mkProv()],
  facturas: [mkFactura()],
  items: [mkItem()]
}

function DAMForm() {
  const [s, setS] = useState<DAMFormState>(DAM_INIT)
  const [saved, setSaved] = useState(false)
  const [tc, setTc] = useState(6.97)
  const [tcInput, setTcInput] = useState("6.97")
  const [fetchingTc, setFetchingTc] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [showTipMer, setShowTipMer] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => { setS((e as CustomEvent<DAMFormState>).detail) }
    window.addEventListener("load-dam", handler)
    return () => window.removeEventListener("load-dam", handler)
  }, [])

  async function fetchTcBcb() {
    setFetchingTc(true)
    try {
      const res = await fetch("/api/bcb")
      const data = await res.json()
      setTc(data.tc)
      setTcInput(String(data.tc))
    } catch { /* keep current */ }
    setFetchingTc(false)
  }

  function set(k: keyof DAMFormState, v: string | boolean) { setS(p => ({ ...p, [k]: v })) }

  const fobFromFacturas = s.facturas.reduce((a, f) => a + parseFloat(f.valorFobTotal || "0"), 0)
  const fobFromItems = s.items.reduce((a, i) => a + (parseFloat(i.fobItem) || parseFloat(i.cantFisica) * parseFloat(i.precioUnit) || 0), 0)
  const fobTotal = fobFromFacturas || fobFromItems
  const fleteTotal = parseFloat(s.fleteTotal) || 0
  const segTotal = parseFloat(s.seguroTotal) || 0
  const pesoNetoAuto = s.items.reduce((a, i) => a + (parseFloat(i.pesoNeto) || 0), 0)
  useEffect(() => { _sharedDAM = s }, [s])
  const validation = validateDAM(s)

  function handleExport() {
    if (!validation.ok) return
    const json = buildDAMJson(s)
    downloadJson(json, `DAM_${s.nroReferencia || "borrador"}.json`)
    saveDraft("DAM", s.nroReferencia, s.nroReferencia, s)
  }

  function handleSave() {
    saveDraft("DAM", s.nroReferencia || `DAM-${new Date().toISOString().slice(0, 10)}`, s.nroReferencia, s)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  function handleCargarDesdeDAV() {
    const dav = _sharedDAV
    if (!dav) return
    const mapped = davToDAM(dav)
    setS(p => ({
      ...p,
      ...mapped,
      proveedores: mapped.proveedores ?? p.proveedores,
      facturas: mapped.facturas ?? p.facturas,
      items: mapped.items ?? p.items,
    }))
  }

  const STEPS = [
    { label: "Datos Generales", short: "Datos Grales.", complete: !!(s.nroReferencia && s.aduanaDespacho) },
    { label: "Proveedores", short: "Proveedores", count: s.proveedores.length, complete: s.proveedores.some(p => p.razonSocial) },
    { label: "Facturas", short: "Facturas", count: s.facturas.length, complete: s.facturas.some(f => f.nroFactura) },
    { label: "Mercancías", short: "Ítems", count: s.items.filter(i => (i.nandina ?? '').trim()).length, complete: s.items.some(i => i.nandina) },
    { label: "Desc. Mínima", short: "Desc. Mín.", complete: s.items.some(i => Object.keys(i.descMinima).length > 0) },
  ]

  return (
    <div>
      <ExportBar tipoDoc="DAM" validation={validation} onExport={handleExport} onSave={handleSave} saved={saved} />

      {/* Wizard Step Indicator */}
      <div className="flex items-stretch mb-5 overflow-x-auto">
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            <button type="button" onClick={() => setActiveTab(i)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center px-3 py-3 transition-all border-b-2
                ${activeTab === i
                  ? "border-[#1E6FD9] bg-[#EFF6FF] text-[#1E6FD9]"
                  : step.complete
                    ? "border-[#16A34A] bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]"
                    : "border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F2B5B]"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 flex-shrink-0
                ${activeTab === i
                  ? "bg-[#1E6FD9] text-white"
                  : step.complete
                    ? "bg-[#16A34A] text-white"
                    : "bg-[#E2E8F0] text-[#64748B]"}`}>
                {step.complete && activeTab !== i ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-[11px] font-semibold whitespace-nowrap hidden sm:block">{step.label}</span>
              <span className="text-[11px] font-semibold whitespace-nowrap sm:hidden">{step.short}</span>
              {"count" in step && step.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5
                  ${activeTab === i ? "bg-[#1E6FD9] text-white" : step.complete ? "bg-[#16A34A] text-white" : "bg-[#E2E8F0] text-[#64748B]"}`}>
                  {step.count}
                </span>
              )}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex items-center flex-shrink-0 px-0.5 border-b-2
                ${i < activeTab ? "border-[#16A34A]" : "border-transparent"}`}>
                <ChevronDown size={14} className={`rotate-[-90deg] ${i < activeTab ? "text-[#16A34A]" : "text-[#CBD5E1]"}`} />
              </div>
            )}
          </React.Fragment>
        ))}
        <div className="flex items-end pb-1 pl-2 border-b-2 border-transparent flex-shrink-0">
          <button type="button" onClick={handleCargarDesdeDAV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#B45309] text-white hover:bg-[#92400E]">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 21l-5-5 5-5"/><path d="M3 16h13a5 5 0 0 0 0-10H6"/>
            </svg>
            DAV
          </button>
        </div>
      </div>

      {/* Step navigation buttons */}
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={() => setActiveTab(t => Math.max(0, t - 1))} disabled={activeTab === 0}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronDown size={12} className="rotate-90" /> Anterior
        </button>
        <span className="text-xs text-[#94A3B8]">Paso {activeTab + 1} de {STEPS.length}</span>
        <button type="button" onClick={() => setActiveTab(t => Math.min(STEPS.length - 1, t + 1))} disabled={activeTab === STEPS.length - 1}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#EFF6FF] disabled:opacity-30 disabled:cursor-not-allowed">
          Siguiente <ChevronDown size={12} className="-rotate-90" />
        </button>
      </div>

      {/* Tab 0: Cabecera */}
      {activeTab === 0 && <>
        <Section title="1. Identificación de la Declaración">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RefInput value={s.nroReferencia} onChange={v => set("nroReferencia", v)} tipoDoc="DAM" />
            <Select label="Aduana de Despacho" value={s.aduanaDespacho} onChange={v => {
              const updates: Partial<DAMFormState> = { aduanaDespacho: v }
              if (isAeropuerto(v)) updates.aduanaIngreso = v
              // Agencias exteriores: Matarani (071)=Perú, Arica (072)=Chile
              if (v === "071") updates.paisTransito = "PE"
              else if (v === "072") updates.paisTransito = "CL"
              setS(p => ({ ...p, ...updates }))
            }} options={catToSel(ADUANAS)} required />
            <Select label="Forma de Envío" value={s.formaEnvio} onChange={v => set("formaEnvio", v)} options={catToSel(FORMAS_ENVIO)} />
            <Select label="Carga Consolidada" value={s.cargaConsolidada}
              onChange={v => set("cargaConsolidada", v)}
              options={[{ value: "1", label: "1 - SI" }, { value: "2", label: "2 - NO" }]} />
            <Select label="Destino Régimen Aduanero" value={s.destinoRegimen} onChange={v => set("destinoRegimen", v)} options={catToSel(REGIMENES_DESTINO)} required />
            <Select label={s.modalidadDespacho === "03" ? "Modalidad Régimen (no aplica — Inmediato)" : "Modalidad Régimen"}
              value={s.modalidadRegimen} onChange={v => set("modalidadRegimen", v)}
              options={catToSel(MODALIDADES_REGIMEN)} required disabled={s.modalidadDespacho === "03"} />
            <Select label="Modalidad Despacho" value={s.modalidadDespacho} onChange={v => {
              // INMEDIATO: no requiere modalidad de régimen
              setS(p => ({ ...p, modalidadDespacho: v, modalidadRegimen: v === "03" ? "" : p.modalidadRegimen }))
            }} options={catToSel(MODALIDADES_DESPACHO)} />
            <Select label="Tipo DAM" value={s.tipoDam} onChange={v => set("tipoDam", v)}
              options={[{ value: "PREVIO", label: "PREVIO" }, { value: "POSTERIOR", label: "POSTERIOR" }]} required />
            {['7000', '7001', '7002'].includes(s.modalidadRegimen) && <>
              <Select label="Destino Régimen Post-Depósito *" value={s.desRegPosCod} onChange={v => set("desRegPosCod", v)} options={catToSel(REGIMENES_DESTINO)} />
              <Select label="Modalidad Despacho Post-Depósito" value={s.modDesPosCode} onChange={v => set("modDesPosCode", v)} options={catToSel(MODALIDADES_DESPACHO)} />
            </>}
            <div className="flex flex-col gap-1">
              <Select label="Emisión para Reconocimiento" value={s.emiParRec}
                onChange={v => { set("emiParRec", v); if (v !== "1") setS(p => ({ ...p, emiParRec: v, tipMercaderia: [] })) }}
                options={catToSel(EMI_PAR_REC)} />
              {s.emiParRec === "1" && (
                <button type="button"
                  onClick={() => setShowTipMer(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#EFF6FF] font-medium text-left">
                  {s.tipMercaderia.length > 0
                    ? `Tipos seleccionados: ${s.tipMercaderia.length}`
                    : "Seleccionar tipo de mercancía *"}
                </button>
              )}
              {s.emiParRec === "1" && s.tipMercaderia.length > 0 && (
                <span className="text-[10px] text-[#475569] leading-snug">
                  {s.tipMercaderia.join(" | ")}
                </span>
              )}
            </div>
          </div>
        </Section>

        <Section title="2. Operadores">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select label="Tipo Doc. Importador" value={s.tipoDocImportador} onChange={v => set("tipoDocImportador", v)} options={catToSel(TIPO_DOCUMENTO)} />
            <NitInput label="NIT / CI Importador" value={s.nitImportador} onChange={v => set("nitImportador", v)} tipo="importador"
              onFound={e => {
                if (e.tipoDoc) set("tipoDocImportador", e.tipoDoc)
                if (e.razonSocial) set("razonSocialImportador", e.razonSocial)
              }} required />
            <Input label="Razón Social Importador" value={s.razonSocialImportador} onChange={v => set("razonSocialImportador", v)} placeholder="Nombre del importador" />
            <div />
            <Select label="Tipo Doc. Consignatario" value={s.tipoDocConsignatario} onChange={v => set("tipoDocConsignatario", v)} options={catToSel(TIPO_DOCUMENTO)} />
            <NitInput label="NIT / CI Consignatario" value={s.nitConsignatario} onChange={v => set("nitConsignatario", v)} tipo="importador"
              onFound={e => {
                if (e.tipoDoc) set("tipoDocConsignatario", e.tipoDoc)
                if (e.razonSocial) set("razonSocialConsignatario", e.razonSocial)
              }} />
            <Input label="Razón Social Consignatario" value={s.razonSocialConsignatario} onChange={v => set("razonSocialConsignatario", v)} placeholder="Si difiere del importador" />
            <div />
          </div>
        </Section>

        <Section title="3. Lugares">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Select label="País Exportación" value={s.paisExportacion} onChange={v => set("paisExportacion", v)} options={catToSel(PAISES)} required />
            <Select label="País Procedencia" value={s.paisProcedencia} onChange={v => set("paisProcedencia", v)} options={catToSel(PAISES)} required />
            <Select
              label={isAeropuerto(s.aduanaDespacho) ? "País Tránsito (no aplica — aeropuerto)" : "País Tránsito *"}
              value={s.paisTransito} onChange={v => set("paisTransito", v)} options={catToSel(PAISES)}
              required={!isAeropuerto(s.aduanaDespacho)}
            />
            <Select
              label={isAeropuerto(s.aduanaDespacho) ? "Aduana Ingreso (igual a despacho)" : "Aduana Ingreso"}
              value={s.aduanaIngreso} onChange={v => set("aduanaIngreso", v)} options={catToSel(ADUANAS)}
              required disabled={isAeropuerto(s.aduanaDespacho)}
            />
            <Select label="Aduana Destino" value={s.aduanaDestino} onChange={v => set("aduanaDestino", v)} options={catToSel(ADUANAS)} />
            <Input label="Lugar Entrega" value={s.lugarEntrega} onChange={v => set("lugarEntrega", v)} placeholder="Ej: LA PAZ" />
          </div>
        </Section>

        <Section title="4. Transporte">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Select label="Vía Hasta Frontera" value={s.viaHastaFrontera} onChange={v => set("viaHastaFrontera", v)} options={catToSel(VIAS_TRANSPORTE)} required />
            <Select label="Vía Desde Frontera" value={s.viaDesdefrontera} onChange={v => set("viaDesdefrontera", v)} options={catToSel(VIAS_TRANSPORTE)} required />
            <div className="flex items-end pb-2">
              <Toggle label="Carga Peligrosa" value={s.cargaPeligrosa} onChange={v => set("cargaPeligrosa", v)} />
            </div>
          </div>
          <DocsEmbarqueSection docs={s.docsEmbarque} setDocs={fn => setS(p => ({ ...p, docsEmbarque: fn(p.docsEmbarque) }))} />
        </Section>

        <Section title="5. Control de Totales" defaultOpen={false}>
          <div className="flex items-center gap-3 mb-4 p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
            <span className="text-xs font-semibold text-[#166534]">Tipo de Cambio BCB</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#166534]">Bs</span>
              <input type="number" step="0.01" value={tcInput}
                onChange={e => { setTcInput(e.target.value); const v = parseFloat(e.target.value); if (v > 0) setTc(v) }}
                className="w-20 text-sm font-mono font-bold border border-[#BBF7D0] rounded px-2 py-1 bg-white text-[#166534] focus:outline-none focus:ring-1 focus:ring-[#0D7A3E]" />
              <span className="text-xs text-[#166534]">/ USD</span>
            </div>
            <button type="button" onClick={fetchTcBcb} disabled={fetchingTc}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#0D7A3E] text-white hover:bg-[#065F2E] disabled:opacity-50 font-medium flex items-center gap-1">
              {fetchingTc ? "Consultando..." : "Actualizar desde BCB"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="FOB Total USD" value={s.totalFob} onChange={v => set("totalFob", v)} type="number" placeholder={fobTotal.toFixed(2)} />
            <Input label="Total Bultos" value={s.totalBultos} onChange={v => set("totalBultos", v)} type="number" />
            <Input label="Peso Bruto Total (kg)" value={s.totalPesoBruto} onChange={v => set("totalPesoBruto", v)} type="number" />
            <div className="flex flex-col gap-1">
              <Input label="Peso Neto Total (kg)" value={s.totalPesoNeto} onChange={v => set("totalPesoNeto", v)} type="number" />
              {pesoNetoAuto > 0 && (
                <button type="button" onClick={() => set("totalPesoNeto", pesoNetoAuto.toFixed(3))}
                  className="text-xs px-2 py-1 rounded border border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#EFF6FF] font-medium">
                  Usar suma ítems: {pesoNetoAuto.toFixed(3)} kg
                </button>
              )}
            </div>
            <Input label="Flete Total USD (para CIF)" value={s.fleteTotal} onChange={v => set("fleteTotal", v)} type="number" />
            <div className="flex flex-col gap-1">
              <Input label="Seguro Total USD (para CIF)" value={s.seguroTotal} onChange={v => set("seguroTotal", v)} type="number" />
              <Tip text="Cuando no se cuenta con el costo real del seguro, el Art. 20 del RLGA autoriza aplicar el 2% del valor FOB como seguro presunto.">
                <button type="button"
                  onClick={() => { const fob = parseFloat(s.totalFob) || fobTotal; if (fob > 0) set("seguroTotal", (fob * 0.02).toFixed(2)) }}
                  className="w-full text-xs px-2 py-1 rounded border border-[#0D7A3E] text-[#0D7A3E] hover:bg-[#F0FDF4] font-medium">
                  Aplicar 2% FOB (Art. 20 RLGA)
                </button>
              </Tip>
            </div>
            <div className="flex items-end">
              <Tip text="Copia los valores de Flete y Seguro desde la DAV abierta.">
                <button type="button"
                  onClick={() => { const dav = _sharedDAV; if (!dav) return; setS(p => ({ ...p, fleteTotal: dav.flete || "0", seguroTotal: dav.seguro || "0" })) }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#B45309] text-[#B45309] hover:bg-[#FFFBEB] font-medium">
                  Sync flete/seguro desde DAV
                </button>
              </Tip>
            </div>
          </div>
          {(fleteTotal + segTotal) > 0 && (
            <p className="text-xs text-[#0D7A3E] mt-2">CIF por ítem = FOB ítem + prorrateo de flete/seguro.</p>
          )}
        </Section>
      </>}

      {/* Tab 1: Proveedores */}
      {activeTab === 1 && (
        <Section title={`6. Proveedor(es) — ${s.proveedores.length}`}>
          <ProveedoresSection proveedores={s.proveedores} setProveedores={fn => setS(p => ({ ...p, proveedores: fn(p.proveedores) }))} />
        </Section>
      )}

      {/* Tab 2: Facturas */}
      {activeTab === 2 && (
        <Section title={`7. Facturas / Transacciones — ${s.facturas.length}`}>
          <FacturasSection facturas={s.facturas} setFacturas={fn => setS(p => ({ ...p, facturas: fn(p.facturas) }))} />
        </Section>
      )}

      {/* Tab 3: Mercancías */}
      {activeTab === 3 && (
        <Section title={`8. Mercancías — ${s.items.filter(i => (i.nandina ?? '').trim()).length} ítems`}>
          <ItemsGrid
            items={s.items}
            setItems={fn => setS(p => ({ ...p, items: fn(p.items) }))}
            facturas={s.facturas}
            fobTotal={fobTotal} fleteTotal={fleteTotal} segTotal={segTotal} tc={tc}
          />
        </Section>
      )}

      {/* Tab 4: Descripción Mínima */}
      {activeTab === 4 && (
        <Section title={`9. Descripción Mínima — ${s.items.filter(i => (i.nandina ?? '').trim()).length} ítems`}>
          {s.items.filter(i => (i.nandina ?? '').trim()).length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8]">
              <Database size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Agrega ítems en el paso Mercancías primero.</p>
            </div>
          ) : (
            <DescMinGrid
              items={s.items}
              setItems={fn => setS(p => ({ ...p, items: fn(p.items) }))}
            />
          )}
        </Section>
      )}
      {showTipMer && (
        <TipMercaderiaModal
          selected={s.tipMercaderia}
          onConfirm={vals => setS(p => ({ ...p, tipMercaderia: vals }))}
          onClose={() => setShowTipMer(false)}
        />
      )}
    </div>
  )
}

/* ── TipMercaderia modal (frmTipoMercaderia replica) ─────────────────────── */

const TIP_MER_OPCIONES = [
  "1 - A GRANEL", "2 - ANIMALES VIVOS", "3 - CORROSIVOS", "4 - EXPLOSIVOS",
  "5 - FACIL RECONOCIMIENTO", "6 - GRAN VOLUMEN", "7 - HOMOGENEAS", "8 - INFLAMABLES"
]

function TipMercaderiaModal({ selected, onConfirm, onClose }: {
  selected: string[]; onConfirm: (vals: string[]) => void; onClose: () => void
}) {
  const [checked, setChecked] = useState<string[]>(selected)
  function toggle(v: string) {
    setChecked(c => c.includes(v) ? c.filter(x => x !== v) : [...c, v])
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "#f2f2f2", border: "1px solid #666", borderRadius: 4, width: 360, boxShadow: "4px 4px 20px rgba(0,0,0,0.35)", fontSize: 12 }}>
        <div style={{ background: "#0F2B5B", color: "#fff", padding: "6px 14px", fontWeight: 700, borderRadius: "3px 3px 0 0", display: "flex", justifyContent: "space-between" }}>
          <span>Tipo de Mercancía (SIN DESCARGA)</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 15 }}>✕</button>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 11, color: "#555", marginBottom: 12 }}>Seleccione uno o más tipos de mercancía:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TIP_MER_OPCIONES.map(op => (
              <label key={op} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="checkbox" checked={checked.includes(op)} onChange={() => toggle(op)}
                  style={{ width: 14, height: 14, cursor: "pointer" }} />
                {op}
              </label>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, padding: "10px 18px", borderTop: "1px solid #ccc", background: "#e8e8e8", justifyContent: "flex-end", borderRadius: "0 0 3px 3px" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "4px 14px", border: "1px solid #999", borderRadius: 2, background: "#f5f5f5", cursor: "pointer", fontSize: 12 }}>
            Cancelar
          </button>
          <button type="button" onClick={() => { onConfirm(checked); onClose() }}
            style={{ padding: "4px 14px", border: "1px solid #0A5C2B", borderRadius: 2, background: "#217346", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── DIM FORM ────────────────────────────────────────────────────────────── */

const DIM_INIT: DIMFormState = {
  nroReferencia: "", aduanaDespacho: "211", formaEnvio: "02",
  destinoRegimen: "40", modalidadRegimen: "4000", modalidadDespacho: "01",
  tipoDespacho: "02", tratamientoEspecial: "000", numeroDim: "",
  entPubAbs: false, nitImportador: "", tipoDocImportador: "NIT",
  paisExportacion: "US", paisProcedencia: "US", paisTransito: "CL",
  aduanaIngreso: "211", fechaEmbarque: "", lugarEmbarqueCod: "USMIA",
  localidadDestinoCod: "BOVVI", departamentoDestinoCod: "BO",
  viaHastaFrontera: "4", viaDesdeFrontera: "4", cargaPeligrosa: false,
  proZonFra: false, costoSeguro: "0", gastosCargaDescarga: "0",
  gastosTransDesdePuerto: "0", gastosTransHastaEmbarque: "0",
  gastosTransHastaImportacion: "0", gastosTransHastaPuerto: "0",
  otrasErogaciones: "0", otrosGastos: "0",
  totalBultos: "", totalFacturas: "", totalFob: "", totalPesoBruto: "", totalPesoNeto: "",
  proveedores: [mkProv()], facturas: [mkFactura()], items: [mkItem()]
}

function DIMForm() {
  const [s, setS] = useState<DIMFormState>(DIM_INIT)
  const [saved, setSaved] = useState(false)
  const [tc, setTc] = useState(6.97)
  const [tcInput, setTcInput] = useState("6.97")
  const [fetchingTc, setFetchingTc] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => { setS((e as CustomEvent<DIMFormState>).detail) }
    window.addEventListener("load-dim", handler)
    return () => window.removeEventListener("load-dim", handler)
  }, [])

  async function fetchTcBcb() {
    setFetchingTc(true)
    try {
      const res = await fetch("/api/bcb")
      const data = await res.json()
      setTc(data.tc); setTcInput(String(data.tc))
    } catch { /* keep current */ }
    setFetchingTc(false)
  }

  function set(k: keyof DIMFormState, v: string | boolean) { setS(p => ({ ...p, [k]: v })) }
  const fobFromFacturasDim = s.facturas.reduce((a, f) => a + parseFloat(f.valorFobTotal || "0"), 0)
  const fobFromItemsDim = s.items.reduce((a, i) => a + (parseFloat(i.fobItem) || parseFloat(i.cantFisica) * parseFloat(i.precioUnit) || 0), 0)
  const fobTotal = fobFromFacturasDim || fobFromItemsDim
  const fleteTotal = (parseFloat(s.gastosTransHastaImportacion) || 0) + (parseFloat(s.gastosTransDesdePuerto) || 0) + (parseFloat(s.gastosTransHastaEmbarque) || 0) + (parseFloat(s.gastosTransHastaPuerto) || 0)
  const segTotal = parseFloat(s.costoSeguro || "0")
  useEffect(() => { _sharedDIM = s }, [s])
  const validation = validateDIM(s)

  function handleExport() {
    if (!validation.ok) return
    const json = buildDIMJson(s)
    downloadJson(json, `DIM_${s.nroReferencia || "borrador"}.json`)
    saveDraft("DIM", s.nroReferencia, s.nroReferencia, s)
  }

  function handleSave() {
    saveDraft("DIM", s.nroReferencia || `DIM-${new Date().toISOString().slice(0, 10)}`, s.nroReferencia, s)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <ExportBar tipoDoc="DIM" validation={validation} onExport={handleExport} onSave={handleSave} saved={saved} />

      <Section title="1. Identificación">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RefInput value={s.nroReferencia} onChange={v => set("nroReferencia", v)} tipoDoc="DIM" />
          <Input label="N. DIM (si tiene)" value={s.numeroDim} onChange={v => set("numeroDim", v)} mono />
          <Select label="Aduana de Despacho" value={s.aduanaDespacho} onChange={v => {
            if (isAeropuerto(v)) setS(p => ({ ...p, aduanaDespacho: v, aduanaIngreso: v }))
            else set("aduanaDespacho", v)
          }} options={catToSel(ADUANAS)} required />
          <Select label="Forma de Envío" value={s.formaEnvio} onChange={v => set("formaEnvio", v)} options={catToSel(FORMAS_ENVIO)} />
          <Select label="Destino Régimen" value={s.destinoRegimen} onChange={v => set("destinoRegimen", v)} options={catToSel(REGIMENES_DESTINO)} required />
          <Select label="Modalidad Régimen" value={s.modalidadRegimen} onChange={v => set("modalidadRegimen", v)} options={catToSel(MODALIDADES_REGIMEN)} />
          <Select label="Tipo Despacho" value={s.tipoDespacho} onChange={v => set("tipoDespacho", v)} options={catToSel(TIPOS_DESPACHO_DIM)} />
          <Select label="Tratamiento Especial" value={s.tratamientoEspecial} onChange={v => set("tratamientoEspecial", v)} options={catToSel(TRATAMIENTOS_ESPECIALES)} />
        </div>
      </Section>

      <Section title="2. Operadores">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Tipo Doc. Importador" value={s.tipoDocImportador} onChange={v => set("tipoDocImportador", v)} options={catToSel(TIPO_DOCUMENTO)} />
          <NitInput label="NIT / CI Importador" value={s.nitImportador} onChange={v => set("nitImportador", v)} tipo="importador"
            onFound={e => { if (e.tipoDoc) set("tipoDocImportador", e.tipoDoc) }} required />
          <div className="flex items-end pb-2">
            <Toggle label="Entidad Pública/Abstracción" value={s.entPubAbs} onChange={v => set("entPubAbs", v)} />
          </div>
        </div>
      </Section>

      <Section title="3. Lugares">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Select label="País Exportación" value={s.paisExportacion} onChange={v => set("paisExportacion", v)} options={catToSel(PAISES)} required />
          <Select label="País Procedencia" value={s.paisProcedencia} onChange={v => set("paisProcedencia", v)} options={catToSel(PAISES)} required />
          <Select
            label={isAeropuerto(s.aduanaDespacho) ? "País Tránsito (no aplica — aeropuerto)" : "País Tránsito *"}
            value={s.paisTransito} onChange={v => set("paisTransito", v)} options={catToSel(PAISES)}
            required={!isAeropuerto(s.aduanaDespacho)}
          />
          <Select
            label={isAeropuerto(s.aduanaDespacho) ? "Aduana Ingreso (igual a despacho)" : "Aduana Ingreso"}
            value={s.aduanaIngreso} onChange={v => set("aduanaIngreso", v)} options={catToSel(ADUANAS)}
            required disabled={isAeropuerto(s.aduanaDespacho)}
          />
          <Input label="Fecha Embarque" value={s.fechaEmbarque} onChange={v => set("fechaEmbarque", v)} type="date" required />
          <Select label="Lugar Embarque" value={s.lugarEmbarqueCod} onChange={v => set("lugarEmbarqueCod", v)} options={catToSel(PUERTOS)} required />
          <Select label="Localidad Destino" value={s.localidadDestinoCod} onChange={v => set("localidadDestinoCod", v)} options={catToSel(PUERTOS)} />
          <Select label="Departamento Destino" value={s.departamentoDestinoCod} onChange={v => set("departamentoDestinoCod", v)} options={catToSel(PAISES)} />
        </div>
      </Section>

      <Section title="4. Transporte y Valoración">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Select label="Vía Hasta Frontera" value={s.viaHastaFrontera} onChange={v => set("viaHastaFrontera", v)} options={catToSel(VIAS_TRANSPORTE)} required />
          <Select label="Vía Desde Frontera" value={s.viaDesdeFrontera} onChange={v => set("viaDesdeFrontera", v)} options={catToSel(VIAS_TRANSPORTE)} required />
          <div className="flex items-end pb-2">
            <Toggle label="Carga Peligrosa" value={s.cargaPeligrosa} onChange={v => set("cargaPeligrosa", v)} />
          </div>
          <div className="flex items-end pb-2">
            <Toggle label="Proviene Zona Franca" value={s.proZonFra} onChange={v => set("proZonFra", v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Costo Total Seguro USD" value={s.costoSeguro} onChange={v => set("costoSeguro", v)} type="number" />
          <Input label="Gastos Carga/Descarga" value={s.gastosCargaDescarga} onChange={v => set("gastosCargaDescarga", v)} type="number" />
          <Input label="Gastos Trans. hasta Embarque" value={s.gastosTransHastaEmbarque} onChange={v => set("gastosTransHastaEmbarque", v)} type="number" />
          <Input label="Gastos Trans. hasta Puerto" value={s.gastosTransHastaPuerto} onChange={v => set("gastosTransHastaPuerto", v)} type="number" />
          <Input label="Gastos Trans. desde Puerto" value={s.gastosTransDesdePuerto} onChange={v => set("gastosTransDesdePuerto", v)} type="number" />
          <Input label="Gastos Trans. hasta Importación" value={s.gastosTransHastaImportacion} onChange={v => set("gastosTransHastaImportacion", v)} type="number" />
          <Input label="Otras Erogaciones" value={s.otrasErogaciones} onChange={v => set("otrasErogaciones", v)} type="number" />
          <Input label="Otros Gastos" value={s.otrosGastos} onChange={v => set("otrosGastos", v)} type="number" />
        </div>
        {(fleteTotal + segTotal) > 0 && (
          <div className="mt-3 p-3 bg-[#F0FDF4] rounded-lg text-sm text-[#0D7A3E]">
            Flete total: <strong>USD {fleteTotal.toFixed(2)}</strong> | Seguro: <strong>USD {segTotal.toFixed(2)}</strong> | CIF ajuste distribuido por ítem automáticamente
          </div>
        )}
      </Section>

      <Section title="5. Totales de Control" defaultOpen={false}>
        <div className="flex items-center gap-3 mb-4 p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg">
          <span className="text-xs font-semibold text-[#166534]">Tipo de Cambio BCB</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#166534]">Bs</span>
            <input type="number" step="0.01" value={tcInput}
              onChange={e => { setTcInput(e.target.value); const v = parseFloat(e.target.value); if (v > 0) setTc(v) }}
              className="w-20 text-sm font-mono font-bold border border-[#BBF7D0] rounded px-2 py-1 bg-white text-[#166534] focus:outline-none focus:ring-1 focus:ring-[#0D7A3E]" />
            <span className="text-xs text-[#166534]">/ USD</span>
          </div>
          <button type="button" onClick={fetchTcBcb} disabled={fetchingTc}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#0D7A3E] text-white hover:bg-[#065F2E] disabled:opacity-50 font-medium">
            {fetchingTc ? "Consultando..." : "Actualizar desde BCB"}
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <Input label="Total Bultos" value={s.totalBultos} onChange={v => set("totalBultos", v)} type="number" />
          <Input label="Total Facturas" value={s.totalFacturas} onChange={v => set("totalFacturas", v)} type="number" />
          <Input label="FOB Total USD" value={s.totalFob} onChange={v => set("totalFob", v)} type="number" />
          <Input label="Peso Bruto Total (kg)" value={s.totalPesoBruto} onChange={v => set("totalPesoBruto", v)} type="number" />
          <Input label="Peso Neto Total (kg)" value={s.totalPesoNeto} onChange={v => set("totalPesoNeto", v)} type="number" />
        </div>
      </Section>

      <Section title="6. Proveedor(es)">
        <ProveedoresSection proveedores={s.proveedores} setProveedores={fn => setS(p => ({ ...p, proveedores: fn(p.proveedores) }))} />
      </Section>

      <Section title="7. Facturas / Transacciones">
        <FacturasSection facturas={s.facturas} setFacturas={fn => setS(p => ({ ...p, facturas: fn(p.facturas) }))} />
      </Section>

      <Section title={`8. Mercancías (${s.items.length} ítems)`}>
        <ItemsGrid
          items={s.items}
          setItems={fn => setS(p => ({ ...p, items: fn(p.items) }))}
          facturas={s.facturas}
          fobTotal={fobTotal} fleteTotal={fleteTotal} segTotal={segTotal} tc={tc}
          showRitex
        />
      </Section>

      <Section title={`9. Descripción Mínima — ${s.items.length} ítems`} defaultOpen={false}>
        {s.items.length === 0 ? (
          <div className="text-center py-10 text-[#94A3B8]">
            <Database size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Agrega ítems en el paso Mercancías primero.</p>
          </div>
        ) : (
          <DescMinGrid
            items={s.items}
            setItems={fn => setS(p => ({ ...p, items: fn(p.items) }))}
          />
        )}
      </Section>
    </div>
  )
}

/* ── DEX FORM ────────────────────────────────────────────────────────────── */

const DEX_INIT: DEXFormState = {
  nroReferencia: "", aduanaDespacho: "421", regimen: "10", modalidadRegimen: "1000",
  tipoEmbarque: "ET", nitExportador: "", tipoDocExportador: "NIT",
  consigRazonSocial: "", consigNroDoc: "", consigEmail: "",
  consigCalle: "", consigNumero: "", consigPaisCod: "CL", consigCiudadCod: "CLSCL",
  aduanaSalida: "421", lugarEmbarqueCod: "BOSRZ", lugarDesembCod: "CLSCL",
  paisDestino: "CL", paisTransito: "",
  viaInternacional: "3", viaNacional: "3",
  incoterm: "EXW", lugarIncoterm: "SANTA CRUZ",
  naturaleza: "11", formaPago: "3", medioPago: "3",
  moneda: "USD", tipoCambio: "1",
  valorTransaccion: "", valorFobUs: "",
  valorFleteTotal: "0", valorFleteInterno: "0", valorSeguro: "0",
  totalBultos: "", totalPesoBruto: "", totalPesoNeto: "",
  items: [{ id: uid(), nandina: "", nandinaDesc: "", descripcion: "", marcas: "", paisOrigen: "BO", cantidad: "", unidad: "NMB", cantBultos: "1", pesoNeto: "", pesoBruto: "", precioUnit: "", valorTransaccion: "", valorFob: "", valorFlete: "0", valorSeguro: "0", embalaje: "CT", estado: "1", acuerdoComercial: "NA", origenMineralMetal: false }]
}

function mkDexItem(): DEXItemForm {
  return { id: uid(), nandina: "", nandinaDesc: "", descripcion: "", marcas: "", paisOrigen: "BO", cantidad: "", unidad: "NMB", cantBultos: "1", pesoNeto: "", pesoBruto: "", precioUnit: "", valorTransaccion: "", valorFob: "", valorFlete: "0", valorSeguro: "0", embalaje: "CT", estado: "1", acuerdoComercial: "NA", origenMineralMetal: false }
}

function DEXForm() {
  const [s, setS] = useState<DEXFormState>(DEX_INIT)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => { setS((e as CustomEvent<DEXFormState>).detail) }
    window.addEventListener("load-dex", handler)
    return () => window.removeEventListener("load-dex", handler)
  }, [])

  function set(k: keyof DEXFormState, v: string | boolean) { setS(p => ({ ...p, [k]: v })) }
  function setItem(id: string, k: keyof DEXItemForm, v: string | boolean) {
    setS(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [k]: v } : i) }))
  }
  function addItem() { setS(p => ({ ...p, items: [...p.items, mkDexItem()] })) }
  function delItem(id: string) { setS(p => ({ ...p, items: p.items.filter(i => i.id !== id) })) }

  const validation = validateDEX(s)
  const totFob = s.items.reduce((a, i) => a + parseFloat(i.valorFob || "0"), 0)

  function handleExport() {
    if (!validation.ok) return
    const json = buildDEXJson(s)
    downloadJson(json, `DEX_${s.nroReferencia || "borrador"}.json`)
    saveDraft("DEX", s.nroReferencia, s.nroReferencia, s)
  }

  function handleSave() {
    saveDraft("DEX", s.nroReferencia || `DEX-${new Date().toISOString().slice(0, 10)}`, s.nroReferencia, s)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <ExportBar tipoDoc="DEX" validation={validation} onExport={handleExport} onSave={handleSave} saved={saved} />

      <Section title="1. Identificación">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <RefInput value={s.nroReferencia} onChange={v => set("nroReferencia", v)} tipoDoc="DEX" />
          <Select label="Aduana Despacho" value={s.aduanaDespacho} onChange={v => set("aduanaDespacho", v)} options={catToSel(ADUANAS)} required />
          <Select label="Régimen Aduanero" value={s.regimen} onChange={v => set("regimen", v)} options={catToSel(REGIMENES_DEX)} required />
          <Select label="Modalidad Régimen" value={s.modalidadRegimen} onChange={v => set("modalidadRegimen", v)} options={catToSel(MODALIDADES_DEX)} />
          <Select label="Tipo Embarque" value={s.tipoEmbarque} onChange={v => set("tipoEmbarque", v)} options={catToSel(TIPO_EMBARQUE)} />
        </div>
      </Section>

      <Section title="2. Exportador">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Tipo Documento" value={s.tipoDocExportador} onChange={v => set("tipoDocExportador", v)} options={catToSel(TIPO_DOCUMENTO)} />
          <NitInput label="NIT / CI Exportador" value={s.nitExportador} onChange={v => set("nitExportador", v)} tipo="exportador"
            onFound={e => { if (e.tipoDoc) set("tipoDocExportador", e.tipoDoc) }} required />
        </div>
      </Section>

      <Section title="3. Consignatario (Destinatario Externo)">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Razón Social" value={s.consigRazonSocial} onChange={v => set("consigRazonSocial", v)} className="col-span-2" />
          <Input label="N. Documento" value={s.consigNroDoc} onChange={v => set("consigNroDoc", v)} mono />
          <Input label="Email" value={s.consigEmail} onChange={v => set("consigEmail", v)} type="email" />
          <Input label="Dirección" value={s.consigCalle} onChange={v => set("consigCalle", v)} className="col-span-2" />
          <Select label="Pais" value={s.consigPaisCod} onChange={v => set("consigPaisCod", v)} options={catToSel(PAISES)} />
          <Select label="Ciudad" value={s.consigCiudadCod} onChange={v => set("consigCiudadCod", v)} options={catToSel(PUERTOS)} />
        </div>
      </Section>

      <Section title="4. Lugar">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Select label="Aduana Salida" value={s.aduanaSalida} onChange={v => set("aduanaSalida", v)} options={catToSel(ADUANAS)} required />
          <Select label="Lugar Embarque (Origen)" value={s.lugarEmbarqueCod} onChange={v => set("lugarEmbarqueCod", v)} options={catToSel(PUERTOS)} required />
          <Select label="Lugar Desembarque (Destino)" value={s.lugarDesembCod} onChange={v => set("lugarDesembCod", v)} options={catToSel(PUERTOS)} required />
          <Select label="País Destino" value={s.paisDestino} onChange={v => set("paisDestino", v)} options={catToSel(PAISES)} required />
          <Select label="País Tránsito (opcional)" value={s.paisTransito} onChange={v => set("paisTransito", v)} options={catToSel(PAISES)} />
        </div>
      </Section>

      <Section title="5. Transporte">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Transporte Internacional" value={s.viaInternacional} onChange={v => set("viaInternacional", v)} options={catToSel(VIAS_TRANSPORTE)} required />
          <Select label="Transporte Nacional" value={s.viaNacional} onChange={v => set("viaNacional", v)} options={catToSel(VIAS_TRANSPORTE)} required />
        </div>
      </Section>

      <Section title="6. Valores de Transacción">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Incoterms" value={s.incoterm} onChange={v => set("incoterm", v)} options={catToSel(INCOTERMS)} required />
          <Input label="Lugar Incoterms" value={s.lugarIncoterm} onChange={v => set("lugarIncoterm", v)} />
          <Select label="Naturaleza Transacción" value={s.naturaleza} onChange={v => set("naturaleza", v)} options={catToSel(NATURALEZA_TRANSACCION)} className="col-span-2" />
          <Select label="Forma de Pago" value={s.formaPago} onChange={v => set("formaPago", v)} options={catToSel(FORMAS_PAGO)} />
          <Select label="Medio de Pago" value={s.medioPago} onChange={v => set("medioPago", v)} options={catToSel(MEDIOS_PAGO)} />
          <Select label="Moneda" value={s.moneda} onChange={v => set("moneda", v)} options={catToSel(MONEDAS)} />
          <Input label="Valor Transacción USD" value={s.valorTransaccion} onChange={v => set("valorTransaccion", v)} type="number" />
          <Input label="FOB Total USD" value={s.valorFobUs} onChange={v => set("valorFobUs", v)} type="number" placeholder={totFob.toFixed(2)} />
          <Input label="Flete Total" value={s.valorFleteTotal} onChange={v => set("valorFleteTotal", v)} type="number" />
          <Input label="Flete Interno" value={s.valorFleteInterno} onChange={v => set("valorFleteInterno", v)} type="number" />
          <Input label="Seguro" value={s.valorSeguro} onChange={v => set("valorSeguro", v)} type="number" />
        </div>
      </Section>

      <Section title="7. Totales" defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Total Bultos" value={s.totalBultos} onChange={v => set("totalBultos", v)} type="number" />
          <Input label="Peso Bruto Total (kg)" value={s.totalPesoBruto} onChange={v => set("totalPesoBruto", v)} type="number" />
          <Input label="Peso Neto Total (kg)" value={s.totalPesoNeto} onChange={v => set("totalPesoNeto", v)} type="number" />
        </div>
      </Section>

      <Section title={`8. Mercancías de Exportación (${s.items.length} ítems)`}>
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full text-xs" style={{ minWidth: 1200 }}>
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-6">#</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-36">Subpartida</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-48">Descripción</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">País Orig.</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Cantidad</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-16">UM</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Bultos</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Kg Neto</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Kg Bruto</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-24">P.Unit USD</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-24">FOB Ítem</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Flete</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-20">Embalaje</th>
                <th className="px-2 py-2 text-left text-[#64748B] font-semibold w-16">Estado</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"}>
                  <td className="px-2 py-1.5 text-[#94A3B8]">{idx + 1}</td>
                  <td className="px-1 py-1.5">
                    <NandinaCell
                      value={item.nandina}
                      onChange={v => setItem(item.id, "nandina", v)}
                      onSelect={r => setS(p => ({ ...p, items: p.items.map(i => i.id === item.id ? { ...i, nandina: r.codigo, nandinaDesc: r.descripcion } : i) }))}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input value={item.descripcion} onChange={e => setItem(item.id, "descripcion", e.target.value)}
                      className="w-full text-xs border border-[#E2E8F0] rounded px-1.5 py-1" placeholder="Descripción simple..." />
                  </td>
                  <td className="px-1 py-1.5">
                    <select value={item.paisOrigen} onChange={e => setItem(item.id, "paisOrigen", e.target.value)}
                      className="w-full text-xs border border-[#E2E8F0] rounded px-1 py-1 bg-white">
                      {PAISES.map(p => <option key={p.cod} value={p.cod}>{p.cod}</option>)}
                    </select>
                  </td>
                  {(["cantidad","unidad","cantBultos","pesoNeto","pesoBruto","precioUnit","valorFob","valorFlete"] as const).map(k => (
                    k === "unidad" ? (
                      <td key={k} className="px-1 py-1.5">
                        <select value={item.unidad} onChange={e => setItem(item.id, "unidad", e.target.value)}
                          className="w-full text-xs border border-[#E2E8F0] rounded px-1 py-1 bg-white">
                          {UNIDAD_COMERCIAL.map(u => <option key={u.cod} value={u.cod}>{u.cod}</option>)}
                        </select>
                      </td>
                    ) : (
                      <td key={k} className="px-1 py-1.5">
                        <input type="number" value={item[k] as string} onChange={e => setItem(item.id, k, e.target.value)}
                          className="w-full text-xs border border-[#E2E8F0] rounded px-1.5 py-1 text-right" />
                      </td>
                    )
                  ))}
                  <td className="px-1 py-1.5">
                    <select value={item.embalaje} onChange={e => setItem(item.id, "embalaje", e.target.value)}
                      className="w-full text-xs border border-[#E2E8F0] rounded px-1 py-1 bg-white">
                      {EMBALAJE.map(e => <option key={e.cod} value={e.cod}>{e.cod}</option>)}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <select value={item.estado} onChange={e => setItem(item.id, "estado", e.target.value)}
                      className="w-full text-xs border border-[#E2E8F0] rounded px-1 py-1 bg-white">
                      {ESTADO_MERCANCIA.map(e => <option key={e.cod} value={e.cod}>{e.cod}</option>)}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <button type="button" onClick={() => delItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addItem}
          className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF]">
          <Plus size={14} /> Agregar ítem
        </button>
      </Section>
    </div>
  )
}

/* ── Helpers DAV ──────────────────────────────────────────────────────────── */

function calcDavItemAuto(i: DAVItemForm): DAVItemForm {
  const fob = parseFloat(i.fobItem) || 0
  const flete = parseFloat(i.fleteItem) || 0
  const cif = fob + flete
  const gaPct = parseFloat(i.ga_pct) || 0
  const ice = parseFloat(i.ice_monto) || 0
  const ga = cif * gaPct / 100
  const iva = (cif + ga + ice) * 14.94 / 100
  return { ...i, cifItem: fmt2(cif), montoGA: fmt2(ga), iva_monto: fmt2(iva) }
}

function damToDAV(dam: DAMFormState): Partial<DAVFormState> {
  const fact0 = dam.facturas[0]
  const prov0 = dam.proveedores[0]
  const fobCalc = dam.items.reduce((sum, item) => {
    return sum + (parseFloat(item.fobItem) || parseFloat(item.cantFisica) * parseFloat(item.precioUnit) || 0)
  }, 0)
  const getStr = (dm: Record<string, string>, key: string): string => {
    const v = dm[key]; if (!v) return ""
    try { const p = JSON.parse(v); return p.especifique || p.descripcion || String(p) } catch { return v }
  }
  return {
    refDam: dam.nroReferencia,
    importadorTipoDoc: dam.tipoDocImportador || "NIT",
    importadorNroDoc: dam.nitImportador,
    importadorPais: "BO",
    vendedorRazonSocial: prov0?.razonSocial || "",
    vendedorCondicion: fact0?.proveedorCondicion || "03",
    vendedorPais: prov0?.paisCod || "",
    vendedorCalle: prov0?.calleAvenida || "",
    vendedorCiudad: prov0?.ciudadCod || "",
    vendedorTel: prov0?.telefonoFax || "",
    vendedorEmail: prov0?.email || "",
    nroFacturas: String(dam.facturas.length),
    facturas: dam.facturas.map(f => f.nroFactura).filter(Boolean).join(", "),
    tipoVenta: fact0?.naturaleza || "01",
    incoterm: fact0?.incoterm || "FOB",
    condicionEntrega: "03",
    lugarIncoterm: fact0?.lugarIncoterm || "",
    formaPago: fact0?.formaPago || "02",
    medioPago: fact0?.medioPago || "01",
    fobTotal: dam.totalFob || (fobCalc > 0 ? fmt2(fobCalc) : ""),
    flete: dam.fleteTotal || "0",
    seguro: dam.seguroTotal || "0",
    aduana: "201",
    items: dam.items.map((item, idx) => calcDavItemAuto({
      ...mkDavItem(),
      nroItem: String(idx + 1),
      nandina: item.nandina,
      nroFactura: item.nroFactura || fact0?.nroFactura || "",
      fechaFactura: fact0?.fechaFactura || "",
      cantidad: item.cantFisica,
      descComercial: item.nandinaDesc,
      tipoMercancia: getStr(item.descMinima, "NombreMercancia") || item.tipoMercancia,
      clase: getStr(item.descMinima, "Clase"),
      modelo: getStr(item.descMinima, "Modelo"),
      cuanti1: getStr(item.descMinima, "Cuanti1"),
      cuanti2: getStr(item.descMinima, "Cuanti2"),
      formatoPresentacion: getStr(item.descMinima, "ForPre"),
      material: getStr(item.descMinima, "Composicion"),
      uso: getStr(item.descMinima, "Uso"),
      otrasCaract: getStr(item.descMinima, "OtrasCaracteristicas"),
      fobItem: item.fobItem || (parseFloat(item.cantFisica) * parseFloat(item.precioUnit) > 0 ? fmt2(parseFloat(item.cantFisica) * parseFloat(item.precioUnit)) : ""),
      fleteItem: "0",
      paisOrigen: item.paisOrigen,
      acuerdoComercial: item.acuerdoComercial || "NA",
      ga_pct: item.ga_pct,
      pesoNeto: item.pesoNeto,
      embalaje: item.embalaje,
      anioFab: "",
    }))
  }
}

/* ── DAV FORM ────────────────────────────────────────────────────────────── */

const DAV_INIT: DAVFormState = {
  refDam: "", importadorRazonSocial: "", importadorTipoDoc: "NIT", importadorNroDoc: "",
  importadorDepartamento: "LP", importadorCiudad: "LA PAZ", importadorPais: "BO",
  importadorCalle: "", importadorTel: "", importadorFax: "", importadorEmail: "",
  vendedorRazonSocial: "", vendedorCondicion: "01", vendedorCalle: "",
  vendedorCiudad: "", vendedorPais: "CN", vendedorTel: "", vendedorEmail: "",
  nroFacturas: "1", facturas: "",
  tipoVenta: "03", condicionEntrega: "03", incoterm: "FOB", lugarIncoterm: "",
  formaPago: "02", medioPago: "01", sujDescuento: "0",
  comisiones: "0", fobTotal: "", restricciones: "0",
  flete: "0", seguro: "0", otrosGastos: "0", cifTotal: "", aduana: "201",
  vinculacion: "0", vinculacionInfluye: "0", vinculacionPrecioAprox: "0",
  declaranteNombre: "", declaranteTipoDoc: "NIT", declaranteNroDoc: "",
  declaranteDepartamento: "LP", declaranteCalle: "", declaranteCiudad: "LA PAZ",
  declaranteTel: "", apoderadoNombre: "", apoderadoCI: "", observaciones: "",
  items: [{
    id: uid(), nroItem: "1", nandina: "", nroFactura: "", fechaFactura: "",
    cantidad: "", descComercial: "", tipoMercancia: "", clase: "-", modelo: "-",
    cuanti1: "-", cuanti2: "-", formatoPresentacion: "", material: "", uso: "",
    otrasCaract: "", paisOrigen: "CN", acuerdoComercial: "NA",
    anioFab: "", embalaje: "CT",
    fobItem: "", fleteItem: "0", cifItem: "", pesoNeto: "",
    ga_pct: "", montoGA: "0", ice_monto: "0", iva_monto: "0",
    moneda: "USD", tipoCambio: "1.000"
  }]
}

function mkDavItem(): DAVItemForm {
  return {
    id: uid(), nroItem: "", nandina: "", nroFactura: "", fechaFactura: "",
    cantidad: "", descComercial: "", tipoMercancia: "", clase: "-", modelo: "-",
    cuanti1: "-", cuanti2: "-", formatoPresentacion: "", material: "", uso: "",
    otrasCaract: "", paisOrigen: "CN", acuerdoComercial: "NA",
    anioFab: "", embalaje: "CT",
    fobItem: "", fleteItem: "0", cifItem: "", pesoNeto: "",
    ga_pct: "", montoGA: "0", ice_monto: "0", iva_monto: "0",
    moneda: "USD", tipoCambio: "1.000"
  }
}

function DAVForm() {
  const [s, setS] = useState<DAVFormState>(DAV_INIT)
  const [saved, setSaved] = useState(false)

  // Auto-calc: FOB suma de ítems, CIF = FOB + gastos
  const fobAuto = s.items.reduce((acc, i) => acc + (parseFloat(i.fobItem) || 0), 0)
  const cifAuto = fobAuto + (parseFloat(s.flete) || 0) + (parseFloat(s.seguro) || 0) + (parseFloat(s.otrosGastos) || 0)

  useEffect(() => {
    const handler = (e: Event) => { setS((e as CustomEvent<DAVFormState>).detail) }
    window.addEventListener("load-dav", handler)
    return () => window.removeEventListener("load-dav", handler)
  }, [])

  function set(k: keyof DAVFormState, v: string) { setS(p => ({ ...p, [k]: v })) }
  function setItemField(id: string, k: keyof DAVItemForm, v: string) {
    setS(p => ({ ...p, items: p.items.map(i => i.id === id ? { ...i, [k]: v } : i) }))
  }
  function setDavItemCalc(id: string, k: keyof DAVItemForm, v: string) {
    setS(p => ({ ...p, items: p.items.map(i => i.id === id ? calcDavItemAuto({ ...i, [k]: v }) : i) }))
  }
  useEffect(() => { _sharedDAV = s }, [s])
  function handleCargarDesdeDAM() {
    const src = _sharedDAM || _sharedDIM
    if (!src) return
    const mapped = damToDAV(src as DAMFormState)
    setS(p => ({ ...p, ...mapped }))
  }

  const validation = validateDAV(s)

  function handleExport() {
    if (!validation.ok) return
    const xml = buildDAVXml(s)
    downloadXml(xml, `DAV_${s.refDam || "borrador"}.xml`)
    saveDraft("DAV", s.refDam, s.refDam, s)
  }

  function handleSave() {
    saveDraft("DAV", s.refDam || `DAV-${new Date().toISOString().slice(0, 10)}`, s.refDam, s)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="mb-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 text-xs text-[#92400E]">
        La DAV es un formulario complementario al DAM/DIM. Se presenta cuando aduana solicita justificación del valor.
      </div>
      <ExportBar tipoDoc="DAV" validation={validation} onExport={handleExport} onSave={handleSave} saved={saved} />

      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={handleCargarDesdeDAM}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#0F2B5B] text-white hover:bg-[#1E3A6B] shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/>
          </svg>
          Cargar datos desde DAM / DIM activo
        </button>
        <span className="text-xs text-[#64748B]">Copia importador, vendedor, facturas e ítems del DAM o DIM abierto en la otra pestaña.</span>
      </div>

      <Section title="1. Referencia DAM/DIM">
        <Input label="N. Referencia DAM/DIM asociada" value={s.refDam} onChange={v => set("refDam", v)} required mono />
      </Section>

      <Section title="2. Datos del Importador">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Razón Social" value={s.importadorRazonSocial} onChange={v => set("importadorRazonSocial", v)} required className="col-span-2" />
          <Select label="Tipo Documento" value={s.importadorTipoDoc} onChange={v => set("importadorTipoDoc", v)} options={catToSel(TIPO_DOCUMENTO)} />
          <Input label="N. Documento" value={s.importadorNroDoc} onChange={v => set("importadorNroDoc", v)} required mono />
          <Input label="Calle/Avenida" value={s.importadorCalle} onChange={v => set("importadorCalle", v)} className="col-span-2" />
          <Input label="Ciudad" value={s.importadorCiudad} onChange={v => set("importadorCiudad", v)} />
          <Input label="Departamento (c83)" value={s.importadorDepartamento} onChange={v => set("importadorDepartamento", v)} placeholder="LP, CB, SC..." />
          <Select label="Pais" value={s.importadorPais} onChange={v => set("importadorPais", v)} options={catToSel(PAISES)} />
          <Input label="Teléfono" value={s.importadorTel} onChange={v => set("importadorTel", v)} />
          <Input label="Email" value={s.importadorEmail} onChange={v => set("importadorEmail", v)} type="email" />
        </div>
      </Section>

      <Section title="3. Datos del Vendedor">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Razón Social Vendedor" value={s.vendedorRazonSocial} onChange={v => set("vendedorRazonSocial", v)} required className="col-span-2" />
          <Select label="Condición Vendedor" value={s.vendedorCondicion} onChange={v => set("vendedorCondicion", v)} options={catToSel(CONDICION_VENDEDOR)} />
          <Select label="País Vendedor" value={s.vendedorPais} onChange={v => set("vendedorPais", v)} options={catToSel(PAISES)} />
          <Input label="Calle/Avenida" value={s.vendedorCalle} onChange={v => set("vendedorCalle", v)} className="col-span-2" />
          <Input label="Ciudad" value={s.vendedorCiudad} onChange={v => set("vendedorCiudad", v)} />
          <Input label="Teléfono" value={s.vendedorTel} onChange={v => set("vendedorTel", v)} />
          <Input label="Email" value={s.vendedorEmail} onChange={v => set("vendedorEmail", v)} type="email" />
        </div>
      </Section>

      <Section title="4. Factura y Condiciones de Transacción">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="N. Facturas" value={s.nroFacturas} onChange={v => set("nroFacturas", v)} />
          <Input label="N. Factura(s)" value={s.facturas} onChange={v => set("facturas", v)} className="col-span-3" placeholder="INV-001, INV-002..." />
          <Select label="Tipo de Venta" value={s.tipoVenta}
            onChange={v => set("tipoVenta", v)}
            options={[
              { value: "01", label: "01 - Compraventa precio firme" },
              { value: "02", label: "02 - Trueque" },
              { value: "03", label: "03 - Consignacion" },
              { value: "04", label: "04 - Sujeta a confirmacion" },
              { value: "99", label: "99 - Otra" },
            ]} />
          <Select label="Incoterms" value={s.incoterm} onChange={v => set("incoterm", v)} options={catToSel(INCOTERMS)} />
          <Input label="Lugar Incoterms" value={s.lugarIncoterm} onChange={v => set("lugarIncoterm", v)} />
          <Select label="Forma Pago" value={s.formaPago} onChange={v => set("formaPago", v)} options={catToSel(FORMAS_PAGO)} />
          <Select label="Medio Pago" value={s.medioPago} onChange={v => set("medioPago", v)} options={catToSel(MEDIOS_PAGO)} />
          <Input label="Comisiones/Corretajes USD" value={s.comisiones} onChange={v => set("comisiones", v)} type="number" />
          <div className="flex flex-col gap-1">
            <Input label="FOB Total USD" value={s.fobTotal} onChange={v => set("fobTotal", v)} type="number" required
              placeholder={fobAuto > 0 ? fobAuto.toFixed(2) : undefined} />
            {fobAuto > 0 && s.fobTotal !== fmt2(fobAuto) && (
              <button type="button" onClick={() => set("fobTotal", fmt2(fobAuto))}
                className="text-xs text-[#0D7A3E] hover:underline text-left">
                Usar suma ítems: {fmt2(fobAuto)}
              </button>
            )}
          </div>
          <Select label="Sujeto a Descuento"
            value={s.sujDescuento}
            onChange={v => set("sujDescuento", v)}
            options={[{ value: "0", label: "NO" }, { value: "1", label: "SI" }]} />
          <Select label="Restricciones"
            value={s.restricciones}
            onChange={v => set("restricciones", v)}
            options={[{ value: "0", label: "NO" }, { value: "1", label: "SI" }]} />
        </div>
      </Section>

      <Section title="5. Ajustes al Valor CIF">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Flete Total USD" value={s.flete} onChange={v => set("flete", v)} type="number" />
          <Input label="Seguro USD" value={s.seguro} onChange={v => set("seguro", v)} type="number" />
          <Input label="Otros Gastos USD" value={s.otrosGastos} onChange={v => set("otrosGastos", v)} type="number" />
          <div className="flex flex-col gap-1">
            <Input label="CIF Total USD" value={s.cifTotal} onChange={v => set("cifTotal", v)} type="number" required
              placeholder={cifAuto > 0 ? cifAuto.toFixed(2) : undefined} />
            {cifAuto > 0 && s.cifTotal !== fmt2(cifAuto) && (
              <button type="button" onClick={() => set("cifTotal", fmt2(cifAuto))}
                className="text-xs text-[#0D7A3E] hover:underline text-left">
                Usar FOB+Flete+Seguro: {fmt2(cifAuto)}
              </button>
            )}
          </div>
          <Select label="Aduana" value={s.aduana} onChange={v => set("aduana", v)} options={catToSel(ADUANAS)} />
        </div>
      </Section>

      <Section title="6. Vinculación Vendedor/Comprador" defaultOpen={false}>
        <div className="grid grid-cols-3 gap-4">
          <Select label="Existe vinculación entre comprador y vendedor"
            value={s.vinculacion} onChange={v => set("vinculacion", v)}
            options={[{ value: "0", label: "NO" }, { value: "1", label: "SI" }]} />
          <Select label="La vinculación influyó en el precio"
            value={s.vinculacionInfluye} onChange={v => set("vinculacionInfluye", v)}
            options={[{ value: "0", label: "NO" }, { value: "1", label: "SI" }]} />
          <Select label="El precio es aproximado a precio libre"
            value={s.vinculacionPrecioAprox} onChange={v => set("vinculacionPrecioAprox", v)}
            options={[{ value: "0", label: "NO" }, { value: "1", label: "SI" }]} />
        </div>
      </Section>

      <Section title={`7. Ítems de la DAV (${s.items.length} ítems)`}>
        {s.items.map((item, idx) => (
          <div key={item.id} className="border border-[#E2E8F0] rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#0F2B5B]">Ítem #{idx + 1}</span>
              {s.items.length > 1 && (
                <button type="button" onClick={() => setS(p => ({ ...p, items: p.items.filter(i => i.id !== item.id) }))}
                  className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#475569]">Subpartida (Nandina)*</label>
                <NandinaCell
                  value={item.nandina}
                  onChange={v => setItemField(item.id, "nandina", v)}
                  onSelect={r => setS(p => ({ ...p, items: p.items.map(i => i.id === item.id ? calcDavItemAuto({ ...i, nandina: r.codigo, ga_pct: String(r.ga_porcentaje) }) : i) }))}
                />
              </div>
              <Input label="N. Factura" value={item.nroFactura} onChange={v => setItemField(item.id, "nroFactura", v)} />
              <Input label="Fecha Factura" value={item.fechaFactura} onChange={v => setItemField(item.id, "fechaFactura", v)} type="date" />
              <Input label="Cantidad" value={item.cantidad} onChange={v => setItemField(item.id, "cantidad", v)} type="number" />
              <Input label="Desc. Comercial" value={item.descComercial} onChange={v => setItemField(item.id, "descComercial", v)} className="col-span-2" />
              <Input label="Nombre Mercancía (vendedor)" value={item.tipoMercancia} onChange={v => setItemField(item.id, "tipoMercancia", v)} />
              <Input label="Clase" value={item.clase} onChange={v => setItemField(item.id, "clase", v)} />
              <Input label="Modelo" value={item.modelo} onChange={v => setItemField(item.id, "modelo", v)} />
              <Input label="Cuanti1 (medida1)" value={item.cuanti1} onChange={v => setItemField(item.id, "cuanti1", v)} />
              <Input label="Cuanti2 (medida2)" value={item.cuanti2} onChange={v => setItemField(item.id, "cuanti2", v)} />
              <Input label="Formato/Presentación" value={item.formatoPresentacion} onChange={v => setItemField(item.id, "formatoPresentacion", v)} />
              <Input label="Material" value={item.material} onChange={v => setItemField(item.id, "material", v)} />
              <Input label="Uso/Aplicación" value={item.uso} onChange={v => setItemField(item.id, "uso", v)} />
              <Input label="Otras Características" value={item.otrasCaract} onChange={v => setItemField(item.id, "otrasCaract", v)} />
              <Select label="País Origen" value={item.paisOrigen} onChange={v => setItemField(item.id, "paisOrigen", v)} options={catToSel(PAISES)} />
              <Select label="Acuerdo Comercial" value={item.acuerdoComercial} onChange={v => setItemField(item.id, "acuerdoComercial", v)} options={catToSel(ACUERDO_COMERCIAL)} />
              <Select label="Embalaje" value={item.embalaje} onChange={v => setItemField(item.id, "embalaje", v)} options={catToSel(EMBALAJE)} />
              <Input label="Año Fabricación" value={item.anioFab} onChange={v => setItemField(item.id, "anioFab", v)} placeholder="YYYY" />
              <Input label="FOB Ítem USD" value={item.fobItem} onChange={v => setDavItemCalc(item.id, "fobItem", v)} type="number" />
              <Input label="Peso Neto Total (kg)" value={item.pesoNeto} onChange={v => setItemField(item.id, "pesoNeto", v)} type="number" />
              <Input label="GA %" value={item.ga_pct} onChange={v => setDavItemCalc(item.id, "ga_pct", v)} type="number" />
              <Input label="Monto GA" value={item.montoGA} onChange={v => setItemField(item.id, "montoGA", v)} type="number" />
              <Input label="Monto ICE" value={item.ice_monto} onChange={v => setItemField(item.id, "ice_monto", v)} type="number" />
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setS(p => ({ ...p, items: [...p.items, mkDavItem()] }))}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#1E6FD9] border border-[#1E6FD9] rounded-lg hover:bg-[#EFF6FF]">
          <Plus size={14} /> Agregar ítem
        </button>
      </Section>

      <Section title="8. Declarante / Representante">
        <div className="text-xs text-[#64748B] mb-3">
          Si el declarante es el mismo importador, los campos se autocompletan. Si es un despachante/agente, complete los datos del representante.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Nombre Declarante" value={s.declaranteNombre} onChange={v => set("declaranteNombre", v)} className="col-span-2"
            placeholder={s.importadorRazonSocial || "Nombre del declarante..."} />
          <Select label="Tipo Doc Declarante" value={s.declaranteTipoDoc} onChange={v => set("declaranteTipoDoc", v)} options={catToSel(TIPO_DOCUMENTO)} />
          <Input label="N. Documento" value={s.declaranteNroDoc} onChange={v => set("declaranteNroDoc", v)} mono
            placeholder={s.importadorNroDoc || ""} />
          <Input label="Departamento (LP/CB/SC...)" value={s.declaranteDepartamento} onChange={v => set("declaranteDepartamento", v)}
            placeholder={s.importadorDepartamento || "LP"} />
          <Input label="Calle/Avenida" value={s.declaranteCalle} onChange={v => set("declaranteCalle", v)} className="col-span-2"
            placeholder={s.importadorCalle || ""} />
          <Input label="Ciudad" value={s.declaranteCiudad} onChange={v => set("declaranteCiudad", v)}
            placeholder={s.importadorCiudad || ""} />
          <Input label="Teléfono" value={s.declaranteTel} onChange={v => set("declaranteTel", v)}
            placeholder={s.importadorTel || ""} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <Input label="Nombre Apoderado/Agente" value={s.apoderadoNombre} onChange={v => set("apoderadoNombre", v)} className="col-span-2" />
          <Input label="CI Apoderado" value={s.apoderadoCI} onChange={v => set("apoderadoCI", v)} mono />
          <Input label="Observaciones (c1340)" value={s.observaciones} onChange={v => set("observaciones", v)} className="col-span-4"
            placeholder="SE APLICA 2% DEL VALOR FOB A LA CASILLA 64 SEGUN ART.20 DEL RLGA" />
        </div>
      </Section>
    </div>
  )
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */

const TABS: { id: TipoDoc; label: string; color: string; desc: string }[] = [
  { id: "DAM", label: "DAM v2.11", color: "#0F2B5B", desc: "Declaración Aduanera de Mercancías - Importación" },
  { id: "DIM", label: "DIM v1.9", color: "#7C3AED", desc: "Declaración de Importación de Mercancías" },
  { id: "DEX", label: "DEX v1.0", color: "#0D7A3E", desc: "Declaración de Exportación" },
  { id: "DAV", label: "DAV v2.4", color: "#B45309", desc: "Declaración Andina de Valor - Complemento" },
]

export default function DeclaracionesPage() {
  const [tab, setTab] = useState<TipoDoc>("DAM")
  const [entityPanel, setEntityPanel] = useState(false)
  const [entityCount, setEntityCount] = useState(0)
  const [draftsPanel, setDraftsPanel] = useState(false)
  const [draftCount, setDraftCount] = useState(0)
  const active = TABS.find(t => t.id === tab)!

  useEffect(() => { setEntityCount(getStats().total) }, [entityPanel])

  useEffect(() => {
    const update = () => setDraftCount(getDraftCount())
    update()
    window.addEventListener("draft-saved", update)
    return () => window.removeEventListener("draft-saved", update)
  }, [])

  // switch tab automatically when a file is loaded from ANY tab
  useEffect(() => {
    const handlers: Record<string, () => void> = {
      "load-dam": () => setTab("DAM"),
      "load-dim": () => setTab("DIM"),
      "load-dex": () => setTab("DEX"),
      "load-dav": () => setTab("DAV"),
    }
    Object.entries(handlers).forEach(([ev, fn]) => window.addEventListener(ev, fn))
    return () => Object.entries(handlers).forEach(([ev, fn]) => window.removeEventListener(ev, fn))
  }, [])

  return (
    <div className="max-w-[1600px] mx-auto">
      <EntityPanel open={entityPanel} onClose={() => setEntityPanel(false)} />
      <DraftsPanel open={draftsPanel} onClose={() => setDraftsPanel(false)} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Declaraciones Aduaneras</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Generador compatible con SUMA · Aduana Nacional de Bolivia
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setDraftsPanel(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#475569] border border-[#E2E8F0] rounded-xl hover:bg-[#F1F5F9] transition-colors">
            <FolderOpen size={16} className="text-[#7C3AED]" />
            Historial
            {draftCount > 0 && <span className="bg-[#7C3AED] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{draftCount}</span>}
          </button>
          <button type="button" onClick={() => setEntityPanel(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#475569] border border-[#E2E8F0] rounded-xl hover:bg-[#F1F5F9] transition-colors">
            <Users size={16} className="text-[#1E6FD9]" />
            Directorio
            {entityCount > 0 && <span className="bg-[#1E6FD9] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{entityCount}</span>}
          </button>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${tab === t.id ? "text-white border-transparent shadow-lg" : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]"}`}
            style={{ background: tab === t.id ? t.color : undefined }}>
            <div className="text-left">
              <div>{t.label}</div>
              <div className={`text-[10px] font-normal mt-0.5 ${tab === t.id ? "text-white/70" : "text-[#94A3B8]"}`}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        {tab === "DAM" && <DAMForm />}
        {tab === "DIM" && <DIMForm />}
        {tab === "DEX" && <DEXForm />}
        {tab === "DAV" && <DAVForm />}
      </div>
    </div>
  )
}
