import Link from "next/link"

export default function PrivacidadPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#0F172A", background: "#fff", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 34, height: 34, background: "#0F2B5B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>TB</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0F2B5B" }}>TributosBO</span>
        </Link>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0F2B5B", margin: "0 0 8px" }}>Política de Privacidad</h1>
        <p style={{ color: "#94A3B8", fontSize: 14, margin: "0 0 48px" }}>Última actualización: junio 2025</p>

        {[
          {
            title: "1. Información que recopilamos",
            body: "Recopilamos información que nos proporcionas directamente al crear tu cuenta: nombre, correo electrónico y datos de tu empresa. También recopilamos datos de uso como trámites registrados, planillas generadas y consultas realizadas, exclusivamente para el funcionamiento del servicio."
          },
          {
            title: "2. Cómo usamos tu información",
            body: "Usamos tu información para: proporcionar y mejorar el servicio, procesar pagos, enviarte notificaciones importantes sobre tu cuenta, y responder a tus consultas de soporte. No vendemos ni compartimos tu información personal con terceros para fines de marketing."
          },
          {
            title: "3. Datos de clientes",
            body: "La información de tus clientes (importadores, exportadores) que ingreses en la plataforma es exclusivamente tuya. Nosotros solo la almacenamos para que puedas acceder a ella. No accedemos a estos datos salvo para resolver problemas técnicos con tu autorización."
          },
          {
            title: "4. Procesamiento de pagos",
            body: "Los pagos son procesados por Stripe. No almacenamos información de tarjetas de crédito en nuestros servidores. Stripe maneja todos los datos de pago bajo sus propias políticas de seguridad y cumplimiento PCI-DSS."
          },
          {
            title: "5. Seguridad de los datos",
            body: "Implementamos medidas técnicas y organizativas para proteger tu información: transmisión cifrada mediante HTTPS, contraseñas almacenadas con hash bcrypt, tokens JWT con expiración, backups automáticos diarios y acceso restringido a la base de datos."
          },
          {
            title: "6. Retención de datos",
            body: "Conservamos tu información mientras tu cuenta esté activa. Si cancelas tu cuenta, eliminaremos tus datos personales en un plazo de 30 días, excepto donde la ley nos obligue a conservarlos por más tiempo."
          },
          {
            title: "7. Tus derechos",
            body: "Tienes derecho a: acceder a los datos que tenemos sobre ti, corregir información inexacta, solicitar la eliminación de tu cuenta y datos, y exportar tu información. Para ejercer estos derechos, contáctanos por los canales de soporte."
          },
          {
            title: "8. Cookies",
            body: "Usamos cookies estrictamente necesarias para mantener tu sesión activa. No usamos cookies de rastreo de terceros para publicidad. Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del servicio."
          },
          {
            title: "9. Cambios en esta política",
            body: "Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico ante cambios importantes. La fecha de última actualización siempre aparece al inicio de este documento."
          },
          {
            title: "10. Contacto",
            body: "Para preguntas sobre privacidad o para ejercer tus derechos, contáctanos por WhatsApp o al correo electrónico registrado en tu cuenta de TributosBO."
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
          <Link href="/terminos" style={{ color: "#1E6FD9", fontSize: 14, textDecoration: "none", fontWeight: 600 }}>
            Términos de Servicio
          </Link>
        </div>
      </main>
    </div>
  )
}
