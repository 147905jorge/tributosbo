// Parsers: JSON/XML → FormState (inverso de _export.ts)
import type {
  DAMJson, DIMJson, DEXJson, DAVData,
  DAMFormState, DIMFormState, DEXFormState, DAVFormState,
  ItemForm, FacturaForm, DocEmbarqueForm, ProveedorForm,
  DEXItemForm, DAVItemForm
} from "./_types"

function uid() { return Math.random().toString(36).slice(2, 9) }
function str(v: unknown): string { return v == null ? "" : String(v) }
function cod(obj: { codigo?: unknown } | null | undefined): string { return str(obj?.codigo) }

/* ── entity extraction (side-effect of parsing) ─────────────────────────── */

export type EntityData = {
  tipo: "importador" | "exportador" | "proveedor" | "consignatario"
  nit: string
  tipoDoc: string
  razonSocial: string
  paisCod?: string; ciudadCod?: string
  calle?: string; numero?: string; barrioZona?: string
  telefonoFax?: string; email?: string
  condicion?: string
}

/* ── empty defaults ─────────────────────────────────────────────────────── */

function emptyDoc(): DocEmbarqueForm {
  return { id: uid(), tipoDoc: "TR-002", nroDoc: "", fechaEmbarque: "", lugarEmbarqueCod: "CNNGB", paisEmbarqueCod: "CN", provieneZonaFranca: "2" }
}
function emptyProv(): ProveedorForm {
  return { id: uid(), razonSocial: "", tipoDoc: "", nroDoc: "", calleAvenida: "", numero: "", barrioZona: "", paisCod: "CN", ciudadCod: "", telefonoFax: "", email: "" }
}
function emptyFact(): FacturaForm {
  return { id: uid(), nroFactura: "", fechaFactura: "", proveedorRazonSocial: "", proveedorNroDoc: "", proveedorCondicion: "03", especifiqueCondVendedor: "", proveedorPaisAdquisicion: "CN", incoterm: "FOB", lugarIncoterm: "", especifiqueIncoterm: "", naturaleza: "01", especifiqueNaturaleza: "", moneda: "USD", valorTransaccion: "", tipoCambio: "1", formaPago: "3", especifiqueFormaPago: "", medioPago: "3", especifiqueMedioPago: "", destinoMercancia: "02", especifiqueDestino: "", facturaSujetoDescuento: "NO", nivelComercial: "05", valorFobTotal: "", valorCifTotal: "0", totalPaginas: "1", totalItems: "", totalPesoNeto: "", observaciones: "" }
}
function emptyItem(): ItemForm {
  return { id: uid(), nroFactura: "", nandina: "", nandinaDesc: "", tipoMercancia: "COMUN", descMinima: {}, umFisica: "NMB", cantFisica: "", unidadFisicaConversion: "", cantFisicaConversion: "", umComercial: "NMB", umComercialEspecifique: "", cantComercial: "", precioUnit: "", paisOrigen: "CN", acuerdoComercial: "NA", criterioCalificacionOrigen: "", pesoNeto: "", embalaje: "CT", estado: "1", estadoEspecifique: "", marcas: "", relacionItemBulto: "", valorTransaccionItem: "", fobItem: "", ga_pct: "", ice_pct: "", iva_pct: "14.94", observaciones: "", codigoRitex: "", cantidadRitex: "", resolucionRitex: "", incExeIva: "", timbre: "", ime: "", regCodNal: "", declaracionPresedente: "", itemPresedente: "", subRegimenPresedente: "" }
}

/* ── shared: parse items (DAM/DIM) ─────────────────────────────────────── */

