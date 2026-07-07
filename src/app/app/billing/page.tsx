"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Zap, AlertCircle, Loader2, CreditCard, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"

function CancelSubscription() {
  const [confirm,  setConfirm]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState("")

  async function handleCancel() {
    setLoading(true); setError("")
    try {
      await api.post("/stripe/cancel", {})
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cancelar")
    }
    setLoading(false)
  }

  if (done) return (
    <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-5 text-sm text-[#0D7A3E]">
      Suscripción cancelada. Tu plan pasará a Básico al finalizar el período actual.
    </div>
  )

  return (
    <div className="border border-[#FEE2E2] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <XCircle size={16} style={{ color: "#B91C1C" }} />
        <span className="text-sm font-semibold text-[#B91C1C]">Cancelar suscripción</span>
      </div>
      <p className="text-xs text-[#475569] mb-3">
        Tu plan se mantendrá activo hasta el final del período pagado. Luego pasará al plan Básico.
      </p>
      {error && <p className="text-xs text-[#B91C1C] mb-3">{error}</p>}
      {!confirm ? (
        <button onClick={() => setConfirm(true)}
          className="text-xs font-semibold text-[#B91C1C] underline bg-none border-none cursor-pointer p-0">
          Quiero cancelar mi suscripción
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={handleCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "#B91C1C" }}>
            {loading ? "Cancelando..." : "Confirmar cancelación"}
          </button>
          <button onClick={() => setConfirm(false)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#475569] border border-[#E2E8F0] bg-white">
            No, mantener plan
          </button>
        </div>
      )}
    </div>
  )
}

const PLANES = [
  {
    id: "basico", name: "Básico", price: 29, color: "#475569",
    features: ["Buscador NANDINA", "Calculadora GA/IVA/ICE", "Consulta DIM / Click", "1 usuario"],
    missing: ["Planillas PDF", "WhatsApp", "Rastreador", "CRM de Clientes"]
  },
  {
    id: "pro", name: "Pro", price: 59, color: "#1E6FD9", popular: true,
    features: ["Todo Básico", "Generador de Planillas PDF", "Alertas WhatsApp", "Rastreador DHL/FedEx/UPS", "Seguimiento de Trámites", "3 usuarios"],
    missing: ["CRM de Clientes", "Analytics avanzado"]
  },
  {
    id: "agencia", name: "Agencia", price: 99, color: "#7C3AED",
    features: ["Todo Pro", "CRM de Clientes", "Configuración White-Label", "Gestión de Usuarios", "10 usuarios", "Soporte prioritario"],
    missing: []
  },
]

function BillingContent() {
  const params  = useSearchParams()
  const user    = getUser()
  const [billing, setBilling]   = useState<"mensual"|"anual">("mensual")
  const [loading, setLoading]   = useState<string | null>(null)
  const [error,   setError]     = useState("")

  const success        = params.get("success")
  const cancel         = params.get("cancel")
  const subscriptionId = params.get("subscription_id")
  const planAprobado   = params.get("plan")

  // Activar plan tras aprobacion PayPal
  useEffect(() => {
    if (success && subscriptionId && planAprobado) {
      api.post("/paypal/activar", { subscription_id: subscriptionId, plan: planAprobado })
        .catch(() => {})
    }
  }, [success, subscriptionId, planAprobado])

  const precio = (base: number) => billing === "anual" ? Math.round(base * 0.8) : base

  async function contratar(planId: string) {
    setLoading(planId); setError("")
    try {
      const r = await api.post("/paypal/checkout", { plan: planId, billing })
      if (r.url) window.location.href = r.url
      else setError(r.detail || "Error iniciando pago")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg.includes("no configurado")) {
        window.open(`https://wa.me/59172030560?text=Quiero+contratar+el+plan+${planId}+de+TributosBO`, "_blank")
      } else {
        setError(msg || "Error al procesar")
      }
    }
    setLoading(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F2B5B]">Planes y Facturación</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Plan actual: <span className="font-semibold text-[#0F2B5B] capitalize">{user?.plan || "básico"}</span></p>
      </div>

      {/* Mensajes de estado */}
      {success && (
        <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl px-5 py-4 mb-6">
          <Check size={20} style={{ color: "#0D7A3E" }} />
          <div>
            <div className="font-semibold text-[#0D7A3E]">Pago procesado correctamente</div>
            <div className="text-sm text-[#475569]">Tu plan ha sido actualizado. Los cambios se verán reflejados en minutos.</div>
          </div>
        </div>
      )}
      {cancel && (
        <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-5 py-4 mb-6">
          <AlertCircle size={20} style={{ color: "#92400E" }} />
          <div className="text-sm text-[#92400E]">El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.</div>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-5 py-4 mb-6 text-sm text-[#B91C1C]">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Toggle mensual/anual */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 gap-1">
          {(["mensual","anual"] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors capitalize"
              style={{ background: billing === b ? "#0F2B5B" : "transparent", color: billing === b ? "#fff" : "#475569" }}>
              {b} {b === "anual" && <span className="text-[#34D399] text-xs ml-1">-20%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de planes */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {PLANES.map(plan => {
          const esPlanActual = user?.plan === plan.id
          return (
            <div key={plan.id} className="bg-white rounded-2xl border overflow-hidden"
                 style={{ borderColor: plan.popular ? plan.color : "#E2E8F0", transform: plan.popular ? "scale(1.02)" : "none", boxShadow: plan.popular ? "0 16px 48px rgba(30,111,217,0.15)" : "none" }}>
              {plan.popular && (
                <div className="py-2 text-center text-xs font-bold text-white" style={{ background: plan.color }}>
                  MÁS POPULAR
                </div>
              )}
              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-[#0F2B5B]">${precio(plan.price)}</span>
                  <span className="text-sm text-[#94A3B8] mb-1">USD/{billing === "anual" ? "mes" : "mes"}</span>
                </div>
                {billing === "anual" && (
                  <div className="text-xs text-[#0D7A3E] font-semibold mb-4">Ahorras ${(plan.price - precio(plan.price)) * 12}/año</div>
                )}
                <ul className="space-y-2.5 mb-6 mt-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#475569]">
                      <Check size={14} style={{ color: "#0D7A3E", flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#94A3B8] line-through">
                      <span className="w-3.5 h-3.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {esPlanActual ? (
                  <div className="w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-[#F0FDF4] text-[#0D7A3E] border border-[#BBF7D0]">
                    Plan actual
                  </div>
                ) : (
                  <button onClick={() => contratar(plan.id)} disabled={!!loading}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: plan.color }}>
                    {loading === plan.id
                      ? <><Loader2 size={15} className="animate-spin" />Procesando...</>
                      : <><CreditCard size={15} />Contratar {plan.name}</>
                    }
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info de pago */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 flex items-start gap-3 mb-4">
        <Zap size={18} className="text-[#1E6FD9] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#475569]">
          <span className="font-semibold text-[#0F2B5B]">Pago seguro con PayPal. </span>
          Acepta tarjetas de crédito/débito y saldo PayPal. Cancela cuando quieras sin penalidades.
          Para pago por transferencia o QR boliviano, contáctanos por WhatsApp.
        </div>
      </div>

      {/* Cancelar suscripción */}
      {user?.plan && user.plan !== "basico" && (
        <CancelSubscription />
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#94A3B8]">Cargando...</div>}>
      <BillingContent />
    </Suspense>
  )
}
