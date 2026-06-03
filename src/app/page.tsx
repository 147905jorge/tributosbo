"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, Calculator, FileText, Truck, Shield, Bell, Users, ArrowRight, Check, Menu, X, ChevronDown, Globe, Zap } from "lucide-react"
import s from "./page.module.css"

const TOOLS = [
  { icon: Search,     color: "#0F2B5B", bg: "#e8edf5", label: "Buscador NANDINA",       desc: "Consulta códigos arancelarios con autocompletado y tributos en tiempo real." },
  { icon: Calculator, color: "#0D7A3E", bg: "#dcf5e7", label: "Calculadora de Tributos", desc: "Calcula GA, IVA e ICE sobre el valor CIF. Resultado en USD y bolivianos." },
  { icon: FileText,   color: "#1E6FD9", bg: "#ddeeff", label: "Consulta DIM / Click",    desc: "Estado de tu declaración aduanera desde el portal Click de la Aduana Nacional." },
  { icon: FileText,   color: "#4F46E5", bg: "#ede9fe", label: "Generador de Planillas",  desc: "Crea planillas y cotizaciones con el logo y datos de tu agencia." },
  { icon: Truck,      color: "#C8500A", bg: "#fde8d8", label: "Rastreador de Envíos",    desc: "Seguimiento de guías DHL, FedEx, UPS, Maersk y AWB en tiempo real." },
  { icon: Shield,     color: "#7C3AED", bg: "#ede9fe", label: "Seguimiento de Trámites", desc: "Gestiona el estado de todas tus declaraciones activas en un solo panel." },
  { icon: Bell,       color: "#059669", bg: "#d1fae5", label: "Alertas WhatsApp",        desc: "Notifica a tus clientes automáticamente sobre el estado de sus trámites." },
  { icon: Users,      color: "#DB2777", bg: "#fce7f3", label: "CRM de Clientes",         desc: "Gestiona tu cartera de importadores con historial y documentos." },
]

