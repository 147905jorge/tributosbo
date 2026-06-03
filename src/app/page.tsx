"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Search, Calculator, FileText, Truck, Shield, Bell, Users,
  ArrowRight, Check, Menu, X, ChevronDown, Zap,
} from "lucide-react"

const TOOLS = [
  { icon: Search,     color: "#0F2B5B", bg: "#e8edf5", label: "Buscador NANDINA",        desc: "Consulta códigos arancelarios con autocompletado y tributos en tiempo real." },
  { icon: Calculator, color: "#0D7A3E", bg: "#dcf5e7", label: "Calculadora de Tributos",  desc: "Calcula GA, IVA e ICE sobre el valor CIF. Resultado en USD y bolivianos." },
  { icon: FileText,   color: "#1E6FD9", bg: "#ddeeff", label: "Consulta DIM / Click",     desc: "Estado de tu declaración aduanera desde el portal Click de la Aduana Nacional." },
  { icon: FileText,   color: "#4F46E5", bg: "#ede9fe", label: "Generador de Planillas",   desc: "Crea planillas y cotizaciones con el logo y datos de tu agencia." },
  { icon: Truck,      color: "#C8500A", bg: "#fde8d8", label: "Rastreador de Envíos",     desc: "Seguimiento de guías DHL, FedEx, UPS, Maersk y AWB en tiempo real." },
  { icon: Shield,     color: "#7C3AED", bg: "#ede9fe", label: "Seguimiento de Trámites",  desc: "Gestiona el estado de todas tus declaraciones activas en un solo panel." },
  { icon: Bell,       color: "#059669", bg: "#d1fae5", label: "Alertas WhatsApp",         desc: "Notifica a tus clientes automáticamente sobre el estado de sus trámites." },
  { icon: Users,      color: "#DB2777", bg: "#fce7f3", label: "CRM de Clientes",          desc: "Gestiona tu cartera de importadores con historial y documentos." },
]