function parseItems(mercancias: DAMJson["datosMercancias"] | DIMJson["datosMercancias"]): ItemForm[] {
  return (mercancias ?? []).map(m => {
    const id = m.identificacionMercanciaItem
    const dmc = id?.descripcionMercanciaComercial
    const descMin: Record<string, string> = {}
    for (const obj of (dmc?.descripcionMinimasMercancias ?? [])) {
      for (const [k, v] of Object.entries(obj ?? {})) {
        if (v && typeof v === "object" && !Array.isArray(v))
          descMin[k] = JSON.stringify(v)  // preserve full CodDesc (codigo+descripcion+especifique)
        else
          descMin[k] = v !== null && v !== undefined ? String(v) : ""
      }
    }
    return {
      id: uid(),
      nroFactura: str(m.factura?.numeroFactura),
      nandina: cod(id?.subPartidaArancelaria),
      nandinaDesc: str(id?.subPartidaArancelaria?.descripcion),
      tipoMercancia: cod(dmc?.tipoMercancia) || "COMUN",
      descMinima: descMin,
      umFisica: str(id?.unidadMedida) || "NMB",
      cantFisica: str(id?.cantidadUnidadFisica),
      unidadFisicaConversion: id?.unidadFisicaConversion != null ? String(id.unidadFisicaConversion) : "",
      cantFisicaConversion: id?.cantidadFisicaConversion != null ? String(id.cantidadFisicaConversion) : "",
      umComercial: cod(id?.unidadComercial) || "NMB",
      umComercialEspecifique: str(id?.unidadComercialEspecifique),
      cantComercial: str(id?.cantidadUnidadComercial),
      precioUnit: str(id?.precioUnitario),
      paisOrigen: cod(id?.paisOrigen),
      acuerdoComercial: cod(id?.acuerdoComercial) || "NA",
      criterioCalificacionOrigen: cod(id?.criterioCalificacionOrigen as { codigo?: unknown } | null | undefined) || "",
      pesoNeto: str(id?.pesoNeto),
      embalaje: str(id?.embalaje?.codigo) || "CT",
      estado: cod(id?.estado) || "1",
      estadoEspecifique: str(id?.estadoEspecifique),
      marcas: str(id?.marcas),
      relacionItemBulto: id?.relacionItemBulto != null ? String(id.relacionItemBulto) : "",
      valorTransaccionItem: str(m.informacionValoresTransaccionItem?.valorTransaccionItemUSD),
      fobItem: str(m.informacionValoresTransaccionItem?.valorFOBItemUSD),
      ga_pct: "", ice_pct: "", iva_pct: "14.94",
      observaciones: "",
      codigoRitex: str(id?.codigoRitex),
      cantidadRitex: str(id?.cantidadRitex),
      resolucionRitex: str(id?.resolucionRitex),
      incExeIva: str(id?.incExeIva),
      timbre: str(id?.timbre),
      ime: str(id?.ime),
      regCodNal: cod(id?.regCodNal),
      declaracionPresedente: str(id?.declaracionPresedente),
      itemPresedente: id?.itemPresedente != null ? String(id.itemPresedente) : "",
      subRegimenPresedente: str(id?.subRegimenPresedente)
    }
  })
}

/* ── shared: parse transacciones → facturas ─────────────────────────────── */