const TRAMITES = [
  { dim: "DIM-2024-8842", emp: "Logística Global S.A.",  canal: "VERDE",    color: "#0D7A3E" },
  { dim: "DIM-2024-5542", emp: "Importaciones El Roble", canal: "ROJO",     color: "#B91C1C" },
  { dim: "DIM-2024-3112", emp: "Textiles Andinos Ltda.", canal: "AMARILLO", color: "#D97706" },
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
  const prices = { basico: billing === "mensual" ? 29 : 23, pro: billing === "mensual" ? 59 : 47, agencia: billing === "mensual" ? 99 : 79 }

  return (
    <div className={s.page}>

      {/* NAVBAR */}
      <header>
        <nav className={s.navbar}>
          <div className={s.navInner}>
            <Link href="/" className={s.logo}>
              <div className={s.logoMark}>TB</div>
              <span className={s.logoText}>TributosBO</span>
            </Link>
            <div className={s.navLinks}>
              <a href="#herramientas" className={s.navLink}>Herramientas</a>
              <a href="#precios"      className={s.navLink}>Precios</a>
              <a href="#faq"          className={s.navLink}>FAQ</a>
            </div>
            <div className={s.navActions}>
              <Link href="/app/dashboard" className={s.navLoginLink}>Iniciar sesión</Link>
              <Link href="/app/dashboard" className={s.btnPrimary}>Prueba gratis 14 días</Link>
            </div>
            <button className={s.mobileMenuBtn} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className={s.mobileMenu}>
            <a href="#herramientas" className={s.mobileNavLink} onClick={() => setMenuOpen(false)}>Herramientas</a>
            <a href="#precios"      className={s.mobileNavLink} onClick={() => setMenuOpen(false)}>Precios</a>
            <a href="#faq"          className={s.mobileNavLink} onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/app/dashboard" className={s.btnPrimary} onClick={() => setMenuOpen(false)}>Prueba gratis 14 días</Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroContent}>
            <div className={s.heroBadge}><Zap size={12} /> Plataforma aduanera para Bolivia y Latinoamérica</div>
            <h1 className={s.heroTitle}>
              Todas las herramientas{" "}
              <span className={s.heroAccent}>aduaneras</span>{" "}
              en un solo lugar
            </h1>
            <p className={s.heroDesc}>
              Calculadora NANDINA, consulta de DIM, rastreador de envíos, generador de planillas y WhatsApp integrado. Para agencias despachantes y equipos de logística.
            </p>
            <div className={s.heroCtas}>
              <Link href="/app/dashboard" className={s.btnHeroPrimary}>
                Comenzar prueba gratis <ArrowRight size={16} />
              </Link>
              <a href="#herramientas" className={s.btnHeroOutline}>Ver herramientas</a>
            </div>
            <div className={s.heroStats}>
              {[{v:"400+",l:"Agencias en Bolivia"},{v:"GRATIS",l:"14 días de prueba"},{v:"100%",l:"Web, sin instalar"}].map(st => (
                <div key={st.l} className={s.heroStat}>
                  <div className={s.heroStatValue}>{st.v}</div>
                  <div className={s.heroStatLabel}>{st.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div className={s.heroMockup}>
            <div className={s.mockupShell}>
              <div className={s.mockupInner}>
                <div className={s.mockupBar}>
                  <div className={s.mockupDots}>
                    {[0,1,2].map(i => <div key={i} className={s.mockupDot} />)}
                  </div>
                  <div className={s.mockupUrl}>tributosbo.vercel.app/app/dashboard</div>
                </div>
                <div className={s.mockupBody}>
                  <div className={s.mockupSidebar}>
                    <div className={s.mockupSidebarTitle}>Menu</div>
                    {["Dashboard","NANDINA","Calculadora","Trámites","Planillas"].map((item, i) => (
                      <div key={item} className={`${s.mockupNavItem} ${i === 0 ? s.mockupNavItemActive : ""}`}>{item}</div>
                    ))}
                  </div>
                  <div className={s.mockupContent}>
                    <div className={s.mockupKpis}>
                      {[{n:"1,284",l:"Consultas"},{n:"342",l:"Planillas"},{n:"89",l:"Trámites"},{n:"512",l:"Clientes"}].map(k => (
                        <div key={k.l} className={s.mockupKpi}>
                          <div className={s.mockupKpiValue}>{k.n}</div>
                          <div className={s.mockupKpiLabel}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className={s.mockupRows}>
                      {TRAMITES.map(t => (
                        <div key={t.dim} className={s.mockupRow} style={{ borderLeftColor: t.color }}>
                          <div>
                            <div className={s.mockupRowDim}>{t.dim}</div>
                            <div className={s.mockupRowEmp}>{t.emp}</div>
                          </div>
                          <span className={s.mockupBadge} style={{ background: t.color }}>{t.canal}</span>
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
      <section id="herramientas" className={`${s.section} ${s.sectionLight}`}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <div className={s.sectionTag}>HERRAMIENTAS</div>
            <h2 className={s.sectionTitle}>Todo lo que necesitas para operar</h2>
            <p className={s.sectionDesc}>Herramientas especializadas para cada etapa del comercio exterior boliviano.</p>
          </div>
          <div className={s.toolsGrid}>
            {TOOLS.map(tool => (
              <div key={tool.label} className={s.toolCard} style={{ borderTopColor: tool.color }}>
                <div className={s.toolIcon} style={{ background: tool.bg }}>
                  <tool.icon size={20} color={tool.color} />
                </div>
                <h3 className={s.toolTitle}>{tool.label}</h3>
                <p className={s.toolDesc}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className={`${s.section} ${s.sectionDark}`}>
        <div className={s.container}>
          <div className={s.demoGrid}>
            <div className={s.demoText}>
              <div className={s.sectionTag} style={{ color: "#93C5FD" }}>DEMO EN VIVO</div>
              <h2 className={`${s.sectionTitle} ${s.sectionTitleLight}`} style={{ textAlign: "left", marginBottom: 16 }}>
                Prueba la calculadora ahora mismo
              </h2>
              <p className={`${s.sectionDesc} ${s.sectionDescLight}`} style={{ margin: "0 0 24px", textAlign: "left" }}>
                Sin registrarte. Ingresa el valor CIF y obtén el desglose completo de GA, IVA e ICE en segundos.
              </p>
              <ul className={s.demoFeatures}>
                {["Resultado en menos de 1 segundo","Tipo de cambio BCB del día incluido","Genera cotización PDF con tu logo","Envía resultado por WhatsApp"].map(f => (
                  <li key={f} className={s.demoFeature}><Check size={16} className={s.demoCheck} />{f}</li>
                ))}
              </ul>
              <Link href="/app/calculadora" className={s.btnPrimary}>
                Abrir calculadora completa <ArrowRight size={14} />
              </Link>
            </div>
            <div className={s.demoCard}>
              <p className={s.demoCardTitle}>Cálculo de Tributos</p>
              <div className={s.demoField}>
                <label className={s.demoLabel}>Valor CIF (USD)</label>
                <div className={s.demoInput}>$ 25,000.00</div>
              </div>
              <div className={s.demoRow}>
                <div className={s.demoField}>
                  <label className={s.demoLabel}>GA</label>
                  <div className={s.demoInput}>15%</div>
                </div>
                <div className={s.demoField}>
                  <label className={s.demoLabel}>IVA</label>
                  <div className={s.demoInput}>14.94%</div>
                </div>
              </div>
              <div className={s.demoResult}>
                {[
                  { l: "GA (15%)",       v: "$ 3,750.00",    c: "#0D7A3E", bold: false },
                  { l: "IVA (14.94%)",   v: "$ 4,237.35",    c: "#1E6FD9", bold: false },
                  { l: "Total tributos", v: "$ 7,987.35",    c: "#0F2B5B", bold: true },
                  { l: "Total en BOB",   v: "Bs. 55,572.12", c: "#0F2B5B", bold: true },
                ].map(row => (
                  <div key={row.l} className={`${s.demoResultRow} ${row.bold ? s.demoResultTotal : ""}`}>
                    <span className={s.demoResultLabel}>{row.l}</span>
                    <span className={s.demoResultValue} style={{ color: row.c }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className={`${s.section} ${s.sectionGray}`}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <div className={s.sectionTag}>PRECIOS</div>
            <h2 className={s.sectionTitle}>Planes para cada tamaño de agencia</h2>
            <div className={s.pricingToggle}>
              {(["mensual","anual"] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`${s.pricingToggleBtn} ${billing === b ? s.pricingToggleBtnActive : ""}`}>
                  {b === "mensual" ? "Mensual" : <span>Anual <span className={s.pricingDiscount}>−20%</span></span>}
                </button>
              ))}
            </div>
          </div>
          <div className={s.pricingGrid}>
            {[
              { label:"Básico",  price: prices.basico,  pop: false, features:["Buscador NANDINA","Calculadora de tributos","Consulta DIM / Click","1 usuario"] },
              { label:"Pro",     price: prices.pro,     pop: true,  features:["Todo del plan Básico","Planillas PDF white-label","Notificaciones WhatsApp","Rastreador de envíos","3 usuarios"] },
              { label:"Agencia", price: prices.agencia, pop: false, features:["Todo del plan Pro","Subdominio propio","Analytics avanzado","CRM de clientes","10 usuarios"] },
            ].map(plan => (
              <div key={plan.label} className={`${s.pricingCard} ${plan.pop ? s.pricingCardPopular : ""}`}>
                {plan.pop && <div className={s.pricingPopularBadge}>MÁS POPULAR</div>}
                <p className={`${s.pricingPlanName} ${plan.pop ? s.pricingPlanNameLight : ""}`}>{plan.label}</p>
                <p className={`${s.pricingPrice} ${plan.pop ? s.pricingPriceLight : ""}`}>${plan.price}</p>
                <p className={`${s.pricingPeriod} ${plan.pop ? s.pricingPeriodLight : ""}`}>USD / mes</p>
                <ul className={s.pricingFeatures}>
                  {plan.features.map(f => (
                    <li key={f} className={`${s.pricingFeature} ${plan.pop ? s.pricingFeatureLight : ""}`}>
                      <Check size={14} className={s.pricingCheckIcon} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/app/dashboard" className={`${s.pricingBtn} ${plan.pop ? s.pricingBtnPopular : ""}`}>
                  Comenzar gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`${s.section} ${s.sectionLight}`}>
        <div className={s.container}>
          <div className={s.sectionHeader}>
            <div className={s.sectionTag}>FAQ</div>
            <h2 className={s.sectionTitle}>Preguntas frecuentes</h2>
          </div>
          <div className={s.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} className={s.faqItem}>
                <button className={s.faqBtn} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <ChevronDown size={16} className={`${s.faqChevron} ${openFaq === i ? s.faqChevronOpen : ""}`} />
                </button>
                {openFaq === i && <div className={s.faqAnswer}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={s.ctaSection}>
        <div className={s.container}>
          <h2 className={s.ctaTitle}>Empieza hoy, sin tarjeta de crédito</h2>
          <p className={s.ctaDesc}>14 días con todas las funciones del plan Pro. Sin compromisos.</p>
          <Link href="/app/dashboard" className={s.btnHeroPrimary}>
            Crear cuenta gratuita <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerGrid}>
          <div className={s.footerBrand}>
            <Link href="/" className={s.footerLogo}>
              <div className={s.footerLogoMark}>TB</div>
              <span className={s.footerLogoText}>TributosBO</span>
            </Link>
            <p className={s.footerTagline}>Plataforma de herramientas aduaneras para Bolivia y Latinoamérica.</p>
          </div>
          {[
            { t:"Producto", l:["Herramientas","Precios","API"] },
            { t:"Empresa",  l:["Nosotros","Blog","Contacto"] },
            { t:"Legal",    l:["Privacidad","Términos","Cookies"] },
          ].map(col => (
            <div key={col.t}>
              <p className={s.footerColTitle}>{col.t}</p>
              {col.l.map(l => <a key={l} href="#" className={s.footerLink}>{l}</a>)}
            </div>
          ))}
        </div>
        <div className={s.footerBottom}>
          <p className={s.footerCopy}>© 2026 TributosBO. Todos los derechos reservados.</p>
          <div className={s.footerRegion}><Globe size={12} /> Bolivia · Latinoamérica</div>
        </div>
      </footer>
    </div>
  )
}
