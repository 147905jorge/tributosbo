import type { DAMFormState, DIMFormState, DEXFormState, DAVFormState } from "./_types"

export type ValidationResult = { ok: boolean; errors: string[] }

// Tipos de aduana por codigo (equivalente a columna 5 de ParAdu en el Excel VBA)
// AA = Aeropuerto, FF = Frontera terrestre, EE = Agencia exterior
const AEROPUERTOS = new Set(['211', '311', '711'])
const FRONTERAS = new Set(['221', '241', '421', '422', '521', '542', '543', '621', '641', '643', '721', '722', '741', '841', '921'])

export function isAeropuerto(aduanaCod: string): boolean { return AEROPUERTOS.has(aduanaCod) }
export function isFrontera(aduanaCod: string): boolean { return FRONTERAS.has(aduanaCod) }

// Equivalente a validaA6A7A8 del VBA (frmDatosGenerales.frm:774)
// A6=destinoRegimen, A7=modalidadRegimen, A8=modalidadDespacho
function validaA6A7A8(a6: string, a7: string, a8: string): string {
  if (a8) {
    if (!a7) return "Seleccione Modalidad del Régimen antes de Modalidad de Despacho"
    if (!a6) return "Seleccione Destino/Régimen Aduanero antes de Modalidad de Despacho"
  }
  if (a7) {
    if (!a6) return "Seleccione Destino/Régimen Aduanero antes de Modalidad del Régimen"
    // Los primeros 2 chars del codigo A6 deben coincidir con los primeros 2 de A7
    // Ej: A6="40" y A7="4001" → OK; A6="40" y A7="7000" → ERROR
    if (a6.substring(0, 2) !== a7.substring(0, 2))
      return `Destino Régimen "${a6}" no corresponde a Modalidad "${a7}" (filtro A6/A7)`
  }
  return ""
}

// Equivalente a validaModalidadRegimen del VBA (frmDatosGenerales.frm:723)
function validaModalidadRegimenFrontera(modalidad: string, aduanaDespacho: string): string {
  if (modalidad === '4003' && !isFrontera(aduanaDespacho))
    return "Despacho en Frontera DS 2295 requiere que la Aduana de Despacho sea una frontera"
  return ""
}

// Replica exacta validacion email del VBA (frmProveedor)
function validaEmail(email: string): boolean {
  if (!email) return true
  const atIdx = email.indexOf("@")
  if (atIdx < 0) return false
  const afterAt = email.slice(atIdx + 1)
  if (!afterAt.includes(".")) return false
  if (email.includes("..")) return false
  if (email.endsWith(".")) return false
  return true
}

export function validateDAM(s: DAMFormState): ValidationResult {
  const errors: string[] = []
  if (!s.nroReferencia?.trim()) errors.push("N. Referencia es obligatorio")
  if (!s.nitImportador?.trim()) errors.push("NIT Importador es obligatorio")
  if (!s.aduanaDespacho) errors.push("Aduana de Despacho es obligatoria")
  if (!s.destinoRegimen) errors.push("Destino Régimen Aduanero es obligatorio")

  // verificaAduanaAeropuerto: si NO es aeropuerto, pais transito es obligatorio
  if (s.aduanaDespacho && !isAeropuerto(s.aduanaDespacho) && !s.paisTransito)
    errors.push("País de Tránsito es obligatorio (la aduana de despacho no es aeropuerto)")

  // validaModalidadRegimen: Despacho en Frontera DS 2295 requiere aduana frontera
  const errFrontera = validaModalidadRegimenFrontera(s.modalidadRegimen, s.aduanaDespacho)
  if (errFrontera) errors.push(errFrontera)

  // validaA6A7A8: validacion cruzada destino/modalidad/despacho
  const errA6A7A8 = validaA6A7A8(s.destinoRegimen, s.modalidadRegimen, s.modalidadDespacho)
  if (errA6A7A8) errors.push(errA6A7A8)

  // Deposito: regimen y modalidad post-deposito son obligatorios
  if (['7000', '7001', '7002'].includes(s.modalidadRegimen) && !s.desRegPosCod)
    errors.push("Destino Régimen Post-Depósito es obligatorio para modalidades de depósito")

  // Deposito + SinDescarga: Tipo Mercancía obligatorio (emiParRec=1 = SIN DESCARGA)
  if (['7000', '7001', '7002'].includes(s.modalidadRegimen) && s.emiParRec === "1" && s.tipMercaderia.length === 0)
    errors.push("Tipo Mercancía es obligatorio para régimen Depósito con Emisión Sin Descarga")

  // Validacion email proveedores (replica VBA frmProveedor)
  s.proveedores.forEach((p, i) => {
    if (!p.razonSocial?.trim()) errors.push(`Proveedor #${i + 1}: Razón Social es obligatoria`)
    if (p.email && !validaEmail(p.email)) errors.push(`Proveedor #${i + 1}: Email inválido (verifique @, punto, sin doble punto)`)
  })

  s.docsEmbarque.forEach((d, i) => {
    if (!d.nroDoc?.trim()) errors.push(`Doc. Embarque #${i + 1}: N. BL/AWB/CRT es obligatorio`)
    if (!d.fechaEmbarque) errors.push(`Doc. Embarque #${i + 1}: Fecha Embarque es obligatoria`)
  })
  if (!s.facturas.length) errors.push("Debe tener al menos 1 factura")
  s.facturas.forEach((f, i) => {
    if (!f.nroFactura?.trim()) errors.push(`Factura #${i + 1}: N. Factura es obligatorio`)
    if (!f.fechaFactura) errors.push(`Factura #${i + 1}: Fecha es obligatoria`)
    if (!f.proveedorRazonSocial?.trim()) errors.push(`Factura #${i + 1}: Razon Social del proveedor es obligatoria`)
  })
  if (!s.items.length) errors.push("Debe tener al menos 1 item de mercancia")
  const sinFactura = s.items.filter(i => !i.nroFactura).length
  if (sinFactura > 0) errors.push(`${sinFactura} item(s) sin factura asignada`)
  s.items.forEach((item, i) => {
    if (!item.nandina?.trim()) errors.push(`Item #${i + 1}: Subpartida Nandina es obligatoria`)
    if (!item.cantFisica?.trim()) errors.push(`Item #${i + 1}: Cantidad Fisica es obligatoria`)
  })
  return { ok: errors.length === 0, errors }
}

