"use client"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { setToken } from "@/lib/auth"
import DeclaracionesPage from "@/app/app/declaraciones/page"

function EmbedContent() {
  const params = useSearchParams()
  const key = params.get("key") ?? ""
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!key) {
      setError("API key requerida en el parametro ?key=")
      return
    }
    fetch("/api/tb/embed/token", {
      headers: { "x-api-key": key },
    })
      .then(r => r.json())
      .then(data => {
        if (data.access_token) {
          setToken(data.access_token)
          setReady(true)
        } else {
          setError(data.detail || "API key invalida")
        }
      })
      .catch(() => setError("Error de conexion con el servidor"))
  }, [key])

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Cargando modulo...</span>
        </div>
      </div>
    )
  }

  return <DeclaracionesPage />
}

export default function EmbedDeclaracionesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
          Cargando...
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  )
}
