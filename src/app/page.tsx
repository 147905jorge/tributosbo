"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Search, Calculator, FileText, Truck, Shield, Bell,
  Users, ArrowRight, Check, Menu, X, ChevronDown, Globe, Zap
} from "lucide-react"

const TOOLS = [
  { icon: Search,      color: "#0F2B5B", bg: "#e8edf5", label: "Buscador NANDINA",        desc: "Consulta códigos arancelarios con autocompletado y tributos en tiempo real." },
  { icon: Calculator,  color: "#0D7A3E", bg: "#d6f0e2", label: "Calculadora de Tributos",  desc: "Calcula GA, IVA e ICE sobre el valor CIF. Resultado en USD y bolivianos." },
  { icon: FileText,    color: "#1E6FD9", bg: "#ddeeff", label: "Consulta DIM / Click",     desc: "Estado de tu declaración aduanera desde el portal Click de la Aduana Nacional." },
  { icon: FileText,    color: "#4F46E5", bg: "#ede9fe", label: "Generador de Planillas",   desc: "Crea planillas y cotizaciones con el logo y datos de tu agencia." },
  { icon: Truck,       color: "#C8500A", bg: "#fde8d8", label: "Rastreador de Envíos",     desc: "Seguimiento de guías DHL, FedEx, UPS, Maersk y AWB en tiempo real." },
  { icon: Shield,      color: "#7C3AED", bg: "#ede9fe", label: "Seguimiento de Trámites",  desc: "Gestiona el estado de todas tus declaraciones activas en un solo panel." },
  { icon: Bell,        color: "#059669", bg: "#d1fae5", label: "Alertas WhatsApp",         desc: "Notifica a tus clientes automáticamente sobre el estado de sus trámites." },
  { icon: Users,       color: "#DB2777", bg: "#fce7f3", label: "CRM de Clientes",          desc: "Gestiona tu cartera de importadores con historial y documentos." },
]

const FAQS = [
  { q: "¿Puedo probar la plataforma sin pagar?",   a: "Sí. Ofrecemos 14 días de prueba gratuita sin tarjeta de crédito. Accedes a todas las funciones del plan Pro durante ese período." },
  { q: "¿Mis clientes ven mi logo y mis datos?",   a: "Exactamente. Cada agencia configura su logo, colores y datos corporativos. Tus clientes ven tu marca en cada documento generado." },
  { q: "¿Cómo funciona la integración WhatsApp?",  a: "Conectas tu número de WhatsApp escaneando un código QR una sola vez. Desde ahí, la plataforma envía notificaciones automáticas a tus clientes." },
  { q: "¿Los datos NANDINA están actualizados?",   a: "Sí. La base de datos NANDINA refleja la nomenclatura arancelaria vigente de la Comunidad Andina con GA, IVA, ICE y permisos previos." },
  { q: "¿Puedo usar TributosBO en mis fronteras?", a: "Sí. Las herramientas funcionan para todas las aduanas de Bolivia: Tambo Quemado, Desaguadero, Pisiga, Puerto Suárez, Yacuiba, Villazón y más." },
]

const TRAMITES_DEMO = [
  { dim: "DIM-2024-8842", empresa: "Logística Global S.A.",  canal: "VERDE",    color: "#0D7A3E" },
  { dim: "DIM-2024-5542", empresa: "Importaciones El Roble", canal: "ROJO",     color: "#B91C1C" },
  { dim: "DIM-2024-3112", empresa: "Textiles Andinos Ltda.", canal: "AMARILLO", color: "#D97706" },
]

