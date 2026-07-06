// Qué incluye cada plan
const FEATURES: Record<string, string[]> = {
  basico:     ["nandina", "calculadora", "click", "dashboard", "descripciones", "asistencia"],
  pro:        ["nandina", "calculadora", "click", "dashboard", "descripciones", "declaraciones", "planillas", "tramites", "contabilidad", "archivo", "rastreador", "alertas", "bot", "asistencia"],
  agencia:    ["nandina", "calculadora", "click", "dashboard", "descripciones", "declaraciones", "planillas", "tramites", "contabilidad", "archivo", "rastreador", "alertas", "clientes", "config", "usuarios", "perfil", "bot", "asistencia"],
  enterprise: ["nandina", "calculadora", "click", "dashboard", "descripciones", "declaraciones", "planillas", "tramites", "contabilidad", "archivo", "rastreador", "alertas", "clientes", "config", "usuarios", "perfil", "bot", "asistencia"],
}

export function planPermite(plan: string, feature: string): boolean {
  const features = FEATURES[plan] ?? FEATURES.basico
  return features.includes(feature)
}

export function getPlanLabel(plan: string): string {
  return { basico: "Básico", pro: "Pro", agencia: "Agencia", enterprise: "Enterprise" }[plan] ?? plan
}

export const PLAN_UPGRADE_MSG: Record<string, string> = {
  declaraciones: "El módulo de Declaraciones DAM/DIM está disponible desde el plan Pro.",
  planillas:  "El Generador de Planillas está disponible desde el plan Pro.",
  tramites:   "El Seguimiento de Trámites está disponible desde el plan Pro.",
  rastreador: "El Rastreador está disponible desde el plan Pro.",
  alertas:    "Las Alertas WhatsApp están disponibles desde el plan Pro.",
  clientes:   "El CRM de Clientes está disponible desde el plan Agencia.",
  config:     "La Configuración White-Label está disponible desde el plan Agencia.",
  usuarios:   "La Gestión de Usuarios está disponible desde el plan Agencia.",
  bot:        "ADEX IA está disponible desde el plan Pro.",
}