function parseFacturas(transacciones: DAMJson["datosTransacciones"]): FacturaForm[] {
  return (transacciones ?? []).map(t => ({
    id: uid(),
    nroFactura: str(t.detalleTransaccion?.numeroFactura),
    fechaFactura: str(t.detalleTransaccion?.fechaFactura),
    proveedorRazonSocial: str(t.proveedor?.razonSocial),
    proveedorNroDoc: str(t.proveedor?.numeroDocumento),
    proveedorCondicion: cod(t.proveedor?.condicionVendedor) || "03",
    especifiqueCondVendedor: str(t.proveedor?.especifiqueCondicionVendedor),
    proveedorPaisAdquisicion: cod(t.proveedor?.paisAdquisicion) || "CN",
    incoterm: cod(t.detalleTransaccion?.incoterms?.condicionEntrega) || "FOB",
    lugarIncoterm: str(t.detalleTransaccion?.incoterms?.lugarEntrega),
    especifiqueIncoterm: str(t.detalleTransaccion?.incoterms?.especifiqueCondicionEntrega),
    naturaleza: cod(t.detalleTransaccion?.naturalezaTransaccion) || "01",
    especifiqueNaturaleza: str(t.detalleTransaccion?.especifiqueNaturalezaTransaccion),
    moneda: cod(t.detalleTransaccion?.monedaTransaccion) || "USD",
    valorTransaccion: str(t.detalleTransaccion?.valorTransaccion),
    tipoCambio: str(t.detalleTransaccion?.tipoCambio) || "1",
    formaPago: cod(t.detallePagoTransaccion?.formaPago) || "3",
    especifiqueFormaPago: str(t.detallePagoTransaccion?.formaPagoEspecifique),
    medioPago: cod(t.detallePagoTransaccion?.medioPago) || "3",
    especifiqueMedioPago: str(t.detallePagoTransaccion?.medioPagoEspecifique),
    destinoMercancia: cod(t.detalleTransaccion?.destinoMercancia) || "02",
    especifiqueDestino: str(t.detalleTransaccion?.especifiqueDestinoMercancia),
    facturaSujetoDescuento: t.detalleTransaccion?.facturaSujetoDescuento === "true" ? "SI" : "NO",
    nivelComercial: cod(t.detalleTransaccion?.nivelComercial) || "05",
    valorFobTotal: str(t.valoresCostos?.valorFobTotalUsd),
    valorCifTotal: str(t.valoresCostos?.valorCifTotalUsd),
    totalPaginas: str(t.totalesControl?.numeroPaginas) || "1",
    totalItems: str(t.totalesControl?.totalItems),
    totalPesoNeto: str(t.totalesControl?.totalPesoNeto),
    observaciones: str(t.observacionesGenerales)
  }))
}

/* ── shared: parse proveedores ─────────────────────────────────────────── */

function parseProveedores(raw: DAMJson["proveedores"]): ProveedorForm[] {
  return (raw ?? []).map(p => {
    const dept = p.domicilio?.departamento
    return {
      id: uid(),
      razonSocial: str(p.razonSocial),
      tipoDoc: cod(p.tipoDocumento),
      nroDoc: p.numeroDocumento === null ? "" : str(p.numeroDocumento),
      nroDocIsNull: p.numeroDocumento === null,
      calleAvenida: str(p.domicilio?.calleAvenida),
      numero: str(p.domicilio?.numero),
      barrioZona: str(p.domicilio?.barrioZona),
      paisCod: cod(p.domicilio?.pais),
      departamentoJson: dept ? JSON.stringify(dept) : "",
      ciudadCod: cod(p.domicilio?.ciudad),
      telefonoFax: str(p.domicilio?.telefonoFax),
      email: str(p.domicilio?.correoElectronico)
    }
  })
}

/* ── DAM parser ─────────────────────────────────────────────────────────── */

