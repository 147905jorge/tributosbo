import { NextResponse } from "next/server"

export const revalidate = 1800 // cache 30 min

export async function GET() {
  try {
    const res = await fetch(
      "https://www.bcb.gob.bo/librerias/tipo_cambio/index.php",
      { signal: AbortSignal.timeout(6000), cache: "no-store" }
    )
    const html = await res.text()
    // BCB muestra el TC en tablas HTML — buscamos el primer valor numérico tipo 6.xx o 7.xx
    const match = html.match(/\b([67]\.\d{2,4})\b/)
    if (match) {
      const tc = parseFloat(match[1])
      if (tc > 5 && tc < 15) return NextResponse.json({ tc, fuente: "BCB" })
    }
    throw new Error("no encontrado en HTML")
  } catch {
    // Fallback: tipo de cambio oficial conocido
    return NextResponse.json({ tc: 6.97, fuente: "fijo" })
  }
}
