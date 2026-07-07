import Link from "next/link"

export default function TerminosPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#0F172A", background: "#fff", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, background: "#0F2B5B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>TB</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0F2B5B", margin: "0 0 8px" }}>Términos de Servicio</h1>
        <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 48px" }}>Última actualización: junio 2025</p>

        {[
          {
            title: "1. Aceptación de los términos",
            body: "Al acceder y utilizar TributosBO, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio."
          },
          {
            title: "2. Descripción del servicio",
            body: "TributosBO es una plataforma SaaS de herramientas aduaneras diseñada para agencias despachantes, importadores y exportadores en Bolivia. Ofrecemos buscador NANDINA, calculadora de tributos, seguimiento de trámites, generador de planillas y herramientas de comunicación con clientes."
          },
          {
            title: "3. Cuentas de usuario",
            body: "Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta. Nos reservamos el derecho de cancelar cuentas que violen estos términos."
          },
          {
            title: "4. Planes y facturación",
            body: "Ofrecemos planes de suscripción mensual y anual. Los pagos se procesan a través de Stripe. Puedes cancelar tu suscripción en cualquier momento desde tu panel de facturación. La cancelación entrará en vigor al final del período de facturación actual. No realizamos reembolsos por períodos parciales."
          },
          {
            title: "5. Prueba gratuita",
            body: "Ofrecemos 14 días de prueba gratuita sin necesidad de tarjeta de crédito. Al finalizar el período de prueba, deberás suscribirte a un plan de pago para continuar utilizando el servicio. Las cuentas inactivas al final del período de prueba pueden ser eliminadas."
          },
          {
            title: "6. Uso aceptable",
            body: "Aceptas no utilizar el servicio para actividades ilegales, enviar spam, intentar acceder sin autorización a otros sistemas, o interferir con el funcionamiento normal del servicio. Nos reservamos el derecho de suspender cuentas que violen estas condiciones."
          },
          {
            title: "7. Propiedad intelectual",
            body: "El servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de TributosBO y sus licenciantes. Nuestras marcas comerciales no pueden ser utilizadas sin nuestro previo consentimiento por escrito."
          },
          {
            title: "8. Limitación de responsabilidad",
            body: "TributosBO no será responsable por daños indirectos, incidentales, especiales o consecuentes. La plataforma se proporciona 'tal cual', sin garantías de disponibilidad continua. Los datos arancelarios se actualizan periódicamente pero no garantizamos su exactitud absoluta en todo momento."
          },
          {
            title: "9. Modificaciones",
            body: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos por correo electrónico ante cambios significativos. El uso continuado del servicio después de dichos cambios constituye tu aceptación de los nuevos términos."
          },
          {
            title: "10. Contacto",
            body: "Si tienes preguntas sobre estos Términos de Servicio, contáctanos por WhatsApp o al correo electrónico registrado en tu cuenta."
          },
        ].map(sec => (
          <section key={sec.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B", margin: "0 0 10px" }}>{sec.title}</h2>
            <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.75, margin: 0 }}>{sec.body}</p>
          </section>
        ))}

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #E2E8F0" }}>
          <Link href="/" style={{ color: "#1E6FD9", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            ← Volver al inicio
          </Link>
          {" · "}
          <Link href="/privacidad" style={{ color: "#1E6FD9", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            Política de Privacidad
          </Link>
        </div>
      </main>
    </div>
  )
}
