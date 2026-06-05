"use client"
import { useState } from "react"
import { MessageCircle, Wifi, WifiOff, RefreshCw, Send, Bell, Check, Plus, Trash2, Eye } from "lucide-react"

type Alerta = {
  id: string; cliente: string; telefono: string; dim: string
  canal: string; mensaje: string; enviado: string; estado: "enviado" | "error" | "pendiente"
}

const ALERTAS: Alerta[] = [
  { id:"1", cliente:"Logística Global S.A.",     telefono:"+59172030001", dim:"DIM-2024-8842", canal:"VERDE",    mensaje:"Su trámite DIM-2024-8842 fue asignado al Canal Verde. Ya puede proceder con el levante.",    enviado:"06/12/2024 14:35", estado:"enviado"  },
  { id:"2", cliente:"Importaciones El Roble",    telefono:"+59172030002", dim:"DIM-2024-5542", canal:"ROJO",     mensaje:"Su trámite DIM-2024-5542 fue asignado al Canal Rojo. Se requiere aforo físico.",             enviado:"06/12/2024 10:12", estado:"enviado"  },
  { id:"3", cliente:"Textiles Andinos Ltda.",    telefono:"+59172030003", dim:"DIM-2024-3112", canal:"AMARILLO", mensaje:"Su trámite DIM-2024-3112 requiere revisión documental. Por favor contactarse con la agencia.", enviado:"05/12/2024 16:25", estado:"error"    },
  { id:"4", cliente:"AgroIndustria Sur S.A.",    telefono:"+59172030004", dim:"EXP-2024-1120", canal:"VERDE",    mensaje:"Su exportación EXP-2024-1120 ha sido levantada exitosamente.",                              enviado:"05/12/2024 18:05", estado:"enviado"  },
  { id:"5", cliente:"Maquinaria Andina S.R.L.",  telefono:"+59172030005", dim:"DIM-2024-0891", canal:"—",        mensaje:"Notificación de pago de tributos pendiente para su trámite.",                               enviado:"—",                estado:"pendiente"},
]

const PLANTILLAS = [
  { id:"canal_verde",    titulo:"Canal Verde asignado",      texto:"Estimado/a {nombre}, su trámite {dim} fue asignado al Canal Verde. Ya puede proceder con el levante de su mercadería. Cualquier consulta estamos a su disposición." },
  { id:"canal_rojo",    titulo:"Canal Rojo — Aforo físico",  texto:"Estimado/a {nombre}, su trámite {dim} fue asignado al Canal Rojo. Se programará un aforo físico. Le comunicaremos la fecha y hora. Disculpe los inconvenientes." },
  { id:"canal_amarillo",titulo:"Canal Amarillo — Revisión",  texto:"Estimado/a {nombre}, su trámite {dim} requiere revisión documental adicional. Por favor contáctese con nuestra agencia a la brevedad." },
  { id:"levantado",     titulo:"Mercadería levantada",       texto:"Estimado/a {nombre}, nos complace informarle que su mercadería del trámite {dim} ha sido levantada exitosamente. Gracias por confiar en nosotros." },
  { id:"cotizacion",    titulo:"Cotización enviada",         texto:"Estimado/a {nombre}, le enviamos adjunto la cotización de servicios para su importación. Quedamos atentos a su confirmación." },
]

const ESTADO_COLOR = { enviado: "#0D7A3E", error: "#B91C1C", pendiente: "#D97706" }
const ESTADO_BG    = { enviado: "#F0FDF4", error: "#FEF2F2", pendiente: "#FFFBEB" }
const CANAL_COLOR  = { VERDE: "#0D7A3E", ROJO: "#B91C1C", AMARILLO: "#D97706" }

