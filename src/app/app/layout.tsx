"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Search, Calculator, FileText,
  Truck, Shield, Bell, Users, Settings, LogOut, Menu, X
} from "lucide-react"
import { useState } from "react"

const NAV = [
  { href: "/app/dashboard",   icon: LayoutDashboard, label: "Dashboard",   section: null },
  { href: "/app/nandina",     icon: Search,          label: "NANDINA",     section: "HERRAMIENTAS" },
  { href: "/app/calculadora", icon: Calculator,      label: "Calculadora", section: null },
  { href: "/app/click",       icon: FileText,        label: "Click / DIM", section: null },
  { href: "/app/planillas",   icon: FileText,        label: "Planillas",   section: null },
  { href: "/app/tramites",    icon: Shield,          label: "Trámites",    section: "GESTIÓN" },
  { href: "/app/rastreador",  icon: Truck,           label: "Rastreador",  section: null },
  { href: "/app/clientes",    icon: Users,           label: "Clientes",    section: null },
  { href: "/app/alertas",     icon: Bell,            label: "Alertas WA",  section: null },
  { href: "/app/config",      icon: Settings,        label: "Configuración", section: "CUENTA" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sideOpen, setSideOpen] = useState(false)

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "flex" : "hidden md:flex"} flex-col h-full w-60 bg-[#0F2B5B] flex-shrink-0`}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#1A3560] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-[#0F2B5B] text-xs font-bold">TB</span>
          </div>
          <span className="text-white font-semibold text-sm">TributosBO</span>
        </Link>
        {mobile && (
          <button onClick={() => setSideOpen(false)} className="text-[#94A3B8] hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Plan badge */}
      <div className="px-4 py-3 border-b border-[#1A3560]">
        <div className="bg-[#1A3560] rounded-lg px-3 py-2">
          <div className="text-[#7C94CA] text-[10px] uppercase tracking-widest">Plan activo</div>
          <div className="text-white text-xs font-semibold mt-0.5">Pro · 14 días restantes</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
        {NAV.map((item, i) => {
          const active = pathname === item.href
          const showSection = item.section && (i === 0 || NAV[i-1].section !== item.section)
          return (
            <div key={item.href}>
              {showSection && (
                <div className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-[#4A6190] uppercase tracking-widest">
                  {item.section}
                </div>
              )}
              <Link href={item.href} onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#1E6FD9] text-white"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#1A3560]"
                }`}>
                <item.icon size={16} />
                {item.label}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#1A3560]">
        <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-white hover:bg-[#1A3560] transition-colors w-full">
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar desktop */}
      <Sidebar />

      {/* Sidebar mobile overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          <div className="relative z-10 w-60 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-[#E2E8F0] h-14 flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setSideOpen(true)} className="md:hidden text-[#475569]">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#475569] hidden sm:block">Agencia Demo</span>
            <div className="w-8 h-8 bg-[#0F2B5B] rounded-full flex items-center justify-center text-white text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