export function parseDAMJson(raw: DAMJson): { state: DAMFormState; entities: EntityData[] } {
  const dg = raw.datosGenerales
  const id = dg.identificacionDeclaracion
  const op = dg.operadores
  const lug = dg.lugares
  const tra = dg.transporte
  const tc = raw.totalControlDeclaracion

  const docsEmbarque: DocEmbarqueForm[] = (tra.informacionDocumentosEmbarque ?? []).map(d => ({
    id: uid(),
    tipoDoc: cod(d.tipoDocumentoEmbarque),
    nroDoc: str(d.numeroDocumentoEmbarque),
    fechaEmbarque: str(d.fechaEmbarque),
    lugarEmbarqueCod: cod(d.lugarEmbarque),
    paisEmbarqueCod: cod(d.paisEmbarque),
    provieneZonaFranca: cod(d.provieneZonaFranca) || "2"
  }))

  const proveedores = parseProveedores(raw.proveedores)
  const facturas = parseFacturas(raw.datosTransacciones)
  const items = parseItems(raw.datosMercancias)

  const state: DAMFormState = {
    nroReferencia: str(id.numeroReferencia),
    aduanaDespacho: cod(id.aduanaDespacho),
    formaEnvio: cod(id.formaEnvio) || "02",
    cargaConsolidada: cod(id.cargaConsolidada) || "2",
    destinoRegimen: cod(id.destinoRegimenAduanero) || "40",
    modalidadRegimen: cod(id.modalidadRegimen) || "4000",
    modalidadDespacho: cod(id.modalidadDespacho) || "01",
    tipoDam: str(id.tipoDam) || "PREVIO",
    desRegPosCod: cod(id.desRegPos) || "40",
    modDesPosCode: cod(id.modDesPos) || "01",
    emiParRec: cod(id.emiParRec) || "2",
    tipMercaderia: Array.isArray(id.tipMer)
      ? id.tipMer.map((t: { codigo: string; descripcion: string }) => `${t.codigo} - ${t.descripcion}`)
      : [],
    nitImportador: str(op.importador?.numeroDocumento),
    tipoDocImportador: cod(op.importador?.tipoDocumento) || "NIT",
    razonSocialImportador: str((op.importador as any)?.razonSocial),
    nitConsignatario: str(op.consignatario?.numeroDocumento),
    tipoDocConsignatario: cod(op.consignatario?.tipoDocumento) || "NIT",
    razonSocialConsignatario: str((op.consignatario as any)?.razonSocial),
    paisExportacion: cod(lug.paisExportacion) || "CN",
    paisProcedencia: cod(lug.paisProcedencia) || "CN",
    paisTransito: cod(lug.paisTransito) || "",
    aduanaIngreso: cod(lug.aduanaIngreso),
    aduanaDestino: cod(lug.aduanaDestino) || "201",
    lugarEntrega: str(lug.lugarEntrega),
    viaHastaFrontera: cod(tra.hastaFrontera) || "6",
    viaDesdefrontera: cod(tra.desdeFrontera) || "3",
    cargaPeligrosa: tra.cargaPeligrosa === true || String(tra.cargaPeligrosa) === "true",
    docsEmbarque: docsEmbarque.length ? docsEmbarque : [emptyDoc()],
    totalFob: str(tc?.totalFob),
    totalBultos: str(tc?.totalBultos),
    totalPesoBruto: str(tc?.totalPesoBruto),
    totalPesoNeto: "",
    fleteTotal: "0", seguroTotal: "0",
    proveedores: proveedores.length ? proveedores : [emptyProv()],
    facturas: facturas.length ? facturas : [emptyFact()],
    items: items.length ? items : [emptyItem()],
    _rawJson: JSON.stringify(raw)
  }

  const entities: EntityData[] = []
  if (op.importador?.numeroDocumento) {
    entities.push({ tipo: "importador", nit: str(op.importador.numeroDocumento), tipoDoc: cod(op.importador.tipoDocumento) || "NIT", razonSocial: "" })
  }
  for (const p of raw.proveedores ?? []) {
    entities.push({ tipo: "proveedor", nit: str(p.numeroDocumento), tipoDoc: cod(p.tipoDocumento) || "NIT", razonSocial: str(p.razonSocial), paisCod: cod(p.domicilio?.pais), ciudadCod: cod(p.domicilio?.ciudad), calle: str(p.domicilio?.calleAvenida), telefonoFax: str(p.domicilio?.telefonoFax), email: str(p.domicilio?.correoElectronico) })
  }
  return { state, entities }
}

/* ── DIM parser ─────────────────────────────────────────────────────────── */

