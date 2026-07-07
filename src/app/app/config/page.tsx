"use client"
import { useState, useRef } from "react"
import { Upload, Check, Wifi, WifiOff, RefreshCw, Save, MessageCircle, Palette, Building, Bell } from "lucide-react"
import { api } from "@/lib/api"
import { getUser, setUser } from "@/lib/auth"

const TABS = ["Identidad", "Documentos", "WhatsApp", "Notificaciones"] as const
type Tab = typeof TABS[number]

export default function ConfigPage() {
  const user = getUser()
  const [tab,        setTab]        = useState<Tab>("Identidad")
  const [saved,      setSaved]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [errSave,    setErrSave]    = useState("")
  const [waStatus,   setWaStatus]   = useState<"desconectado" | "conectando" | "conectado">("desconectado")
  const [showQr,     setShowQr]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Config state — carga desde el usuario actual
  const [empresa,   setEmpresa]   = useState(user?.empresa    || "Mi Agencia")
  const [tagline,   setTagline]   = useState("Despachantes de Aduana")
  const [color,     setColor]     = useState(user?.color_prim  || "#0F2B5B")
  const [acento,    setAcento]    = useState(user?.color_acento|| "#1E6FD9")
  const [logoName,  setLogoName]  = useState("")
  const [logoUrl,   setLogoUrl]   = useState<string>(user?.logo_url || "")
  const [registro,  setRegistro]  = useState("DA-2024-001234")
  const [telefono,  setTelefono]  = useState("+591 2 2345678")
  const [email,     setEmail]     = useState(user?.email       || "contacto@agencia.com")
  const [ciudad,    setCiudad]    = useState("La Paz, Bolivia")
  const [plantilla,   setPlantilla]   = useState("Estimado {nombre}, tu trámite {dim} está en canal {canal}.")
  const [openwaKey,   setOpenwaKey]   = useState("")
  const [openwaSaved, setOpenwaSaved] = useState(false)

  async function guardar() {
    setSaving(true); setErrSave("")
    try {
      const body: Record<string, string> = {
        nombre: empresa, color_prim: color, color_acento: acento,
        tagline, registro, telefono_contacto: telefono, ciudad
      }
      if (logoUrl) body.logo_url = logoUrl
      await api.patch("/empresa/config", body)
      if (user) setUser({ ...user, empresa, color_prim: color, color_acento: acento, logo_url: logoUrl || user.logo_url })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) {
      setErrSave(e instanceof Error ? e.message : "Error al guardar")
    }
    setSaving(false)
  }

  async function guardarOpenwaKey() {
    if (!openwaKey.trim()) return
    try {
      await api.patch("/empresa/config", { openwa_key: openwaKey })
      setOpenwaSaved(true)
      setOpenwaKey("")
      setTimeout(() => setOpenwaSaved(false), 3000)
    } catch { /* silencioso */ }
  }

  function simularConexionWa() {
    setWaStatus("conectando")
    setShowQr(true)
    setTimeout(() => { setWaStatus("conectado"); setShowQr(false) }, 4000)
  }

  const TAB_ICONS: Record<Tab, React.ElementType> = {
    Identidad:       Palette,
    Documentos:      Building,
    WhatsApp:        MessageCircle,
    Notificaciones:  Bell,
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Configuración</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Personaliza la identidad y las integraciones de tu agencia</p>
        </div>
        <button onClick={guardar}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: saved ? "#0D7A3E" : "#1E6FD9", color: "#fff" }}>
          {saved ? <><Check size={15} /> Guardado</> : <><Save size={15} /> Guardar cambios</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t]
          return (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F2B5B" : "#94A3B8", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              <Icon size={14} /> <span className="hidden sm:inline">{t}</span>
            </button>
          )
        })}
      </div>

      {/* ── TAB: IDENTIDAD ── */}
      {tab === "Identidad" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">

            {/* Logo */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Logo de la agencia</h3>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 2 * 1024 * 1024) { alert("El archivo supera 2MB"); return }
                  setLogoName(file.name)
                  const reader = new FileReader()
                  reader.onload = () => setLogoUrl(reader.result as string)
                  reader.readAsDataURL(file)
                }} />
              <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-8 text-center cursor-pointer hover:border-[#1E6FD9] transition-colors"
                   onClick={() => fileRef.current?.click()}>
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-2 object-contain" />
                  : <Upload size={28} className="text-[#94A3B8] mx-auto mb-3" />
                }
                {logoName
                  ? <p className="text-sm font-medium text-[#0D7A3E]">{logoName}</p>
                  : <>
                      <p className="text-sm font-medium text-[#475569]">Haz clic o arrastra tu logo aquí</p>
                      <p className="text-xs text-[#94A3B8] mt-1">PNG, SVG o JPG — máximo 2MB, fondo transparente recomendado</p>
                    </>
                }
              </div>
            </div>

            {/* Datos */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-[#0F2B5B] text-sm">Datos de la empresa</h3>
              {[
                { label: "Nombre de la empresa", value: empresa, set: setEmpresa },
                { label: "Tagline / especialidad", value: tagline, set: setTagline },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
                </div>
              ))}
            </div>

            {/* Colores */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Colores corporativos</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Color primario",  value: color,  set: setColor,  desc: "Sidebar y encabezados" },
                  { label: "Color de acento", value: acento, set: setAcento, desc: "Botones y links" },
                ].map(c => (
                  <div key={c.label}>
                    <label className="text-xs font-medium text-[#475569] block mb-1.5">{c.label}</label>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input type="color" value={c.value} onChange={e => c.set(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-[#E2E8F0] cursor-pointer p-0.5" />
                      </div>
                      <div>
                        <div className="text-sm font-mono font-medium text-[#0F2B5B]">{c.value.toUpperCase()}</div>
                        <div className="text-xs text-[#94A3B8]">{c.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">Vista previa</p>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
                {/* Mini sidebar */}
                <div style={{ background: color }} className="p-3">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center overflow-hidden text-[10px] font-bold" style={{ color }}>
                      {logoUrl
                        ? <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                        : empresa.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
                      }
                    </div>
                    <span className="text-white text-xs font-semibold truncate">{empresa}</span>
                  </div>
                  {["Dashboard","NANDINA","Calculadora","Trámites"].map((item, i) => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-xs"
                         style={{ background: i === 0 ? acento : "transparent", color: i === 0 ? "#fff" : "rgba(255,255,255,0.6)" }}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Mini content */}
                <div className="p-3">
                  <div className="text-[10px] font-bold text-[#0F2B5B] mb-2">{tagline}</div>
                  <div className="flex gap-2 mb-3">
                    {["GA: 10%","IVA: 14.94%"].map(b => (
                      <span key={b} className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: acento }}>{b}</span>
                    ))}
                  </div>
                  <div className="text-[10px] font-semibold text-white text-center py-2 rounded-lg" style={{ background: color }}>
                    Botón principal
                  </div>
                </div>
              </div>
              <p className="text-xs text-[#94A3B8] mt-3 text-center">Así verán tus clientes la interfaz</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DOCUMENTOS ── */}
      {tab === "Documentos" && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-[#0F2B5B] text-sm">Datos para planillas y cotizaciones</h3>
            {[
              { label: "Registro de despachante", value: registro, set: setRegistro },
              { label: "Teléfono de contacto",    value: telefono, set: setTelefono },
              { label: "Correo de contacto",      value: email,    set: setEmail    },
              { label: "Ciudad / dirección",      value: ciudad,   set: setCiudad   },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-[#475569] block mb-1.5">{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors" />
              </div>
            ))}
          </div>

          {/* Preview PDF header */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Vista previa del encabezado de planillas</h3>
            <div className="border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4 mb-4">
                <div>
                  <div className="text-lg font-bold text-[#0F2B5B]">{empresa}</div>
                  <div className="text-sm text-[#475569]">{tagline}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">Reg. {registro}</div>
                </div>
                <div className="text-right text-xs text-[#94A3B8] space-y-0.5">
                  <div>{telefono}</div>
                  <div>{email}</div>
                  <div>{ciudad}</div>
                </div>
              </div>
              <div className="text-[10px] text-[#94A3B8] text-center">COTIZACIÓN · Nº 00123 · {new Date().toLocaleDateString("es-BO")}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WHATSAPP ── */}
      {tab === "WhatsApp" && (
        <div className="space-y-5">
          {/* Estado conexión */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F2B5B] text-sm mb-4">Estado de la conexión</h3>
            <div className="flex items-center justify-between p-4 rounded-xl"
                 style={{ background: waStatus === "conectado" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${waStatus === "conectado" ? "#BBF7D0" : "#FECACA"}` }}>
              <div className="flex items-center gap-3">
                {waStatus === "conectado"
                  ? <Wifi size={20} style={{ color: "#0D7A3E" }} />
                  : waStatus === "conectando"
                  ? <RefreshCw size={20} className="animate-spin" style={{ color: "#1E6FD9" }} />
                  : <WifiOff size={20} style={{ color: "#B91C1C" }} />
                }
                <div>
                  <div className="text-sm font-semibold" style={{ color: waStatus === "conectado" ? "#0D7A3E" : "#B91C1C" }}>
                    {waStatus === "conectado" ? "WhatsApp conectado" : waStatus === "conectando" ? "Esperando QR..." : "WhatsApp desconectado"}
                  </div>
                  <div className="text-xs text-[#94A3B8]">
                    {waStatus === "conectado" ? "Notificaciones activas" : "Escanea el QR para conectar"}
                  </div>
                </div>
              </div>
              {waStatus !== "conectado" && (
                <button onClick={simularConexionWa}
                  className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ background: "#0D7A3E" }}>
                  {waStatus === "conectando" ? "Conectando..." : "Conectar"}
                </button>
              )}
            </div>

            {/* QR simulado */}
            {showQr && (
              <div className="mt-4 text-center">
                <p className="text-xs text-[#475569] mb-3">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo → Escanea este código</p>
                <div className="inline-block p-4 bg-white border-2 border-[#E2E8F0] rounded-xl">
                  <div style={{ width: 160, height: 160, background: "repeating-conic-gradient(#0F2B5B 0% 25%, #fff 0% 50%) 0 0/20px 20px", imageRendering: "pixelated", borderRadius: 4 }} />
                </div>
                <p className="text-xs text-[#94A3B8] mt-2">El código expira en 60 segundos</p>
              </div>
            )}
          </div>

          {/* API Key OpenWA */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F2B5B] text-sm mb-1">Envío automático (OpenWA)</h3>
            <p className="text-xs text-[#94A3B8] mb-3">
              Sin API key, las alertas se abren como enlace wa.me. Con API key, se envían automáticamente sin intervención.
            </p>
            <div className="flex gap-2">
              <input type="password" value={openwaKey} onChange={e => setOpenwaKey(e.target.value)}
                placeholder="Ingresa tu API key de OpenWA..."
                className="flex-1 px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors font-mono" />
              <button onClick={guardarOpenwaKey} disabled={!openwaKey.trim()}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                style={{ background: openwaSaved ? "#0D7A3E" : "#1E6FD9" }}>
                {openwaSaved ? <><Check size={14} className="inline mr-1" />Guardado</> : "Guardar"}
              </button>
            </div>
            <p className="text-xs text-[#94A3B8] mt-2">
              La clave se almacena cifrada. Requiere instancia de OpenWA corriendo en el servidor.
            </p>
          </div>

          {/* Plantillas */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F2B5B] text-sm mb-2">Plantilla de notificación</h3>
            <p className="text-xs text-[#94A3B8] mb-3">Variables disponibles: {"{nombre}"}, {"{dim}"}, {"{canal}"}, {"{aduana}"}</p>
            <textarea value={plantilla} onChange={e => setPlantilla(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F2B5B] focus:border-[#1E6FD9] focus:outline-none transition-colors resize-none" />
            <div className="mt-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#0D7A3E] mb-1">Vista previa del mensaje</p>
              <p className="text-sm text-[#0F2B5B]">
                {plantilla.replace("{nombre}", "Juan Pérez").replace("{dim}", "DIM-2024-8842").replace("{canal}", "VERDE").replace("{aduana}", "Tambo Quemado")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: NOTIFICACIONES ── */}
      {tab === "Notificaciones" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-[#0F2B5B] text-sm">Eventos que generan notificación automática</h3>
          {[
            { label: "Canal asignado (Verde/Amarillo/Rojo)",  desc: "Al registrarse el canal en Click", on: true  },
            { label: "Mercadería levantada",                  desc: "Cuando el trámite pasa a LEVANTADO", on: true  },
            { label: "Observaciones de la aduana",            desc: "Al aparecer una observación nueva",  on: true  },
            { label: "Cambio de estado",                      desc: "Cualquier cambio en el trámite",    on: false },
            { label: "Recordatorio de vencimiento",           desc: "72 horas antes del vencimiento",   on: false },
            { label: "Generación de planilla",                desc: "Al generar y enviar una cotización",on: true  },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
              <div>
                <div className="text-sm font-medium text-[#0F2B5B]">{item.label}</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">{item.desc}</div>
              </div>
              <div className="w-11 h-6 rounded-full cursor-pointer flex items-center transition-colors"
                   style={{ background: item.on ? "#1E6FD9" : "#E2E8F0", padding: "2px" }}>
                <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                     style={{ transform: item.on ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
