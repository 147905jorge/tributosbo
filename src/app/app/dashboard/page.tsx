import Link from "next/link"
import { Search, Calculator, FileText, Truck, Shield, Bell, TrendingUp, Clock } from "lucide-react"

const KPIS = [
  { label: "Consultas hoy",     value: "1,284", delta: "+12%", icon: Search,      color: "#1E6FD9" },
  { label: "Planillas generadas", value: "342",  delta: "+5%",  icon: FileText,    color: "#4F46E5" },
  { label: "Trámites activos",  value: "89",    delta: null,   icon: Shield,      color: "#C8500A" },
  { label: "Clientes activos",  value: "512",   delta: null,   icon: TrendingUp,  color: "#0D7A3E" },
]

const TRAMITES = [
  { dim: "DIM-2024-8842", empresa: "Logística Global S.A.",   tipo: "Importación", canal: "VERDE",    color: "#0D7A3E", fecha: "06/12/2024" },
  { dim: "DIM-2024-5542", empresa: "Importaciones El Roble",  tipo: "Importación", canal: "ROJO",     color: "#B91C1C", fecha: "06/12/2024" },
  { dim: "DIM-2024-3112", empresa: "Textiles Andinos Ltda.",  tipo: "Tránsito",    canal: "AMARILLO", color: "#D97706", fecha: "05/12/2024" },
  { dim: "EXP-2024-1120", empresa: "AgroIndustria Sur S.A.",  tipo: "Exportación", canal: "VERDE",    color: "#0D7A3E", fecha: "05/12/2024" },
]

const HERRAMIENTAS = [
  { href: "/app/nandina",     icon: Search,      label: "Buscador NANDINA",  desc: "Consulta arancelaria",   color: "#0F2B5B" },
  { href: "/app/calculadora", icon: Calculator,  label: "Calculadora",       desc: "GA · IVA · ICE",         color: "#0D7A3E" },
  { href: "/app/click",       icon: FileText,    label: "Consulta DIM",      desc: "Portal Click",           color: "#1E6FD9" },
  { href: "/app/rastreador",  icon: Truck,       label: "Rastreador",        desc: "DHL · FedEx · UPS",      color: "#C8500A" },
]

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Saludo + tipo de cambio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2B5B]">Buenos días, Agencia</h1>
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
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ backgroundColor: kpi.color + "15" }}>
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
              {kpi.delta && (
                <span className="text-xs font-semibold text-[#0D7A3E] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                  {kpi.delta}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-[#0F2B5B] font-mono">{kpi.value}</div>
            <div className="text-xs text-[#94A3B8] mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Últimos trámites */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="font-semibold text-[#0F2B5B] text-sm">Últimos Trámites</h2>
            <Link href="/app/tramites" className="text-xs text-[#1E6FD9] hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {TRAMITES.map((t) => (
              <div key={t.dim} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                  <div>
                    <div className="text-sm font-mono font-semibold text-[#0F2B5B]">{t.dim}</div>
                    <div className="text-xs text-[#94A3B8]">{t.empresa}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-[#475569]">{t.tipo}</div>
                    <div className="text-xs text-[#94A3B8] flex items-center gap-1 justify-end">
                      <Clock size={10} />{t.fecha}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                        style={{ backgroundColor: t.color }}>
                    {t.canal}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Herramientas rápidas */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-semibold text-[#0F2B5B] text-sm">Herramientas Rápidas</h2>
          </div>
          <div className="p-3 space-y-2">
            {HERRAMIENTAS.map((h) => (
              <Link key={h.href} href={h.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: h.color + "15" }}>
                  <h.icon size={18} style={{ color: h.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#0F2B5B] group-hover:text-[#1E6FD9] transition-colors">
                    {h.label}
                  </div>
                  <div className="text-xs text-[#94A3B8]">{h.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Soporte */}
          <div className="mx-3 mb-3 bg-[#EFF6FF] rounded-xl p-4">
            <div className="text-xs text-[#1E6FD9] font-semibold mb-1">Soporte técnico</div>
            <p className="text-xs text-[#475569] mb-3">¿Necesitas ayuda con la plataforma?</p>
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