export function parseDIMJson(raw: DIMJson): { state: DIMFormState; entities: EntityData[] } {
  const dg = raw.datosGenerales
  const id = dg.identificacionDeclaracion
  const op = dg.operadores
  const lug = dg.lugares
  const tra = dg.transporte
  const tc = dg.totalescontrol

  const proveedores = parseProveedores(raw.proveedores)
  const facturas = parseFacturas(raw.datosTransacciones)
  const items = parseItems(raw.datosMercancias)

  const state: DIMFormState = {
    nroReferencia: str(id.numeroReferencia),
    aduanaDespacho: cod(id.aduanaDespacho),
    formaEnvio: cod(id.formaEnvio) || "02",
    destinoRegimen: cod(id.destinoRegimenAduanero) || "40",
    modalidadRegimen: cod(id.modalidadRegimen) || "4000",
    modalidadDespacho: cod(id.modalidadDespacho) || "01",
    tipoDespacho: cod(id.tipoDespacho) || "02",
    tratamientoEspecial: cod(id.tratamientoEspecial) || "000",
    numeroDim: str(id.numeroDim),
    entPubAbs: op.entPubAbs === true,
    nitImportador: str(op.importador?.numeroDocumento),
    tipoDocImportador: cod(op.importador?.tipoDocumento) || "NIT",
    paisExportacion: cod(lug.paisExportacion) || "US",
    paisProcedencia: cod(lug.paisProcedencia) || "US",
    paisTransito: cod(lug.paisTransito) || "",
    aduanaIngreso: cod(lug.aduanaIngreso),
    fechaEmbarque: str(lug.fechaEmbarque),
    lugarEmbarqueCod: cod(lug.lugarEmbarque),
    localidadDestinoCod: cod(lug.localidadDestino),
    departamentoDestinoCod: cod(lug.departamentoDestino),
    viaHastaFrontera: cod(tra.hastaFrontera) || "4",
    viaDesdeFrontera: cod(tra.desdeFrontera) || "4",
    cargaPeligrosa: tra.cargaPeligrosa === true || String(tra.cargaPeligrosa) === "true",
    proZonFra: tra.proZonFra === true,
    costoSeguro: str(tra.costoTotalSeguro) || "0",
    gastosCargaDescarga: str(tra.gastosCargaDescargaManipulacion) || "0",
    gastosTransDesdePuerto: str(tra.gastosTransporteDesdePuertoTransito) || "0",
    gastosTransHastaEmbarque: str(tra.gastosTransporteHastaLugarEmbarque) || "0",
    gastosTransHastaImportacion: str(tra.gastosTransporteHastaLugarImportacion) || "0",
    gastosTransHastaPuerto: str(tra.gastosTransporteHastaPuertoTransito) || "0",
    otrasErogaciones: str(tra.otrasErogaciones) || "0",
    otrosGastos: str(tra.otrosGastos) || "0",
    totalBultos: str(tc?.totalBul),
    totalFacturas: str(tc?.totalFac),
    totalFob: str(tc?.totalFob),
    totalPesoBruto: str(tc?.totalPesBru),
    totalPesoNeto: str(tc?.totalPesNet),
    proveedores: proveedores.length ? proveedores : [emptyProv()],
    facturas: facturas.length ? facturas : [emptyFact()],
    items: items.length ? items : [emptyItem()],
    _rawJson: JSON.stringify(raw)
  }

  const entities: EntityData[] = []
  if (op.importador?.numeroDocumento) {
    entities.push({ tipo: "importador", nit: str(op.importador.numeroDocumento), tipoDoc: cod(op.importador.tipoDocumento) || "NIT", razonSocial: "" })
  }
  for (const p of raw.proveedores ?? []) {
    entities.push({ tipo: "proveedor", nit: str(p.numeroDocumento), tipoDoc: cod(p.tipoDocumento) || "NIT", razonSocial: str(p.razonSocial), paisCod: cod(p.domicilio?.pais), email: str(p.domicilio?.correoElectronico) })
  }
  return { state, entities }
}

/* ── DEX parser ─────────────────────────────────────────────────────────── */

