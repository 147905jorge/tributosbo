"use client"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, BookOpen, AlertCircle, Sparkles } from "lucide-react"
import { api } from "@/lib/api"

type Mensaje = {
  rol: "user" | "bot"
  texto: string
  fuentes?: string[]
  error?: boolean
}

const SUGERENCIAS = [
  "¿Cómo calculo los tributos para una importación definitiva?",
  "¿Qué documentos necesito para importar electrónicos?",
  "¿Cuáles son los requisitos de descripciones mínimas para textiles?",
  "¿Qué es el canal rojo y cuándo se asigna?",
  "¿Cómo funciona el régimen RITEX?",
  "¿Qué preferencias arancelarias tiene Bolivia con la CAN?",
  "¿Cuál es el plazo máximo para el depósito aduanero?",
  "¿Cómo se calcula el valor CIF cuando no hay seguro?",
]

export default function BotPage() {
  const [mensajes,  setMensajes]  = useState<Mensaje[]>([])
  const [input,     setInput]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  async function enviar(texto = input.trim()) {
    if (!texto || loading) return
    setInput("")
    setMensajes(prev => [...prev, { rol: "user", texto }])
    setLoading(true)
    try {
      const r = await api.post("/bot/pregunta", { pregunta: texto })
      setMensajes(prev => [...prev, {
        rol: "bot",
        texto: r.respuesta,
        fuentes: r.fuentes || []
      }])
    } catch (e: unknown) {
      setMensajes(prev => [...prev, {
        rol: "bot",
        texto: "Error al consultar el asistente. Intenta nuevamente.",
        error: true
      }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const esVacio = mensajes.length === 0

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-120px)]">

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: "linear-gradient(135deg, #0F2B5B, #1E6FD9)" }}>
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0F2B5B] flex items-center gap-2">
            ADEX <span className="text-xs font-normal bg-[#EFF6FF] text-[#1E6FD9] border border-[#BFDBFE] px-2 py-0.5 rounded-full">Asistente Aduanero</span>
          </h1>
          <p className="text-xs text-[#94A3B8]">Perito digital en normativa aduanera boliviana</p>
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-4 mb-4">

        {/* Estado vacío */}
        {esVacio && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #0F2B5B, #1E6FD9)" }}>
              <Sparkles size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#0F2B5B] mb-2">Consulta cualquier tema aduanero</h2>
            <p className="text-sm text-[#475569] max-w-md mb-6">
              Basado en Ley 1990, DS 25870, regímenes, tributos, SENASAG, acuerdos comerciales y toda la normativa vigente de Bolivia.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {SUGERENCIAS.map(s => (
                <button key={s} onClick={() => enviar(s)}
                  className="text-left px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#475569] hover:border-[#1E6FD9] hover:text-[#0F2B5B] transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
            {m.rol === "bot" && (
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                   style={{ background: "linear-gradient(135deg, #0F2B5B, #1E6FD9)" }}>
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[78%] ${m.rol === "user" ? "order-first" : ""}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.rol === "user"
                  ? "bg-[#0F2B5B] text-white rounded-tr-sm"
                  : m.error
                  ? "bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] rounded-tl-sm"
                  : "bg-white border border-[#E2E8F0] text-[#0F2B5B] rounded-tl-sm"
              }`}>
                {m.texto}
              </div>
              {m.fuentes && m.fuentes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.fuentes.map(f => (
                    <span key={f} className="flex items-center gap-1 text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                      <BookOpen size={9} /> {f.length > 50 ? f.substring(0, 50) + "..." : f}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {m.rol === "user" && (
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#E2E8F0] mt-0.5">
                <User size={14} className="text-[#475569]" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #0F2B5B, #1E6FD9)" }}>
              <Bot size={14} className="text-white" />
            </div>
            <div className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3 flex gap-3 items-end">
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey} rows={1} placeholder="Consulta sobre procedimientos, requisitos, normativa aduanera..."
          className="flex-1 resize-none text-sm text-[#0F2B5B] placeholder-[#94A3B8] focus:outline-none max-h-32 leading-relaxed"
          style={{ minHeight: "24px" }} />
        <button onClick={() => enviar()} disabled={!input.trim() || loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #0F2B5B, #1E6FD9)" }}>
          {loading
            ? <Loader2 size={15} className="text-white animate-spin" />
            : <Send size={15} className="text-white" />
          }
        </button>
      </div>

      <p className="text-center text-[10px] text-[#94A3B8] mt-2">
        ADEX responde basado en normativa boliviana vigente. Verifica siempre con la Aduana Nacional ante casos específicos.
      </p>
    </div>
  )
}