export default function LandingPage() {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)
  const [billing,   setBilling]   = useState<"mensual" | "anual">("mensual")

  const prices = { basico: billing === "mensual" ? 29 : 23, pro: billing === "mensual" ? 59 : 47, agencia: billing === "mensual" ? 99 : 79 }

  return (
    <div style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)", minHeight: "100vh", background: "#fff" }}>

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", padding: "0 16px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, background: "#0F2B5B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>TB</span>
            </div>
            <span style={{ fontWeight: 600, color: "#0F2B5B", fontSize: 18 }}>TributosBO</span>
          </Link>

          <nav style={{ display: "flex", gap: 24, alignItems: "center" }} className="hidden-mobile">
            {["#herramientas:Herramientas","#precios:Precios","#faq:FAQ"].map(s => {
              const [href, label] = s.split(":")
              return <a key={href} href={href} style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>{label}</a>
            })}
          </nav>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }} className="hidden-mobile">
            <Link href="/app/dashboard" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }}>Iniciar sesión</Link>
            <Link href="/app/dashboard" style={{ background: "#1E6FD9", color: "#fff", fontSize: 14, fontWeight: 500, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              Prueba gratis 14 días
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 8 }} className="show-mobile">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background: "#fff", borderTop: "1px solid #E2E8F0", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <a href="#herramientas" style={{ color: "#475569", fontSize: 14, textDecoration: "none" }} onClick={() => setMenuOpen(false)}>Herramientas</a>
            <a href="#precios"      style={{ color: "#475569", fontSize: 14, textDecoration: "none" }} onClick={() => setMenuOpen(false)}>Precios</a>
            <a href="#faq"          style={{ color: "#475569", fontSize: 14, textDecoration: "none" }} onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/app/dashboard" style={{ background: "#1E6FD9", color: "#fff", fontSize: 14, fontWeight: 500, padding: "10px 16px", borderRadius: 8, textDecoration: "none", textAlign: "center" }}>
              Prueba gratis 14 días
            </Link>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 768px) { .hidden-mobile { display: none !important; } }
        @media (min-width: 769px) { .show-mobile { display: none !important; } }
        .tool-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
        .tool-card { transition: transform 0.2s, box-shadow 0.2s; }
        .faq-btn:hover { background: #F8FAFC; }
        .cta-btn:hover { background: #1558B0 !important; }
        .outline-btn:hover { background: #F8FAFC; }
        a { transition: opacity 0.15s; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #fff 50%, #EFF6FF 100%)", padding: "80px 16px 96px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>

            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", color: "#1E6FD9", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 99, border: "1px solid #BFDBFE", marginBottom: 24 }}>
              <Zap size={12} /> Plataforma aduanera para Bolivia y Latinoamérica
            </span>

            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: "#0F2B5B", lineHeight: 1.15, marginBottom: 24, letterSpacing: "-0.02em" }}>
              Todas las herramientas{" "}
              <span style={{ color: "#1E6FD9" }}>aduaneras</span>{" "}
              en un solo lugar
            </h1>

            <p style={{ fontSize: 18, color: "#475569", marginBottom: 36, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
              Calculadora NANDINA, consulta de DIM, rastreador de envíos, generador de planillas y WhatsApp integrado. Para agencias despachantes y equipos de logística.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
              <Link href="/app/dashboard" className="cta-btn"
                style={{ background: "#1E6FD9", color: "#fff", fontWeight: 600, padding: "14px 32px", borderRadius: 10, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                Comenzar prueba gratis <ArrowRight size={16} />
              </Link>
              <a href="#herramientas" className="outline-btn"
                style={{ border: "1.5px solid #E2E8F0", color: "#0F2B5B", fontWeight: 500, padding: "14px 32px", borderRadius: 10, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15 }}>
                Ver herramientas
              </a>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
              {[{ v: "400+", l: "Agencias en Bolivia" }, { v: "GRATIS", l: "14 días de prueba" }, { v: "100%", l: "Web, sin instalar" }].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#0F2B5B" }}>{s.v}</div>
                  <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div style={{ marginTop: 64, maxWidth: 900, margin: "64px auto 0" }}>
            <div style={{ background: "#0F2B5B", borderRadius: 16, padding: 4, boxShadow: "0 32px 64px rgba(15,43,91,0.25)" }}>
              <div style={{ background: "#F8FAFC", borderRadius: 13, overflow: "hidden" }}>
                {/* Browser bar */}
                <div style={{ background: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#E2E8F0","#E2E8F0","#E2E8F0"].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <div style={{ flex: 1, background: "#F8FAFC", borderRadius: 6, padding: "3px 12px", fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>
                    tributosbo.vercel.app/app/dashboard
                  </div>
                </div>
                {/* Fake dashboard */}
                <div style={{ display: "flex", height: 280 }}>
                  <div style={{ width: 180, background: "#0F2B5B", padding: 16, flexShrink: 0 }}>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 12 }}>TributosBO</div>
                    {["Dashboard","NANDINA","Calculadora","Trámites","Planillas"].map((item, i) => (
                      <div key={item} style={{ fontSize: 12, padding: "6px 8px", borderRadius: 6, marginBottom: 2, background: i === 0 ? "#1E6FD9" : "transparent", color: i === 0 ? "#fff" : "#94A3B8" }}>
                        {item}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, padding: 16, background: "#F8FAFC" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      {[{n:"1,284",l:"Consultas"},{n:"342",l:"Planillas"},{n:"89",l:"Trámites"},{n:"512",l:"Clientes"}].map(k => (
                        <div key={k.l} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B", fontFamily: "monospace" }}>{k.n}</div>
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {TRAMITES_DEMO.map(t => (
                        <div key={t.dim} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `3px solid ${t.color}` }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F2B5B", fontFamily: "monospace" }}>{t.dim}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8" }}>{t.empresa}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: t.color, color: "#fff" }}>{t.canal}</span>
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

      {/* ── HERRAMIENTAS ── */}
      <section id="herramientas" style={{ padding: "96px 16px", background: "#fff" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>HERRAMIENTAS</span>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, color: "#0F2B5B", marginTop: 12, marginBottom: 16 }}>Todo lo que necesitas para operar</h2>
            <p style={{ color: "#475569", maxWidth: 480, margin: "0 auto" }}>Herramientas especializadas para cada etapa del comercio exterior boliviano.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {TOOLS.map(tool => (
              <div key={tool.label} className="tool-card"
                style={{ background: "#fff", border: "1px solid #E2E8F0", borderTop: `3px solid ${tool.color}`, borderRadius: 12, padding: "20px 20px 24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: tool.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <tool.icon size={20} color={tool.color} />
                </div>
                <h3 style={{ fontWeight: 600, color: "#0F2B5B", fontSize: 14, marginBottom: 8 }}>{tool.label}</h3>
                <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section style={{ padding: "96px 16px", background: "#0F2B5B" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="demo-grid">
          <div>
            <span style={{ color: "#7C94CA", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>DEMO EN VIVO</span>
            <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, color: "#fff", marginTop: 12, marginBottom: 16 }}>Prueba la calculadora ahora mismo</h2>
            <p style={{ color: "#94A3B8", lineHeight: 1.7, marginBottom: 24 }}>Sin registrarte. Ingresa el valor CIF y el código NANDINA y obtén el desglose completo de GA, IVA e ICE.</p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px" }}>
              {["Resultado en menos de 1 segundo","Tipo de cambio BCB incluido","Genera cotización PDF con tu logo","Envía resultado por WhatsApp"].map(item => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: "#E2E8F0", fontSize: 14, marginBottom: 10 }}>
                  <Check size={16} color="#0D7A3E" style={{ flexShrink: 0 }} />{item}
                </li>
              ))}
            </ul>
            <Link href="/app/calculadora" className="cta-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1E6FD9", color: "#fff", fontWeight: 500, padding: "12px 24px", borderRadius: 8, textDecoration: "none", fontSize: 14 }}>
              Abrir calculadora completa <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontWeight: 600, color: "#0F2B5B", marginBottom: 16, fontSize: 14 }}>Cálculo de Tributos</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6 }}>Valor CIF (USD)</label>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "monospace", color: "#0F2B5B", background: "#F8FAFC" }}>$ 25,000.00</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{l:"GA",v:"15%"},{l:"IVA",v:"14.94%"}].map(f => (
                <div key={f.l}>
                  <label style={{ fontSize: 11, color: "#475569", fontWeight: 600, display: "block", marginBottom: 6 }}>{f.l}</label>
                  <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "monospace", color: "#0F2B5B", background: "#F8FAFC" }}>{f.v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, border: "1px solid #E2E8F0" }}>
              {[{l:"GA (15%)", v:"$ 3,750.00", c:"#0D7A3E"},{l:"IVA (14.94%)", v:"$ 4,237.35", c:"#1E6FD9"},{l:"Total tributos", v:"$ 7,987.35", c:"#0F2B5B", b:true},{l:"Total en BOB", v:"Bs. 55,572.12", c:"#0F2B5B", b:true}].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: row.b ? "1px solid #E2E8F0" : "none", marginTop: row.b ? 8 : 0 }}>
                  <span style={{ fontSize: 13, color: "#475569" }}>{row.l}</span>
                  <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: row.b ? 700 : 500, color: row.c }}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){.demo-grid{grid-template-columns:1fr!important}}`}</style>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" style={{ padding: "96px 16px", background: "#F8FAFC" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>PRECIOS</span>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, color: "#0F2B5B", marginTop: 12, marginBottom: 24 }}>Planes para cada tamaño de agencia</h2>
            <div style={{ display: "inline-flex", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 99, padding: 4 }}>
              {(["mensual","anual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ padding: "6px 20px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: billing === b ? "#0F2B5B" : "transparent", color: billing === b ? "#fff" : "#475569" }}>
                  {b === "mensual" ? "Mensual" : "Anual −20%"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { label:"Básico",  price: prices.basico,  dark: false, popular: false, features:["Buscador NANDINA","Calculadora de tributos","Consulta DIM / Click","1 usuario"] },
              { label:"Pro",     price: prices.pro,     dark: true,  popular: true,  features:["Todo del plan Básico","Planillas PDF white-label","Notificaciones WhatsApp","Rastreador de envíos","3 usuarios"] },
              { label:"Agencia", price: prices.agencia, dark: false, popular: false, features:["Todo del plan Pro","Subdominio propio","Analytics avanzado","CRM de clientes","10 usuarios"] },
            ].map(plan => (
              <div key={plan.label} style={{ position: "relative", background: plan.dark ? "#0F2B5B" : "#fff", border: `1px solid ${plan.dark ? "#0F2B5B" : "#E2E8F0"}`, borderRadius: 16, padding: 24 }}>
                {plan.popular && <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#1E6FD9", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 99 }}>MÁS POPULAR</span>}
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: plan.dark ? "#7C94CA" : "#475569", marginBottom: 12 }}>{plan.label}</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: plan.dark ? "#fff" : "#0F2B5B", marginBottom: 4 }}>${plan.price}</div>
                <div style={{ fontSize: 13, color: plan.dark ? "#7C94CA" : "#94A3B8", marginBottom: 24 }}>USD / mes</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.dark ? "#E2E8F0" : "#475569", marginBottom: 10 }}>
                      <Check size={14} color="#0D7A3E" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/app/dashboard"
                  style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 500, background: plan.dark ? "#1E6FD9" : "transparent", color: plan.dark ? "#fff" : "#0F2B5B", border: plan.dark ? "none" : "1px solid #E2E8F0" }}>
                  Comenzar gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 16px", background: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: "#1E6FD9", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>FAQ</span>
            <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2rem)", fontWeight: 700, color: "#0F2B5B", marginTop: 12 }}>Preguntas frecuentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, color: "#0F2B5B" }}>
                  {faq.q}
                  <ChevronDown size={16} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 16, transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: "12px 20px 16px", fontSize: 14, color: "#475569", lineHeight: 1.7, borderTop: "1px solid #E2E8F0" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: "80px 16px", background: "linear-gradient(135deg, #0F2B5B 0%, #1E3A6E 100%)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Empieza hoy, sin tarjeta de crédito</h2>
          <p style={{ color: "#94A3B8", marginBottom: 32, lineHeight: 1.7 }}>14 días con todas las funciones del plan Pro. Sin compromisos.</p>
          <Link href="/app/dashboard" className="cta-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#0F2B5B", fontWeight: 600, padding: "14px 32px", borderRadius: 10, textDecoration: "none", fontSize: 15 }}>
            Crear cuenta gratuita <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0F2B5B", padding: "48px 16px" }}>
        <div style={{ maxWidth: 1152, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32, marginBottom: 32 }} className="footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#0F2B5B", fontSize: 11, fontWeight: 700 }}>TB</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>TributosBO</span>
              </div>
              <p style={{ color: "#7C94CA", fontSize: 13, lineHeight: 1.6 }}>Plataforma de herramientas aduaneras para Bolivia y Latinoamérica.</p>
            </div>
            {[{t:"Producto",l:["Herramientas","Precios","API"]},{t:"Empresa",l:["Nosotros","Blog","Contacto"]},{t:"Legal",l:["Privacidad","Términos","Cookies"]}].map(col => (
              <div key={col.t}>
                <h5 style={{ color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{col.t}</h5>
                {col.l.map(l => <div key={l} style={{ marginBottom: 8 }}><a href="#" style={{ color: "#7C94CA", fontSize: 14, textDecoration: "none" }}>{l}</a></div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1A3560", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ color: "#7C94CA", fontSize: 13 }}>© 2026 TributosBO. Todos los derechos reservados.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#7C94CA", fontSize: 13 }}>
              <Globe size={12} /> Bolivia · Latinoamérica
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr!important}}`}</style>
      </footer>
    </div>
  )
}
