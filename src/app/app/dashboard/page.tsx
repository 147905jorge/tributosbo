"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Calculator, FileText, Truck, Shield, Bell, TrendingUp, Clock, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"

type Stats = {
  clientes: number; tramites_activos: number
  planillas_mes: number; tramites_hoy: number
  canales: Record<string, number>
}

type Tramite = {
  id: string; dim: string; cliente_nombre: string | null
  tipo: string; canal: string; aduana: string; fecha: string
}

const CANAL_COLOR: Record<string, string> = {
  VERDE: "#0D7A3E", AMARILLO: "#D97706", ROJO: "#B91C1C",
  PENDIENTE: "#475569", LEVANTADO: "#1E6FD9", OBSERVADO: "#C8500A",
}

const HERRAMIENTAS = [
  { href: "/app/nandina",     icon: Search,      label: "Buscador NANDINA",  desc: "Consulta arancelaria",  color: "#0F2B5B" },
  { href: "/app/calculadora", icon: Calculator,  label: "Calculadora",       desc: "GA · IVA · ICE",        color: "#0D7A3E" },
  { href: "/app/click",       icon: FileText,    label: "Consulta DIM",      desc: "Portal Click",          color: "#1E6FD9" },
  { href: "/app/rastreador",  icon: Truck,       label: "Rastreador",        desc: "DHL · FedEx · UPS",     color: "#C8500A" },
]

export default function DashboardPage() {
  const [stats,    setStats]    = useState<Stats | null>(null)
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading,  setLoading]  = useState(true)
  const user = getUser()

  const hora = new Date().getHours()
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches"

  useEffect(() => {
    async function cargar() {
      try {
        const [s, t] = await Promise.all([api.get("/stats"), api.get("/tramites")])
        setStats(s)
        setTramites((t as Tramite[]).slice(0, 5))
      } catch {}
      setLoading(false)
    }
    cargar()
  }, [])

  const KPIS = [
    { label: "Clientes activos",   value: stats?.clientes          ?? 0, icon: TrendingUp, color: "#0D7A3E" },
    { label: "Trámites activos",   value: stats?.tramites_activos  ?? 0, icon: Shield,     color: "#C8500A" },
    { label: "Planillas este mes", value: stats?.planillas_mes     ?? 0, icon: FileText,   color: "#4F46E5" },
    { label: "Trámites hoy",       value: stats?.tramites_hoy      ?? 0, icon: Clock,      color: "#1E6FD9" },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Saludo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">
            {saludo}{user?.nombre ? `, ${user.nombre.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {new Date().toLocaleDateString("es-BO", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xs text-[#94A3B8] font-medium">CAMBIO BCB</span>
          <span className="text-lg font-bold font-mono text-[#0D7A3E]">Bs. 6.96</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: kpi.color + "15" }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
            {loading
              ? <div className="h-8 w-16 bg-[#F1F5F9] rounded animate-pulse" />
              : <div className="text-2xl font-bold text-[#0F2B5B] font-mono">{kpi.value}</div>
            }
            <div className="text-xs text-[#94A3B8] mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Últimos trámites */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="font-semibold text-[#0F2B5B] text-sm">Últimos Trámites</h2>
            <Link href="/app/tramites" className="text-xs text-[#1E6FD9] hover:underline font-medium">Ver todos</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-[#1E6FD9] mx-auto" /></div>
          ) : tramites.length === 0 ? (
            <div className="p-8 text-center">
              <Shield size={32} className="text-[#E2E8F0] mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">No hay trámites registrados</p>
              <Link href="/app/tramites" className="text-xs text-[#1E6FD9] font-medium hover:underline mt-2 inline-block">
                Registrar primer trámite →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {tramites.map(t => (
                <div key={t.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0"
                         style={{ backgroundColor: CANAL_COLOR[t.canal] || "#475569" }} />
                    <div>
                      <div className="text-sm font-mono font-semibold text-[#0F2B5B]">{t.dim}</div>
                      <div className="text-xs text-[#94A3B8]">{t.cliente_nombre || t.aduana || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs text-[#475569]">{t.tipo}</div>
                      <div className="text-xs text-[#94A3B8] flex items-center gap-1 justify-end">
                        <Clock size={10} /> {t.fecha}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ backgroundColor: CANAL_COLOR[t.canal] || "#475569" }}>
                      {t.canal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Herramientas rápidas */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-semibold text-[#0F2B5B] text-sm">Herramientas Rápidas</h2>
          </div>
          <div className="p-3 space-y-2">
            {HERRAMIENTAS.map(h => (
              <Link key={h.href} href={h.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: h.color + "15" }}>
                  <h.icon size={18} style={{ color: h.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#0F2B5B] group-hover:text-[#1E6FD9] transition-colors">{h.label}</div>
                  <div className="text-xs text-[#94A3B8]">{h.desc}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mx-3 mb-3 bg-[#EFF6FF] rounded-xl p-4">
            <div className="text-xs text-[#1E6FD9] font-semibold mb-1">Soporte técnico</div>
            <p className="text-xs text-[#475569] mb-3">¿Necesitas ayuda?</p>
            <a href="https://wa.me/59172030560"
               className="block text-center bg-[#0D7A3E] text-white text-xs font-medium py-2 rounded-lg hover:bg-[#0a6233] transition-colors">
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
