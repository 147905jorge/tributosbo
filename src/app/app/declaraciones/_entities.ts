// Entity database: importadores, exportadores, proveedores, consignatarios
// Persiste en localStorage + sincroniza con Oracle ARM backend

import type { EntityData } from "./_parse"
import { apiFetch } from "@/lib/api"

export type Entity = EntityData & { updatedAt: string }

const LOCAL_KEY = "tributosbo_entities_v2"

/* ── localStorage CRUD ─────────────────────────────────────────────────── */

export function loadAll(): Entity[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") } catch { return [] }
}

function saveAll(list: Entity[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
}

export function upsertLocal(e: EntityData): Entity {
  const all = loadAll()
  const entry: Entity = { ...e, updatedAt: new Date().toISOString() }
  const idx = all.findIndex(x => x.nit && x.nit === e.nit && x.tipo === e.tipo)
  if (idx >= 0) {
    // merge: keep existing fields, overwrite non-empty incoming fields
    all[idx] = { ...all[idx], ...Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== "" && v != null)), updatedAt: entry.updatedAt }
  } else {
    all.push(entry)
  }
  saveAll(all)
  return all[idx >= 0 ? idx : all.length - 1]
}

export function findByNit(nit: string, tipo?: Entity["tipo"]): Entity | null {
  if (!nit) return null
  const all = loadAll()
  return all.find(e => e.nit === nit && (!tipo || e.tipo === tipo)) ?? null
}

export function searchLocal(q: string, tipo?: Entity["tipo"]): Entity[] {
  if (!q || q.length < 2) return []
  const lq = q.toLowerCase()
  return loadAll()
    .filter(e => (!tipo || e.tipo === tipo) && (e.nit?.includes(q) || e.razonSocial?.toLowerCase().includes(lq)))
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 8)
}

export function deleteEntity(nit: string, tipo: Entity["tipo"]) {
  saveAll(loadAll().filter(e => !(e.nit === nit && e.tipo === tipo)))
}

/* ── backend sync (fire-and-forget, non-blocking) ─────────────────────── */

export async function pushToBackend(e: Entity): Promise<void> {
  try {
    await apiFetch("/entities", { method: "POST", body: JSON.stringify(e) })
  } catch { /* silent */ }
}

export async function fetchFromBackend(nit: string): Promise<Entity | null> {
  try {
    const data = await apiFetch(`/entities/${encodeURIComponent(nit)}`)
    if (data?.nit) { upsertLocal(data); return data as Entity }
  } catch { /* silent */ }
  return null
}

export async function searchBackend(q: string, tipo?: Entity["tipo"]): Promise<Entity[]> {
  try {
    const params = new URLSearchParams({ q })
    if (tipo) params.set("tipo", tipo)
    const list: Entity[] = await apiFetch(`/entities/search?${params}`)
    list.forEach(upsertLocal)
    return list
  } catch { return [] }
}

/* ── bulk upsert from parsed file ───────────────────────────────────────── */

export function bulkUpsert(entities: EntityData[]): number {
  let saved = 0
  for (const e of entities) {
    if ((e.nit || e.razonSocial) && e.razonSocial !== "") {
      const entry = upsertLocal(e)
      pushToBackend(entry)
      saved++
    }
  }
  return saved
}

/* ── entity stats ───────────────────────────────────────────────────────── */

export function getStats() {
  const all = loadAll()
  return {
    total: all.length,
    importadores: all.filter(e => e.tipo === "importador").length,
    exportadores: all.filter(e => e.tipo === "exportador").length,
    proveedores: all.filter(e => e.tipo === "proveedor").length,
    consignatarios: all.filter(e => e.tipo === "consignatario").length,
  }
}

/* ── export/import backup ───────────────────────────────────────────────── */

export function exportBackup(): string {
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), entities: loadAll() }, null, 2)
}

export function importBackup(json: string): { imported: number; errors: string[] } {
  const errors: string[] = []
  let imported = 0
  try {
    const data = JSON.parse(json)
    const list: EntityData[] = data?.entities ?? (Array.isArray(data) ? data : [])
    for (const e of list) {
      if (e.tipo && (e.nit || e.razonSocial)) {
        upsertLocal(e)
        imported++
      } else {
        errors.push(`Entidad invalida: ${JSON.stringify(e).slice(0, 60)}`)
      }
    }
  } catch (err) {
    errors.push(`JSON invalido: ${String(err)}`)
  }
  return { imported, errors }
}