export function parseDEXJson(raw: DEXJson): { state: DEXFormState; entities: EntityData[] } {
  const id = raw.identificacion
  const op = raw.operadores
  const lug = raw.lugar
  const tra = raw.transporte
  const vt = raw.valoresTransaccion
  const tot = raw.totales

  const items: DEXItemForm[] = (raw.items ?? []).map(item => ({
    id: uid(),
    nandina: str(item.codigoMercancia?.subpartida?.codigo),
    nandinaDesc: str(item.codigoMercancia?.subpartida?.descripcion),
    descripcion: str(item.descripcion),
    marcas: str(item.marcas),
    paisOrigen: cod(item.paisOrigen),
    cantidad: str(item.cantidad),
    unidad: cod(item.tipoUnidad),
    cantBultos: str(item.cantidadBultos) || "1",
    pesoNeto: str(item.pesoNeto),
    pesoBruto: str(item.pesoBruto),
    precioUnit: str(item.precioUnitario),
    valorTransaccion: str(item.valorTransaccion),
    valorFob: str(item.valorFob),
    valorFlete: str(item.valorFlete) || "0",
    valorSeguro: str(item.valorSeguro) || "0",
    embalaje: str(item.embalaje?.codigo) || "CT",
    estado: cod(item.estado) || "1",
    acuerdoComercial: cod(item.acuerdoComercial) || "",
    origenMineralMetal: item.origenMineralMetal === true
  }))

  const state: DEXFormState = {
    nroReferencia: str(id?.numeroReferencia),
    aduanaDespacho: cod(id?.aduanaDespacho),
    regimen: cod(id?.regimenAduanero) || "10",
    modalidadRegimen: cod(id?.modalidadRegimen) || "1000",
    tipoEmbarque: cod(id?.tipoEmbarque) || "ET",
    nitExportador: str(op?.importadorExportador?.numeroDocumento),
    tipoDocExportador: cod(op?.importadorExportador?.tipoDocumento) || "NIT",
    consigRazonSocial: str(op?.consignatario?.razonSocial),
    consigNroDoc: str(op?.consignatario?.numeroDocumento),
    consigEmail: str(op?.consignatario?.email),
    consigCalle: str(op?.consignatario?.domicilio?.calle),
    consigNumero: str(op?.consignatario?.domicilio?.numero),
    consigPaisCod: cod(op?.consignatario?.domicilio?.pais),
    consigCiudadCod: cod(op?.consignatario?.domicilio?.ciudad),
    aduanaSalida: cod(lug?.aduanaSalida),
    lugarEmbarqueCod: cod(lug?.lugarEmbarque),
    lugarDesembCod: cod(lug?.lugarDesembarque),
    paisDestino: cod(lug?.paisDestino),
    paisTransito: cod(lug?.paisTransito) || "",
    viaInternacional: cod(tra?.internacional) || "3",
    viaNacional: cod(tra?.nacional) || "3",
    incoterm: cod(vt?.condicionEntrega?.condicion) || "EXW",
    lugarIncoterm: str(vt?.condicionEntrega?.lugarEntrega),
    naturaleza: cod(vt?.naturalezaTransaccion) || "11",
    formaPago: cod(vt?.formaPago) || "3",
    medioPago: cod(vt?.medio) || "3",
    moneda: cod(vt?.tasaMoneda?.moneda) || "USD",
    tipoCambio: str(vt?.tasaMoneda?.cambio) || "1",
    valorTransaccion: str(vt?.valorTransaccion),
    valorFobUs: str(vt?.valorFobUs),
    valorFleteTotal: str(vt?.valorFleteTotal) || "0",
    valorFleteInterno: str(vt?.valorFleteInterno) || "0",
    valorSeguro: str(vt?.valorSeguro) || "0",
    totalBultos: str(tot?.cantidadBultos),
    totalPesoBruto: str(tot?.pesoBruto),
    totalPesoNeto: str(tot?.pesoNeto),
    items: items.length ? items : [{ id: uid(), nandina: "", nandinaDesc: "", descripcion: "", marcas: "", paisOrigen: "BO", cantidad: "", unidad: "NMB", cantBultos: "1", pesoNeto: "", pesoBruto: "", precioUnit: "", valorTransaccion: "", valorFob: "", valorFlete: "0", valorSeguro: "0", embalaje: "CT", estado: "1", acuerdoComercial: "NA", origenMineralMetal: false }],
    _rawJson: JSON.stringify(raw)
  }

  const entities: EntityData[] = []
  if (op?.importadorExportador?.numeroDocumento) {
    entities.push({ tipo: "exportador", nit: str(op.importadorExportador.numeroDocumento), tipoDoc: cod(op.importadorExportador.tipoDocumento) || "NIT", razonSocial: "" })
  }
  if (op?.consignatario?.razonSocial) {
    entities.push({ tipo: "consignatario", nit: str(op.consignatario.numeroDocumento), tipoDoc: "EXT", razonSocial: str(op.consignatario.razonSocial), paisCod: cod(op.consignatario.domicilio?.pais), email: str(op.consignatario.email) })
  }
  return { state, entities }
}

