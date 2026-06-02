"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Search, Calculator, FileText, Truck, Shield, Bell,
  Users, BarChart2, ArrowRight, Check, Menu, X,
  ChevronDown, Globe, Zap
} from "lucide-react"

const TOOLS = [
  { icon: Search,      color: "#0F2B5B", label: "Buscador NANDINA",        desc: "Consulta códigos arancelarios con autocompletado y tributos en tiempo real." },
  { icon: Calculator,  color: "#0D7A3E", label: "Calculadora de Tributos",  desc: "Calcula GA, IVA e ICE sobre el valor CIF. Resultado en USD y bolivianos." },
  { icon: FileText,    color: "#1E6FD9", label: "Consulta DIM / Click",     desc: "Estado de tu declaración aduanera desde el portal Click de la Aduana Nacional." },
  { icon: FileText,    color: "#4F46E5", label: "Generador de Planillas",   desc: "Crea planillas y cotizaciones con el logo y datos de tu agencia." },
  { icon: Truck,       color: "#C8500A", label: "Rastreador de Envíos",     desc: "Seguimiento de guías DHL, FedEx, UPS, Maersk y AWB en tiempo real." },
  { icon: Shield,      color: "#7C3AED", label: "Seguimiento de Trámites",  desc: "Gestiona el estado de todas tus declaraciones activas en un solo panel." },
  { icon: Bell,        color: "#059669", label: "Alertas WhatsApp",         desc: "Notifica a tus clientes automáticamente sobre el estado de sus trámites." },
  { icon: Users,       color: "#DB2777", label: "CRM de Clientes",          desc: "Gestiona tu cartera de importadores con historial y documentos." },
]

const FAQS = [
  { q: "¿Puedo probar la plataforma sin pagar?",        a: "Sí. Ofrecemos 14 días de prueba gratuita sin tarjeta de crédito. Accedes a todas las funciones del plan Pro durante ese período." },
  { q: "¿Mis clientes ven mi logo y mis datos?",        a: "Exactamente. Cada agencia configura su logo, colores y datos corporativos. Tus clientes ven tu marca en cada documento generado." },
  { q: "¿Cómo funciona la integración WhatsApp?",       a: "Conectas tu número de WhatsApp escaneando un código QR una sola vez. Desde ahí, la plataforma envía notificaciones automáticas a tus clientes." },
  { q: "¿Los datos NANDINA están actualizados?",        a: "Sí. La base de datos NANDINA refleja la nomenclatura arancelaria vigente de la Comunidad Andina con GA, IVA, ICE y permisos previos." },
  { q: "¿Puedo usar TributosBO en mis fronteras?",      a: "Sí. Las herramientas funcionan para todas las aduanas de Bolivia: Tambo Quemado, Desaguadero, Pisiga, Puerto Suárez, Yacuiba, Villazón y más." },
]

