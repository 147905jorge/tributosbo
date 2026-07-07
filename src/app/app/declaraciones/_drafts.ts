import type { TipoDoc, DAMFormState, DIMFormState, DEXFormState, DAVFormState } from "./_types"

const DRAFTS_KEY = "tributosbo_drafts_v2"
const MAX_PER_TYPE = 15

export type DraftData = DAMFormState | DIMFormState | DEXFormState | DAVFormState

export interface Draft {
  id: string
  tipo: TipoDoc
  nombre: string
  ref: string
  fecha: string
  data: DraftData
}

function loadAll(): Draft[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) ?? "[]") } catch { return [] }
}

function saveAll(list: Draft[]) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(list))
}

export function saveDraft(tipo: TipoDoc, nombre: string, ref: string, data: DraftData): void {
  const all = loadAll()
  const draft: Draft = {
    id: Math.random().toString(36).slice(2, 9),
    tipo,
    nombre: nombre || ref || tipo,
    ref: ref || "",
    fecha: new Date().toISOString(),
    data,
  }
  const sameType = [draft, ...all.filter(d => d.tipo === tipo)].slice(0, MAX_PER_TYPE)
  const others = all.filter(d => d.tipo !== tipo)
  saveAll([...sameType, ...others])
  if (typeof window !== "undefined") window.dispatchEvent(new Event("draft-saved"))
}

export function getDrafts(tipo?: TipoDoc): Draft[] {
  const all = loadAll()
  return (tipo ? all.filter(d => d.tipo === tipo) : all)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function deleteDraft(id: string): void {
  saveAll(loadAll().filter(d => d.id !== id))
}

export function getDraftCount(): number {
  return loadAll().length
}