export function validateDIM(s: DIMFormState): ValidationResult {
  const errors: string[] = []
  if (!s.nroReferencia?.trim()) errors.push("N. Referencia es obligatorio")
  if (!s.nitImportador?.trim()) errors.push("NIT Importador es obligatorio")
  if (!s.aduanaDespacho) errors.push("Aduana de Despacho es obligatoria")
  if (!s.fechaEmbarque) errors.push("Fecha de Embarque es obligatoria")

  // verificaAduanaAeropuerto
  if (s.aduanaDespacho && !isAeropuerto(s.aduanaDespacho) && !s.paisTransito)
    errors.push("País de Tránsito es obligatorio (la aduana de despacho no es aeropuerto)")

  s.proveedores.forEach((p, i) => {
    if (!p.razonSocial?.trim()) errors.push(`Proveedor #${i + 1}: Razón Social es obligatoria`)
    if (p.email && !validaEmail(p.email)) errors.push(`Proveedor #${i + 1}: Email inválido (verifique @, punto, sin doble punto)`)
  })

  if (!s.facturas.length) errors.push("Debe tener al menos 1 factura")
  s.facturas.forEach((f, i) => {
    if (!f.nroFactura?.trim()) errors.push(`Factura #${i + 1}: N. Factura es obligatorio`)
    if (!f.fechaFactura) errors.push(`Factura #${i + 1}: Fecha es obligatoria`)
    if (!f.proveedorRazonSocial?.trim()) errors.push(`Factura #${i + 1}: Razon Social del proveedor es obligatoria`)
  })
  if (!s.items.length) errors.push("Debe tener al menos 1 item de mercancia")
  const sinFactura = s.items.filter(i => !i.nroFactura).length
  if (sinFactura > 0) errors.push(`${sinFactura} item(s) sin factura asignada`)
  s.items.forEach((item, i) => {
    if (!item.nandina?.trim()) errors.push(`Item #${i + 1}: Subpartida Nandina es obligatoria`)
    if (!item.cantFisica?.trim()) errors.push(`Item #${i + 1}: Cantidad Fisica es obligatoria`)
  })
  return { ok: errors.length === 0, errors }
}

export function validateDEX(s: DEXFormState): ValidationResult {
  const errors: string[] = []
  if (!s.nroReferencia?.trim()) errors.push("N. Referencia es obligatorio")
  if (!s.nitExportador?.trim()) errors.push("NIT Exportador es obligatorio")
  if (!s.aduanaDespacho) errors.push("Aduana de Despacho es obligatoria")
  if (!s.incoterm) errors.push("Incoterms es obligatorio")
  if (!s.consigRazonSocial?.trim()) errors.push("Razon Social del Consignatario es obligatoria")
  if (!s.paisDestino) errors.push("Pais Destino es obligatorio")
  if (!s.items.length) errors.push("Debe tener al menos 1 item")
  s.items.forEach((item, i) => {
    if (!item.nandina?.trim()) errors.push(`Item #${i + 1}: Subpartida es obligatoria`)
    if (!item.cantidad?.trim()) errors.push(`Item #${i + 1}: Cantidad es obligatoria`)
    if (!item.descripcion?.trim()) errors.push(`Item #${i + 1}: Descripcion es obligatoria`)
  })
  return { ok: errors.length === 0, errors }
}

export function validateDAV(s: DAVFormState): ValidationResult {
  const errors: string[] = []
  if (!s.refDam?.trim()) errors.push("Referencia DAM es obligatoria")
  if (!s.importadorNroDoc?.trim()) errors.push("N. Documento del Importador es obligatorio")
  if (!s.importadorRazonSocial?.trim()) errors.push("Razon Social del Importador es obligatoria")
  if (!s.vendedorRazonSocial?.trim()) errors.push("Razon Social del Vendedor es obligatoria")
  if (!s.fobTotal?.trim()) errors.push("FOB Total es obligatorio")
  if (!s.cifTotal?.trim()) errors.push("CIF Total es obligatorio")
  if (!s.items.length) errors.push("Debe tener al menos 1 item")
  s.items.forEach((item, i) => {
    if (!item.nandina?.trim()) errors.push(`Item #${i + 1}: Subpartida es obligatoria`)
    else if (!/^\d{11}$/.test(item.nandina.replace(/\./g, '')))
      errors.push(`Item #${i + 1}: Subpartida debe tener exactamente 11 dígitos`)
    if (!item.cantidad?.trim()) errors.push(`Item #${i + 1}: Cantidad es obligatoria`)
  })
  return { ok: errors.length === 0, errors }
}