export default function AlertasPage() {
  const [waStatus, setWaStatus] = useState<"desconectado"|"conectado">("conectado")
  const [tab,      setTab]      = useState<"historial"|"enviar"|"plantillas">("historial")
  const [plantilla,setPlantilla]= useState(PLANTILLAS[0].id)
  const [cliente,  setCliente]  = useState("")
  const [telefono, setTelefono] = useState("")
  const [dim,      setDim]      = useState("")
  const [preview,  setPreview]  = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado,  setEnviado]  = useState(false)

  const plantillaActual = PLANTILLAS.find(p => p.id === plantilla)!
  const mensajePreview  = plantillaActual.texto
    .replace("{nombre}", cliente || "Cliente")
    .replace("{dim}",    dim     || "DIM-XXXX")

  function enviar() {
    setEnviando(true)
    setTimeout(() => { setEnviando(false); setEnviado(true); setTimeout(() => setEnviado(false), 3000) }, 1500)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Alertas WhatsApp</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Notifica a tus clientes automáticamente sobre el estado de sus trámites</p>
        </div>
        {/* Estado WA */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
             style={{ background: waStatus === "conectado" ? "#F0FDF4" : "#FEF2F2", borderColor: waStatus === "conectado" ? "#BBF7D0" : "#FECACA" }}>
          {waStatus === "conectado"
            ? <><Wifi size={14} style={{ color: "#0D7A3E" }} /><span className="text-xs font-semibold text-[#0D7A3E]">WA conectado</span></>
            : <><WifiOff size={14} style={{ color: "#B91C1C" }} /><span className="text-xs font-semibold text-[#B91C1C]">WA desconectado</span></>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Enviados hoy",      value: ALERTAS.filter(a => a.estado === "enviado").length,   color: "#0D7A3E", bg: "#F0FDF4" },
          { label: "Con error",         value: ALERTAS.filter(a => a.estado === "error").length,     color: "#B91C1C", bg: "#FEF2F2" },
          { label: "Pendientes",        value: ALERTAS.filter(a => a.estado === "pendiente").length, color: "#D97706", bg: "#FFFBEB" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border" style={{ background: s.bg, borderColor: s.bg }}>
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
        {([
          { id: "historial",   label: "Historial" },
          { id: "enviar",      label: "Enviar mensaje" },
          { id: "plantillas",  label: "Plantillas" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: tab === t.id ? "#fff" : "transparent", color: tab === t.id ? "#0F2B5B" : "#94A3B8", boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── HISTORIAL ── */}
      {tab === "historial" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#F1F5F9]">
            {ALERTAS.map(a => (
              <div key={a.id} className="px-5 py-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: ESTADO_BG[a.estado] }}>
                  {a.estado === "enviado"
                    ? <Check size={14} style={{ color: ESTADO_COLOR[a.estado] }} />
                    : a.estado === "error"
                    ? <span style={{ color: ESTADO_COLOR[a.estado], fontSize: 14, fontWeight: 800 }}>!</span>
                    : <RefreshCw size={12} style={{ color: ESTADO_COLOR[a.estado] }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0F2B5B]">{a.cliente}</span>
                      {a.canal !== "—" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: CANAL_COLOR[a.canal as keyof typeof CANAL_COLOR] || "#475569" }}>
                          {a.canal}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: ESTADO_BG[a.estado], color: ESTADO_COLOR[a.estado] }}>
                      {a.estado}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed truncate">{a.mensaje}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#94A3B8]">
                    <span>{a.telefono}</span>
                    <span>·</span>
                    <span>{a.dim}</span>
                    <span>·</span>
                    <span>{a.enviado}</span>
                  </div>
                </div>
                {a.estado === "error" && (
                  <button className="text-xs text-[#1E6FD9] font-medium hover:underline flex-shrink-0">Reintentar</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENVIAR ── */}
      {tab === "enviar" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Datos del destinatario</h3>
              {[
                { label: "Nombre del cliente", value: cliente,  set: setCliente,  placeholder: "Juan Pérez"      },
                { label: "Número WhatsApp",    value: telefono, set: setTelefono, placeholder: "+59172000000"    },
                { label: "Nº DIM / trámite",   value: dim,      set: setDim,      placeholder: "DIM-2024-XXXX"  },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none" />
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <label className="text-xs font-medium text-[#475569] block mb-1.5">Plantilla de mensaje</label>
              <select value={plantilla} onChange={e => setPlantilla(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none bg-white">
                {PLANTILLAS.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPreview(!preview)}
                className="flex items-center justify-center gap-2 border border-[#E2E8F0] text-[#0F2B5B] text-sm font-medium py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
                <Eye size={15} /> Vista previa
              </button>
              <button onClick={enviar} disabled={enviando || enviado || !telefono}
                className="flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                style={{ background: enviado ? "#0D7A3E" : "#1E6FD9" }}>
                {enviando ? <RefreshCw size={15} className="animate-spin" /> : enviado ? <><Check size={15} /> Enviado</> : <><Send size={15} /> Enviar</>}
              </button>
            </div>
          </div>

          {/* Preview del mensaje */}
          <div>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Vista previa del mensaje</p>
            <div className="bg-[#ECE5DD] rounded-2xl p-4 min-h-[300px]">
              <div className="bg-[#0F2B5B] text-white px-4 py-3 rounded-t-xl flex items-center gap-3 -mx-4 -mt-4 mb-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0F2B5B] text-xs font-bold">TB</div>
                <div>
                  <div className="text-sm font-semibold">Agencia Demo</div>
                  <div className="text-[10px] text-[#93C5FD]">en línea</div>
                </div>
              </div>
              <div className="bg-white rounded-xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm">
                <p className="text-sm text-[#111] leading-relaxed">{mensajePreview}</p>
                <p className="text-[10px] text-[#94A3B8] text-right mt-2">
                  {new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })} ✓✓
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PLANTILLAS ── */}
      {tab === "plantillas" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 text-sm font-medium text-[#1E6FD9] hover:text-[#1558B0] transition-colors">
              <Plus size={14} /> Nueva plantilla
            </button>
          </div>
          {PLANTILLAS.map(p => (
            <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F2B5B]">{p.titulo}</h3>
                  <span className="text-[10px] font-mono text-[#94A3B8]">{p.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-[#94A3B8] hover:text-[#1E6FD9] transition-colors"><Eye size={15} /></button>
                  <button className="text-[#94A3B8] hover:text-[#B91C1C] transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] rounded-lg p-3">{p.texto}</p>
              <div className="flex items-center gap-2 mt-3">
                {["{nombre}", "{dim}"].map(v => (
                  <span key={v} className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#EFF6FF] text-[#1E6FD9] rounded-full">{v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