const FAQS = [
  { q: "¿Puedo probar la plataforma sin pagar?",   a: "Sí. Ofrecemos 14 días de prueba gratuita sin tarjeta de crédito. Accedes a todas las funciones del plan Pro durante ese período." },
  { q: "¿Mis clientes ven mi logo y mis datos?",   a: "Exactamente. Cada agencia configura su logo, colores y datos corporativos. Tus clientes ven tu marca en cada documento generado." },
  { q: "¿Cómo funciona la integración WhatsApp?",  a: "Conectas tu número de WhatsApp escaneando un código QR una sola vez. Desde ahí, la plataforma envía notificaciones automáticas a tus clientes." },
  { q: "¿Los datos NANDINA están actualizados?",   a: "Sí. La base de datos NANDINA refleja la nomenclatura arancelaria vigente de la Comunidad Andina con GA, IVA, ICE y permisos previos." },
  { q: "¿Puedo usar TributosBO en mis fronteras?", a: "Sí. Las herramientas funcionan para todas las aduanas de Bolivia: Tambo Quemado, Desaguadero, Pisiga, Puerto Suárez, Yacuiba, Villazón y más." },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)
  const [billing,  setBilling]  = useState<"mensual" | "anual">("mensual")
  const prices = {
    basico:  billing === "mensual" ? 29  : 23,
    pro:     billing === "mensual" ? 59  : 47,
    agencia: billing === "mensual" ? 99  : 79,
  }

  return (
    <div style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)", color: "#0F172A", background: "#fff", minHeight: "100vh" }}>

      {/* NAVBAR */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <nav style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: "#0F2B5B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>TB</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: "center" }}>
            {["#herramientas:Herramientas", "#precios:Precios", "#faq:FAQ"].map(item => {
              const [href, label] = item.split(":")
              return <a key={href} href={href} style={{ color: "#475569", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>{label}</a>
            })}
          </div>
          <div className="hidden md:flex" style={{ alignItems: "center", gap: 12, flexShrink: 0 }}>
            <Link href="/app/dashboard" style={{ color: "#475569", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Iniciar sesión</Link>
            <Link href="/app/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1E6FD9", color: "#fff", fontSize: 14, fontWeight: 600, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>
              Prueba gratis 14 días
            </Link>
          </div>

          {/* Mobile button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#475569" }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 24px 20px", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
            {["#herramientas:Herramientas", "#precios:Precios", "#faq:FAQ"].map(item => {
              const [href, label] = item.split(":")
              return <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ color: "#475569", fontSize: 15, fontWeight: 500, textDecoration: "none" }}>{label}</a>
            })}
            <Link href="/app/dashboard" onClick={() => setMenuOpen(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1E6FD9", color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 18px", borderRadius: 8, textDecoration: "none" }}>
              Prueba gratis 14 días
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg, #0F2B5B 0%, #1A4080 40%, #1E6FD9 100%)", padding: "100px 24px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "#fff", clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1 }}
             className="grid-cols-1 md:grid-cols-2">
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, marginBottom: 24, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Zap size={12} /> Plataforma aduanera para Bolivia y Latinoamérica
            </div>
            <h1 style={{ fontSize: "clamp(2rem,3.5vw,3rem)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Todas las herramientas{" "}
              <span style={{ color: "#93C5FD" }}>aduaneras</span>{" "}
              en un solo lugar
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, margin: "0 0 36px" }}>
              Calculadora NANDINA, consulta de DIM, rastreador de envíos, generador de planillas y WhatsApp integrado. Para agencias despachantes y equipos de logística.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/app/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0F2B5B", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 10, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
                Comenzar prueba gratis <ArrowRight size={16} />
              </Link>
              <a href="#herramientas" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 15, fontWeight: 600, padding: "14px 28px", borderRadius: 10, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                Ver herramientas
              </a>
            </div>
            <div style={{ display: "flex", gap: 40, marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
              {[{ v: "400+", l: "Agencias en Bolivia" }, { v: "GRATIS", l: "14 días de prueba" }, { v: "100%", l: "Web, sin instalar" }].map(st => (
                <div key={st.l}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{st.v}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup — solo desktop */}
          <div className="hidden md:block" style={{ position: "relative", zIndex: 1 }}>
            <div style={{ background: "#0F2B5B", borderRadius: 14, padding: 4, boxShadow: "0 40px 80px rgba(0,0,0,0.4)" }}>
              <div style={{ background: "#F8FAFC", borderRadius: 11, overflow: "hidden" }}>
                {/* Browser bar */}
                <div style={{ background: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#E2E8F0","#E2E8F0","#E2E8F0"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 5, padding: "3px 10px", fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>tributosbo.vercel.app</div>
                </div>
                {/* App shell */}
                <div style={{ display: "flex", height: 260 }}>
                  {/* Sidebar */}
                  <div style={{ width: 160, background: "#0F2B5B", padding: "14px 12px", flexShrink: 0 }}>
                    <div style={{ color: "#7C94CA", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, padding: "0 8px" }}>TributosBO</div>
                    {[
                      { l: "Dashboard",  active: true  },
                      { l: "NANDINA",    active: false },
                      { l: "Calculadora",active: false },
                      { l: "Trámites",   active: false },
                      { l: "Planillas",  active: false },
                    ].map(item => (
                      <div key={item.l} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, fontSize: 12, color: item.active ? "#fff" : "#94A3B8", background: item.active ? "#1E6FD9" : "transparent", marginBottom: 2 }}>
                        {item.l}
                      </div>
                    ))}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, padding: 14, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
                      {[{ v: "1,284", l: "Consultas" }, { v: "342", l: "Planillas" }, { v: "89", l: "Trámites" }, { v: "512", l: "Clientes" }].map(k => (
                        <div key={k.l} style={{ background: "#fff", borderRadius: 7, padding: "8px 10px", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#0F2B5B", fontFamily: "monospace" }}>{k.v}</div>
                          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2 }}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { dim: "DIM-2024-8842", emp: "Logística Global S.A.",  canal: "VERDE",    c: "#0D7A3E" },
                        { dim: "DIM-2024-5542", emp: "Import. El Roble",       canal: "ROJO",     c: "#B91C1C" },
                        { dim: "DIM-2024-3112", emp: "Textiles Andinos",       canal: "AMARILLO", c: "#D97706" },
                      ].map(row => (
                        <div key={row.dim} style={{ background: "#fff", borderRadius: 7, padding: "8px 10px", border: "1px solid #E2E8F0", borderLeftWidth: 3, borderLeftColor: row.c, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#0F2B5B", fontFamily: "monospace" }}>{row.dim}</div>
                            <div style={{ fontSize: 9, color: "#94A3B8" }}>{row.emp}</div>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 99, color: "#fff", background: row.c }}>{row.canal}</div>
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
      <section id="herramientas" style={{ background: "#F8FAFC", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>HERRAMIENTAS</div>
            <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#0F2B5B", margin: "0 0 16px", letterSpacing: "-0.01em" }}>Todo lo que necesitas para operar</h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Herramientas especializadas para agencias despachantes, importadores y exportadores de Bolivia.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))", gap: 16 }}>
            {TOOLS.map(tool => (
              <div key={tool.label} style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: `3px solid ${tool.color}`, borderRadius: 12, padding: 22 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, background: tool.bg }}>
                  <tool.icon size={20} style={{ color: tool.color }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F2B5B", margin: "0 0 8px" }}>{tool.label}</h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO — Calculadora en vivo */}
      <section style={{ background: "#0F2B5B", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
             className="grid-cols-1 md:grid-cols-2">
          <div>
            <div style={{ display: "inline-block", color: "#93C5FD", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>CALCULADORA EN VIVO</div>
            <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Calcula tributos antes de registrarte</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 32px" }}>
              Ingresa el valor CIF y el código NANDINA. Obtén GA, IVA e ICE en segundos.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
              {["Cálculo instantáneo en USD y bolivianos","Tipo de cambio BCB precargado","Exporta a PDF o envía por WhatsApp","Conecta con el buscador NANDINA"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 14, marginBottom: 12 }}>
                  <Check size={16} style={{ color: "#34D399", flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <Link href="/app/calculadora" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0F2B5B", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}>
              Probar calculadora <ArrowRight size={16} />
            </Link>
          </div>

          {/* Card demo */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F2B5B", margin: "0 0 18px" }}>Calculadora de Tributos</h3>
            {[
              { label: "Valor CIF (USD)", val: "10,000.00", mono: true },
              { label: "Código NANDINA",  val: "8528.71.90.00", mono: true },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: f.mono ? "monospace" : "inherit", color: "#0F2B5B", background: "#F8FAFC" }}>{f.val}</div>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{ label: "GA (%)", val: "10" }, { label: "Tipo de cambio", val: "6.96" }].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "monospace", color: "#0F2B5B", background: "#F8FAFC" }}>{f.val}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: "1px solid #E2E8F0" }}>
              {[
                { l: "GA (10%)",    v: "$ 1,000.00",  c: "#C8500A" },
                { l: "IVA (14.94%)",v: "$ 1,643.40",  c: "#4F46E5" },
                { l: "Total tributos", v: "$ 2,643.40", c: "#0F2B5B", bold: true },
              ].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderTop: row.bold ? "1px solid #E2E8F0" : undefined, marginTop: row.bold ? 8 : 0, paddingTop: row.bold ? 10 : 5 }}>
                  <span style={{ color: "#475569" }}>{row.l}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: row.bold ? 800 : 600, color: row.c }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" style={{ background: "#F8FAFC", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>PRECIOS</div>
            <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#0F2B5B", margin: "0 0 16px" }}>Sin contratos, sin sorpresas</h2>
            <p style={{ fontSize: 16, color: "#475569", maxWidth: 480, margin: "0 auto 20px", lineHeight: 1.7 }}>14 días de prueba gratuita. Cancela cuando quieras.</p>
            <div style={{ display: "inline-flex", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 99, padding: 4 }}>
              {(["mensual", "anual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ padding: "7px 22px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: billing === b ? "#0F2B5B" : "transparent", color: billing === b ? "#fff" : "#475569", transition: "background 0.15s" }}>
                  {b === "mensual" ? "Mensual" : "Anual (20% dto.)"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}
               className="grid-cols-1 md:grid-cols-3">
            {[
              { name: "BÁSICO",   price: prices.basico,  popular: false, features: ["Buscador NANDINA","Calculadora de tributos","Consulta DIM / Click","1 usuario","Soporte por email"] },
              { name: "PRO",      price: prices.pro,     popular: true,  features: ["Todo lo de Básico","Generador de planillas PDF","Notificaciones WhatsApp","3 usuarios","Rastreador de envíos","Soporte prioritario"] },
              { name: "AGENCIA",  price: prices.agencia, popular: false, features: ["Todo lo de Pro","Subdominio propio","Analytics de uso","10 usuarios","CRM de clientes","API de integración"] },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.popular ? "#0F2B5B" : "#fff", border: plan.popular ? "1.5px solid #0F2B5B" : "1.5px solid #E2E8F0", borderRadius: 16, padding: "28px 24px", position: "relative", transform: plan.popular ? "scale(1.03)" : "none", boxShadow: plan.popular ? "0 16px 48px rgba(15,43,91,0.25)" : "none" }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#1E6FD9", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 99, whiteSpace: "nowrap" }}>
                    MÁS POPULAR
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: plan.popular ? "#7C94CA" : "#475569", margin: "0 0 12px" }}>{plan.name}</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: plan.popular ? "#fff" : "#0F2B5B", margin: 0, lineHeight: 1 }}>${plan.price}</div>
                <div style={{ fontSize: 14, color: plan.popular ? "#7C94CA" : "#94A3B8", margin: "4px 0 24px" }}>USD / mes</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.popular ? "rgba(255,255,255,0.85)" : "#475569", marginBottom: 10 }}>
                      <Check size={14} style={{ color: plan.popular ? "#34D399" : "#0D7A3E", flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/app/dashboard" style={{ display: "block", textAlign: "center", padding: 11, borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none", background: plan.popular ? "#1E6FD9" : "transparent", border: plan.popular ? "1.5px solid #1E6FD9" : "1.5px solid #E2E8F0", color: plan.popular ? "#fff" : "#0F2B5B" }}>
                  Comenzar prueba gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: "#fff", padding: "96px 24px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-block", color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>PREGUNTAS FRECUENTES</div>
            <h2 style={{ fontSize: "clamp(1.75rem,2.5vw,2.25rem)", fontWeight: 800, color: "#0F2B5B", margin: 0 }}>Todo lo que necesitas saber</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 680, margin: "0 auto" }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 600, color: "#0F2B5B", gap: 16 }}>
                  {faq.q}
                  <ChevronDown size={16} style={{ flexShrink: 0, color: "#94A3B8", transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 22px 18px", fontSize: 14, color: "#475569", lineHeight: 1.75, borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "linear-gradient(135deg, #0F2B5B 0%, #1E3A6E 100%)", padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Empieza a operar con TributosBO hoy</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", margin: "0 0 36px" }}>14 días gratis. Sin tarjeta. Sin compromiso.</p>
        <Link href="/app/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0F2B5B", fontSize: 16, fontWeight: 700, padding: "16px 36px", borderRadius: 12, textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          Comenzar prueba gratis <ArrowRight size={18} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0A1F45", padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto 40px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}
             className="grid-cols-1 md:grid-cols-4">
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, textDecoration: "none" }}>
              <div style={{ width: 30, height: 30, background: "rgba(255,255,255,0.1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>TB</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>TributosBO</span>
            </Link>
            <p style={{ fontSize: 13, color: "#7C94CA", lineHeight: 1.6 }}>Plataforma SaaS de herramientas aduaneras para Bolivia y Latinoamérica.</p>
          </div>
          {[
            { title: "Producto", links: ["Herramientas", "Precios", "Actualizaciones", "Documentación"] },
            { title: "Empresa",  links: ["Acerca de", "Contacto", "Blog", "Casos de uso"] },
            { title: "Legal",    links: ["Privacidad", "Términos", "Cookies"] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", margin: "0 0 14px" }}>{col.title}</div>
              {col.links.map(l => <a key={l} href="#" style={{ display: "block", color: "#7C94CA", fontSize: 13, textDecoration: "none", marginBottom: 8 }}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1152, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#7C94CA" }}>© 2025 TributosBO. Todos los derechos reservados.</span>
          <span style={{ fontSize: 13, color: "#7C94CA" }}>Hecho en Bolivia para América Latina</span>
        </div>
      </footer>
    </div>
  )
}
