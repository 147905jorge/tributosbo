import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"

export default function VencidoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: "#FEF2F2", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <AlertTriangle size={32} style={{ color: "#B91C1C" }} />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F2B5B", margin: "0 0 12px" }}>
          Tu período de prueba ha vencido
        </h1>
        <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 32px" }}>
          Para continuar usando TributosBO elige el plan que mejor se adapte a tu agencia.
          Tus datos están seguros y no se han eliminado.
        </p>

        {/* Planes simplificados */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { name: "Básico",  price: 29,  color: "#475569", features: ["NANDINA","Calculadora","DIM","1 usuario"] },
            { name: "Pro",     price: 59,  color: "#1E6FD9", features: ["Todo Básico","Planillas PDF","WhatsApp","3 usuarios"], popular: true },
            { name: "Agencia", price: 99,  color: "#7C3AED", features: ["Todo Pro","Subdominio","Analytics","10 usuarios"] },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.popular ? "#0F2B5B" : "#fff", border: `1.5px solid ${plan.popular ? "#0F2B5B" : "#E2E8F0"}`, borderRadius: 14, padding: "20px 16px", position: "relative" }}>
              {plan.popular && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#1E6FD9", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap" }}>
                  MÁS POPULAR
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: plan.popular ? "#7C94CA" : "#475569", marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: plan.popular ? "#fff" : "#0F2B5B", margin: "0 0 4px" }}>${plan.price}</div>
              <div style={{ fontSize: 11, color: plan.popular ? "#7C94CA" : "#94A3B8", marginBottom: 16 }}>USD/mes</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 11, color: plan.popular ? "rgba(255,255,255,0.8)" : "#475569", marginBottom: 6 }}>✓ {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <a href="https://wa.me/59172030560?text=Quiero+suscribirme+a+TributosBO"
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0D7A3E", color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 12, textDecoration: "none", marginBottom: 16 }}>
          Contratar ahora <ArrowRight size={18} />
        </a>
        <div>
          <Link href="/app/dashboard" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none" }}>
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