/* ── DAV XML parser ─────────────────────────────────────────────────────── */

export function parseDAVXml(xmlStr: string): { state: DAVFormState; entities: EntityData[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, "text/xml")
  const root = doc.documentElement

  function t(tag: string): string {
    return root.querySelector(tag)?.textContent?.trim() ?? ""
  }
  function ti(item: Element, tag: string): string {
    return item.querySelector(tag)?.textContent?.trim() ?? ""
  }

  // GESDES DAV uses flat <items> elements (not <items><item>)
  const itemEls = (() => {
    const flat = Array.from(root.querySelectorAll("items"))
    if (flat.length) return flat
    return Array.from(root.querySelectorAll("items > item"))
  })()

  function davDateToInput(d: string): string {
    // Convert DD/MM/YYYY to YYYY-MM-DD for HTML date input
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [day, m, y] = d.split("/")
      return `${y}-${m}-${day}`
    }
    return d
  }

  const items: DAVItemForm[] = itemEls.map((el, idx) => ({
    id: uid(),
    nroItem: ti(el, "c680") || String(idx + 1),
    nandina: ti(el, "c690").replace(/0+$/, "").padEnd(10, "0").slice(0, 10),
    nroFactura: ti(el, "c700"),
    fechaFactura: davDateToInput(ti(el, "c701")),
    cantidad: ti(el, "c710"),
    descComercial: ti(el, "c711"),
    tipoMercancia: ti(el, "c7101"),
    clase: ti(el, "c7103") || "-",
    modelo: ti(el, "c7104") || "-",
    cuanti1: ti(el, "c7105") || "-",
    cuanti2: ti(el, "c7106") || "-",
    formatoPresentacion: ti(el, "c7107"),
    material: ti(el, "c7108"),
    uso: ti(el, "c7110"),
    otrasCaract: ti(el, "c7111"),
    paisOrigen: ti(el, "c1240") || ti(el, "c1250") || "CN",
    acuerdoComercial: ti(el, "c770") || "NA",
    anioFab: ti(el, "c790") || String(new Date().getFullYear()),
    embalaje: ti(el, "c800") || "CT",
    fobItem: ti(el, "c820"),
    fleteItem: ti(el, "c830") || "0",
    cifItem: ti(el, "c1120") || ti(el, "c840") || "",
    pesoNeto: ti(el, "c850"),
    ga_pct: "",
    montoGA: ti(el, "c930") || "0",
    ice_monto: ti(el, "c950") || "0",
    iva_monto: ti(el, "c970") || "0",
    moneda: "USD",
    tipoCambio: "1.000"
  }))

  const refVal = t("ref") || t("c100") || ""
  const state: DAVFormState = {
    refDam: refVal,
    importadorRazonSocial: t("c70"),
    importadorTipoDoc: t("c81") || "NIT",
    importadorNroDoc: t("c82"),
    importadorDepartamento: t("c83") || "LP",
    importadorCiudad: t("c120"),
    importadorPais: t("c130") || "BO",
    importadorCalle: t("c110"),
    importadorTel: t("c140"),
    importadorFax: t("c150"),
    importadorEmail: t("c160"),
    vendedorRazonSocial: t("c170"),
    vendedorCondicion: t("c180") || "03",
    vendedorCalle: t("c200"),
    vendedorCiudad: t("c210"),
    vendedorPais: t("c220") || "CN",
    vendedorTel: t("c230"),
    vendedorEmail: t("c250"),
    nroFacturas: t("c260") || "1",
    facturas: [t("c270"), t("c271")].filter(Boolean).join(", "),
    tipoVenta: t("c290") || "03",
    condicionEntrega: t("c310") || "03",
    incoterm: t("c360") || "FOB",
    lugarIncoterm: t("c361"),
    formaPago: t("c330") || "02",
    medioPago: t("c340") || "01",
    sujDescuento: "0",
    comisiones: "0",
    fobTotal: t("c380"),
    restricciones: t("c390") === "SI" ? "1" : "0",
    flete: t("c630"),
    seguro: t("c640"),
    otrosGastos: t("c660") || "0",
    cifTotal: t("c620") || t("c670"),
    aduana: "201",
    vinculacion: t("c550") === "SI" ? "1" : "0",
    vinculacionInfluye: t("c560") === "SI" ? "1" : "0",
    vinculacionPrecioAprox: t("c570") === "SI" ? "1" : "0",
    declaranteNombre: t("c1270"),
    declaranteTipoDoc: t("c1281") || "NIT",
    declaranteNroDoc: t("c1282"),
    declaranteDepartamento: t("c1283") || "LP",
    declaranteCalle: t("c1290"),
    declaranteCiudad: t("c1300"),
    declaranteTel: t("c1310"),
    apoderadoNombre: t("c1320"),
    apoderadoCI: t("c1330"),
    observaciones: t("c1340"),
    items: items.length ? items : [{ id: uid(), nroItem: "1", nandina: "", nroFactura: "", fechaFactura: "", cantidad: "", descComercial: "", tipoMercancia: "", clase: "-", modelo: "-", cuanti1: "-", cuanti2: "-", formatoPresentacion: "", material: "", uso: "", otrasCaract: "", paisOrigen: "CN", acuerdoComercial: "NA", anioFab: "", embalaje: "CT", fobItem: "", fleteItem: "0", cifItem: "", pesoNeto: "", ga_pct: "", montoGA: "0", ice_monto: "0", iva_monto: "0", moneda: "USD", tipoCambio: "1.000" }],
    _rawJson: xmlStr
  }

  const entities: EntityData[] = []
  if (t("c82")) entities.push({ tipo: "importador", nit: t("c82"), tipoDoc: t("c81") || "NIT", razonSocial: t("c70"), calle: t("c110"), email: t("c160") })
  if (t("c170")) entities.push({ tipo: "proveedor", nit: "", tipoDoc: "EXT", razonSocial: t("c170"), paisCod: t("c220"), email: t("c250"), condicion: t("c180") })
  return { state, entities }
}

