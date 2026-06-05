"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Search, Calculator, FileText,
  Truck, Shield, Bell, Users, Settings, LogOut, Menu, X, User, AlertTriangle
} from "lucide-react"
import { useState, useEffect } from "react"
import { getUser, getToken, clearToken, fetchMe, setUser, type Usuario } from "@/lib/auth"
import { api } from "@/lib/api"

const NAV = [
  { href: "/app/dashboard",   icon: LayoutDashboard, label: "Dashboard",     section: null },
  { href: "/app/nandina",     icon: Search,          label: "NANDINA",       section: "HERRAMIENTAS" },
  { href: "/app/calculadora", icon: Calculator,      label: "Calculadora",   section: null },
  { href: "/app/click",       icon: FileText,        label: "Click / DIM",   section: null },
  { href: "/app/planillas",   icon: FileText,        label: "Planillas",     section: null },
  { href: "/app/tramites",    icon: Shield,          label: "Trámites",      section: "GESTIÓN" },
  { href: "/app/rastreador",  icon: Truck,           label: "Rastreador",    section: null },
  { href: "/app/clientes",    icon: Users,           label: "Clientes",      section: null },
  { href: "/app/alertas",     icon: Bell,            label: "Alertas WA",    section: null },
  { href: "/app/config",      icon: Settings,        label: "Configuración", section: "CUENTA" },
  { href: "/app/usuarios",    icon: Users,           label: "Usuarios",      section: null },
  { href: "/app/perfil",      icon: User,            label: "Mi Perfil",     section: null },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [sideOpen,       setSideOpen]       = useState(false)
  const [user,           setUserState]       = useState<Usuario | null>(null)
  const [diasRestantes,  setDiasRestantes]   = useState<number | null>(null)
  const [trialVencido,   setTrialVencido]    = useState(false)

  useEffect(() => {
    const cached = getUser()
    if (cached) { setUserState(cached) }
    const token = getToken()
    if (!token) { router.push("/login"); return }
    if (!cached) {
      fetchMe(token).then(u => { setUser(u); setUserState(u) }).catch(() => {
        clearToken(); router.push("/login")
      })
    }
    // Verificar trial
    api.get("/trial").then((t: { dias_restantes: number; vencido: boolean }) => {
      setDiasRestantes(t.dias_restantes)
      setTrialVencido(t.vencido)
    }).catch(() => {})
  }, [])

  function handleLogout() {
    clearToken()
    router.push("/login")
  }

  const initiales = user
    ? user.empresa.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
    : "??"

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`${mobile ? "flex" : "hidden md:flex"} flex-col h-full w-60 bg-[#0F2B5B] flex-shrink-0`}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#1A3560] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {user?.logo_url
            ? <img src={user.logo_url} alt="logo" className="h-7 w-auto object-contain" />
            : <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                <span className="text-[#0F2B5B] text-xs font-bold">{initiales}</span>
              </div>
          }
          <span className="text-white font-semibold text-sm">{user?.empresa || "TributosBO"}</span>
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
          <div className="text-white text-xs font-semibold mt-0.5 capitalize">
            {user?.plan || "básico"}
            {diasRestantes !== null && !trialVencido && ` · ${diasRestantes}d restantes`}
            {trialVencido && " · VENCIDO"}
          </div>
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
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:text-white hover:bg-[#1A3560] transition-colors w-full">
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
            <span className="text-sm text-[#475569] hidden sm:block">{user?.nombre || ""}</span>
            <div className="w-8 h-8 bg-[#0F2B5B] rounded-full flex items-center justify-center text-white text-xs font-bold">
              {initiales}
            </div>
          </div>
        </header>

        {/* Banner trial */}
        {diasRestantes !== null && diasRestantes <= 5 && !trialVencido && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-[#92400E]">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>Tu período de prueba vence en <strong>{diasRestantes} día{diasRestantes !== 1 ? "s" : ""}</strong>.</span>
            </div>
            <a href="https://wa.me/59172030560?text=Quiero+contratar+TributosBO" target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold text-[#92400E] underline whitespace-nowrap">
              Contratar ahora →
            </a>
          </div>
        )}
        {trialVencido && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-[#B91C1C]">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>Tu período de prueba ha vencido. Algunas funciones están limitadas.</span>
            </div>
            <Link href="/vencido" className="text-xs font-semibold text-[#B91C1C] underline whitespace-nowrap">
              Ver planes →
            </Link>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