export default function LandingPage() {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)
  const [billing,   setBilling]   = useState<"mensual" | "anual">("mensual")

  const prices = {
    basico:  billing === "mensual" ? 29 : 23,
    pro:     billing === "mensual" ? 59 : 47,
    agencia: billing === "mensual" ? 99 : 79,
  }

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F2B5B] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">TB</span>
            </div>
            <span className="font-semibold text-[#0F2B5B] text-lg">TributosBO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#475569]">
            <a href="#herramientas" className="hover:text-[#0F2B5B] transition-colors">Herramientas</a>
            <a href="#precios"      className="hover:text-[#0F2B5B] transition-colors">Precios</a>
            <a href="#faq"          className="hover:text-[#0F2B5B] transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/app/dashboard" className="text-sm text-[#475569] hover:text-[#0F2B5B] transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/app/dashboard"
              className="bg-[#1E6FD9] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#1558B0] transition-colors">
              Prueba gratis 14 días
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-[#475569]">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-[#E2E8F0] px-4 py-4 flex flex-col gap-4">
            <a href="#herramientas" className="text-sm text-[#475569]" onClick={() => setMenuOpen(false)}>Herramientas</a>
            <a href="#precios"      className="text-sm text-[#475569]" onClick={() => setMenuOpen(false)}>Precios</a>
            <a href="#faq"          className="text-sm text-[#475569]" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/app/dashboard"
              className="bg-[#1E6FD9] text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center">
              Prueba gratis 14 días
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1E6FD9] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#BFDBFE] mb-6">
              <Zap size={12} />
              Plataforma aduanera para Bolivia y Latinoamérica
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F2B5B] leading-tight mb-6">
              Todas las herramientas{" "}
              <span className="text-[#1E6FD9]">aduaneras</span>{" "}
              en un solo lugar
            </h1>

            <p className="text-lg text-[#475569] mb-8 leading-relaxed">
              Calculadora NANDINA, consulta de DIM, rastreador de envíos, generador de planillas
              y WhatsApp integrado. Diseñado para agencias despachantes y equipos de logística.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link href="/app/dashboard"
                className="bg-[#1E6FD9] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#1558B0] transition-colors flex items-center justify-center gap-2">
                Comenzar prueba gratis <ArrowRight size={16} />
              </Link>
              <a href="#herramientas"
                className="border border-[#E2E8F0] text-[#0F2B5B] font-medium px-8 py-3.5 rounded-lg hover:bg-[#F8FAFC] transition-colors flex items-center justify-center gap-2">
                Ver herramientas
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              {[
                { value: "400+",  label: "Agencias en Bolivia" },
                { value: "GRATIS", label: "14 días de prueba" },
                { value: "100%",  label: "Web, sin instalar" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-[#0F2B5B]">{s.value}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-[#0F2B5B] rounded-2xl p-1 shadow-2xl">
              <div className="bg-[#F8FAFC] rounded-xl overflow-hidden">
                <div className="bg-white px-4 py-2.5 flex items-center gap-2 border-b border-[#E2E8F0]">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-[#E2E8F0]" />)}
                  </div>
                  <div className="flex-1 bg-[#F8FAFC] rounded-md px-3 py-1 text-xs text-[#94A3B8] font-mono">
                    tributosbo.vercel.app/app/dashboard
                  </div>
                </div>
                <div className="flex h-64">
                  <div className="w-48 bg-[#0F2B5B] p-4 flex flex-col gap-2">
                    <div className="text-white text-xs font-semibold mb-2">TributosBO</div>
                    {["Dashboard","NANDINA","Calculadora","Trámites","Planillas"].map((item, i) => (
                      <div key={item}
                        className={`text-xs px-2 py-1.5 rounded-md cursor-pointer ${i === 0 ? "bg-[#1E6FD9] text-white" : "text-[#94A3B8]"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[{n:"1,284",l:"Consultas"},{n:"342",l:"Planillas"},{n:"89",l:"Trámites"},{n:"512",l:"Clientes"}].map(k => (
                        <div key={k.l} className="bg-white rounded-lg p-2 border border-[#E2E8F0]">
                          <div className="text-lg font-bold text-[#0F2B5B]">{k.n}</div>
                          <div className="text-[10px] text-[#94A3B8]">{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {[
                        { dim:"DIM-2024-8842", empresa:"Logística Global S.A.",  canal:"VERDE",    color:"#0D7A3E" },
                        { dim:"DIM-2024-5542", empresa:"Importaciones El Roble", canal:"ROJO",     color:"#B91C1C" },
                        { dim:"DIM-2024-3112", empresa:"Textiles Andinos Ltda.", canal:"AMARILLO", color:"#D97706" },
                      ].map(t => (
                        <div key={t.dim} className="bg-white rounded-lg px-3 py-2 border border-[#E2E8F0] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-mono font-semibold text-[#0F2B5B]">{t.dim}</div>
                            <div className="text-[10px] text-[#94A3B8]">{t.empresa}</div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color }}>
                            {t.canal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HERRAMIENTAS */}
      <section id="herramientas" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#1E6FD9] text-xs font-semibold uppercase tracking-widest">HERRAMIENTAS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F2B5B] mt-3 mb-4">Todo lo que necesitas para operar</h2>
            <p className="text-[#475569] max-w-xl mx-auto">Herramientas especializadas para cada etapa del comercio exterior boliviano.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <div key={tool.label}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                style={{ borderTop: `3px solid ${tool.color}` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                     style={{ backgroundColor: tool.color + "18" }}>
                  <tool.icon size={20} style={{ color: tool.color }} />
                </div>
                <h3 className="font-semibold text-[#0F2B5B] text-sm mb-2">{tool.label}</h3>
                <p className="text-xs text-[#475569] leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="py-24 px-4 bg-[#0F2B5B]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[#7C94CA] text-xs font-semibold uppercase tracking-widest">DEMO EN VIVO</span>
            <h2 className="text-3xl font-bold text-white mt-3 mb-4">Prueba la calculadora ahora mismo</h2>
            <p className="text-[#94A3B8] mb-6 leading-relaxed">
              Sin registrarte. Ingresa el valor CIF y el código NANDINA y obtén el desglose completo de GA, IVA e ICE.
            </p>
            <ul className="space-y-3">
              {["Resultado en menos de 1 segundo","Incluye tipo de cambio BCB del día","Genera cotización PDF con tu logo","Envía resultado directo por WhatsApp"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#E2E8F0]">
                  <Check size={16} className="text-[#0D7A3E] flex-shrink-0" />{item}
                </li>
              ))}
            </ul>
            <Link href="/app/calculadora"
              className="inline-flex items-center gap-2 mt-8 bg-[#1E6FD9] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1558B0] transition-colors text-sm">
              Abrir calculadora completa <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-semibold text-[#0F2B5B] mb-4 text-sm">Cálculo de Tributos</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-[#475569] font-medium block mb-1">Valor CIF (USD)</label>
                <div className="border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0F2B5B] bg-[#F8FAFC]">$ 25,000.00</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#475569] font-medium block mb-1">GA</label>
                  <div className="border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0F2B5B] bg-[#F8FAFC]">15%</div>
                </div>
                <div>
                  <label className="text-xs text-[#475569] font-medium block mb-1">IVA</label>
                  <div className="border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0F2B5B] bg-[#F8FAFC]">14.94%</div>
                </div>
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-2">
              {[
                { l: "GA (15%)",        v: "$ 3,750.00",    c: "#0D7A3E", bold: false },
                { l: "IVA (14.94%)",    v: "$ 4,237.35",    c: "#1E6FD9", bold: false },
                { l: "Total tributos",  v: "$ 7,987.35",    c: "#0F2B5B", bold: true },
                { l: "Total en BOB",    v: "Bs. 55,572.12", c: "#0F2B5B", bold: true },
              ].map(row => (
                <div key={row.l} className="flex justify-between text-sm">
                  <span className="text-[#475569]">{row.l}</span>
                  <span className={`font-mono ${row.bold ? "font-bold" : ""}`} style={{ color: row.c }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-24 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1E6FD9] text-xs font-semibold uppercase tracking-widest">PRECIOS</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F2B5B] mt-3 mb-6">Planes para cada tamaño de agencia</h2>
            <div className="inline-flex items-center bg-white border border-[#E2E8F0] rounded-full p-1">
              {(["mensual","anual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${billing === b ? "bg-[#0F2B5B] text-white" : "text-[#475569]"}`}>
                  {b === "mensual" ? "Mensual" : <>Anual <span className="text-[#0D7A3E] font-semibold">-20%</span></>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: "basico",  label: "Básico",  price: prices.basico,  dark: false, popular: false,
                features: ["Buscador NANDINA","Calculadora de tributos","Consulta DIM / Click","1 usuario"] },
              { id: "pro",     label: "Pro",     price: prices.pro,     dark: true,  popular: true,
                features: ["Todo del plan Básico","Planillas PDF white-label","Notificaciones WhatsApp","Rastreador de envíos","3 usuarios"] },
              { id: "agencia", label: "Agencia", price: prices.agencia, dark: false, popular: false,
                features: ["Todo del plan Pro","Subdominio propio","Analytics avanzado","CRM de clientes","10 usuarios"] },
            ].map(plan => (
              <div key={plan.id} className={`rounded-2xl p-6 relative ${plan.dark ? "bg-[#0F2B5B] border border-[#0F2B5B]" : "bg-white border border-[#E2E8F0]"}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6FD9] text-white text-xs font-bold px-3 py-1 rounded-full">
                    MÁS POPULAR
                  </span>
                )}
                <div className={`text-sm font-semibold uppercase tracking-wide mb-3 ${plan.dark ? "text-[#7C94CA]" : "text-[#475569]"}`}>{plan.label}</div>
                <div className={`text-4xl font-bold mb-1 ${plan.dark ? "text-white" : "text-[#0F2B5B]"}`}>${plan.price}</div>
                <div className={`text-sm mb-6 ${plan.dark ? "text-[#7C94CA]" : "text-[#94A3B8]"}`}>USD / mes</div>
                <ul className={`space-y-3 mb-8 text-sm ${plan.dark ? "text-[#E2E8F0]" : "text-[#475569]"}`}>
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-[#0D7A3E]" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/app/dashboard"
                  className={`block text-center font-medium py-2.5 rounded-lg transition-colors text-sm ${plan.dark ? "bg-[#1E6FD9] text-white hover:bg-[#1558B0]" : "border border-[#E2E8F0] text-[#0F2B5B] hover:bg-[#F8FAFC]"}`}>
                  Comenzar gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#1E6FD9] text-xs font-semibold uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl font-bold text-[#0F2B5B] mt-3">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-[#0F2B5B] hover:bg-[#F8FAFC] transition-colors text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <ChevronDown size={16} className={`flex-shrink-0 ml-4 text-[#94A3B8] transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 pt-3 text-sm text-[#475569] leading-relaxed border-t border-[#E2E8F0]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#0F2B5B] to-[#1E3A6E]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Empieza hoy, sin tarjeta de crédito</h2>
          <p className="text-[#94A3B8] mb-8">14 días con todas las funciones del plan Pro. Sin compromisos.</p>
          <Link href="/app/dashboard"
            className="inline-flex items-center gap-2 bg-white text-[#0F2B5B] font-semibold px-8 py-3.5 rounded-lg hover:bg-[#F8FAFC] transition-colors">
            Crear cuenta gratuita <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F2B5B] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                  <span className="text-[#0F2B5B] text-xs font-bold">TB</span>
                </div>
                <span className="text-white font-semibold">TributosBO</span>
              </div>
              <p className="text-[#7C94CA] text-xs leading-relaxed">Plataforma de herramientas aduaneras para Bolivia y Latinoamérica.</p>
            </div>
            {[
              { title: "Producto", links: ["Herramientas","Precios","API"] },
              { title: "Empresa",  links: ["Nosotros","Blog","Contacto"] },
              { title: "Legal",    links: ["Privacidad","Términos","Cookies"] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="text-white text-xs font-semibold uppercase tracking-widest mb-3">{col.title}</h5>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-[#7C94CA] text-sm hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1A3560] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[#7C94CA] text-xs">© 2026 TributosBO. Todos los derechos reservados.</p>
            <div className="flex items-center gap-1.5 text-[#7C94CA] text-xs">
              <Globe size={12} /> Bolivia · Latinoamérica
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