/* ── auto-detect file type ─────────────────────────────────────────────── */

export type DetectedType = "DAM" | "DIM" | "DEX" | "DAV" | null

export function detectFileType(content: string): DetectedType {
  const trimmed = content.trim()
  if (trimmed.startsWith("<")) {
    if (trimmed.includes("cversion") || trimmed.includes("<c70>") || trimmed.includes("<c680>")) return "DAV"
    return null
  }
  try {
    const parsed = JSON.parse(trimmed)
    // DEX: has identificacion + items at root (SUMA structure)
    if (parsed?.identificacion && parsed?.items) return "DEX"
    // DIM: has totalescontrol nested under datosGenerales (DAM has totalControlDeclaracion at root)
    if (parsed?.datosGenerales?.totalescontrol != null) return "DIM"
    // DAM: has totalControlDeclaracion at root
    if (parsed?.totalControlDeclaracion != null) return "DAM"
    // Fallback: version string (compatible with versions generadas por el Excel VBA)
    const version = parsed?.versionExcel ?? ""
    if (String(version).startsWith("2.")) return "DAM"
    if (String(version).startsWith("1.")) return "DIM"
    if (version === "1.0") return "DEX"
  } catch { /* not valid JSON */ }
  return null
}

/* ── file reader helper ─────────────────────────────────────────────────── */

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      let text = e.target?.result as string
      // strip UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
      // remove embedded control characters that break JSON parse
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
      resolve(text)
    }
    reader.onerror = reject
    reader.readAsText(file, "utf-8")
  })
}
