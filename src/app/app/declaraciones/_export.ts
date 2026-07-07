import type {
  DAMFormState, DIMFormState, DEXFormState, DAVFormState, DAVItemForm,
  DAMJson, DIMJson, DEXJson, DAVData,
  CodDesc, DocEmbarque, Proveedor, Transaccion, ItemMercancia, DescMinItem
} from "./_types"
import {
  ADUANAS, PAISES, PUERTOS, VIAS_TRANSPORTE, TIPO_DOC_EMBARQUE,
  TIPO_DOCUMENTO, REGIMENES_DESTINO, MODALIDADES_REGIMEN, MODALIDADES_DESPACHO,
  FORMAS_ENVIO, INCOTERMS, MONEDAS, NATURALEZA_TRANSACCION,
  FORMAS_PAGO, MEDIOS_PAGO, CONDICION_VENDEDOR, DESTINO_MERCANCIA,
  NIVEL_COMERCIAL, ESTADO_MERCANCIA, EMBALAJE, ACUERDO_COMERCIAL,
  UNIDAD_COMERCIAL, CRITERIO_CALIFICACION_ORIGEN, TIPOS_DESPACHO_DIM, TRATAMIENTOS_ESPECIALES, EMI_PAR_REC,
  REGIMENES_DEX, MODALIDADES_DEX, TIPO_EMBARQUE, desc, CatItem
} from "./_cat"

// ─── helpers ─────────────────────────────────────────────────────────────────

function cd(cod: string, list: CatItem[]): CodDesc {
  return { codigo: cod, descripcion: desc(cod, list) }
}

function nz(v: string | undefined | null) { return v ?? "" }

// ─── DAM ─────────────────────────────────────────────────────────────────────

export function buildDAMJson(s: DAMFormState): DAMJson {
  const isPost = s.tipoDam === "POSTERIOR"

  const docs: DocEmbarque[] = s.docsEmbarque.map(d => ({
    fechaEmbarque: d.fechaEmbarque,
    lugarEmbarque: cd(d.lugarEmbarqueCod, PUERTOS),
    paisEmbarque: cd(d.paisEmbarqueCod, PAISES),
    numeroDocumentoEmbarque: d.nroDoc,
    tipoDocumentoEmbarque: cd(d.tipoDoc, TIPO_DOC_EMBARQUE),
    provieneZonaFranca: { codigo: d.provieneZonaFranca || "2", descripcion: d.provieneZonaFranca === "1" ? "SI" : "NO" }
  }))

  const proveedores: Proveedor[] = s.proveedores.map(p => {
    let dept: CodDesc | null = null
    if (p.departamentoJson) { try { dept = JSON.parse(p.departamentoJson) } catch {} }
    return {
      tipoDocumento: p.tipoDoc ? cd(p.tipoDoc, TIPO_DOCUMENTO) : null,
      numeroDocumento: p.nroDocIsNull ? null : p.nroDoc,
      razonSocial: p.razonSocial,
      domicilio: {
        calleAvenida: p.calleAvenida, numero: p.numero, barrioZona: p.barrioZona,
        pais: cd(p.paisCod, PAISES), departamento: dept,
        ciudad: cd(p.ciudadCod, PUERTOS), telefonoFax: p.telefonoFax,
        sitioWeb: null, correoElectronico: p.email
      }
    }
  })

  const transacciones: Transaccion[] = s.facturas.map(f => ({
    proveedor: {
      razonSocial: f.proveedorRazonSocial, numeroDocumento: f.proveedorNroDoc,
      condicionVendedor: cd(f.proveedorCondicion, CONDICION_VENDEDOR),
      especifiqueCondicionVendedor: f.especifiqueCondVendedor || null,
      paisAdquisicion: cd(f.proveedorPaisAdquisicion, PAISES)
    },
    detalleTransaccion: {
      numeroFactura: f.nroFactura, fechaFactura: f.fechaFactura,
      incoterms: {
        condicionEntrega: cd(f.incoterm, INCOTERMS),
        especifiqueCondicionEntrega: f.especifiqueIncoterm || null,
        lugarEntrega: f.lugarIncoterm
      },
      naturalezaTransaccion: cd(f.naturaleza, NATURALEZA_TRANSACCION),
      especifiqueNaturalezaTransaccion: f.especifiqueNaturaleza || null,
      monedaTransaccion: cd(f.moneda, MONEDAS),
      valorTransaccion: f.valorTransaccion, tipoCambio: parseFloat(f.tipoCambio) || 0,
      destinoMercancia: cd(f.destinoMercancia, DESTINO_MERCANCIA),
      especifiqueDestinoMercancia: f.especifiqueDestino || null,
      facturaSujetoDescuento: f.facturaSujetoDescuento === "SI" ? "true" : "false"
    },
    detallePagoTransaccion: {
      formaPago: cd(f.formaPago, FORMAS_PAGO), formaPagoEspecifique: f.especifiqueFormaPago || null,
      medioPago: cd(f.medioPago, MEDIOS_PAGO), medioPagoEspecifique: f.especifiqueMedioPago || null
    },
    valoresCostos: { valorFobTotalUsd: f.valorFobTotal, valorCifTotalUsd: parseFloat(f.valorCifTotal) || 0 },
    totalesControl: {
      numeroPaginas: f.totalPaginas || "1",
      totalItems: f.totalItems || String(s.items.filter(i => i.nroFactura === f.nroFactura).length),
      totalPesoNeto: f.totalPesoNeto || String(s.items.filter(i => i.nroFactura === f.nroFactura).reduce((acc, i) => acc + (parseFloat(i.pesoNeto) || 0), 0).toFixed(3))
    },
    observacionesGenerales: f.observaciones || null
  }))

  const TIPO_MERC = [
    { cod: "COMUN", desc: "Comunes" }, { cod: "VAGON", desc: "Vagon" },
    { cod: "AERONAVE", desc: "Aeronave" }, { cod: "VEHICULO", desc: "Vehiculo" }
  ]

  const mercancias: ItemMercancia[] = s.items.map(item => {
    const descMin: DescMinItem[] = []
    // v2.11: NombreMercancia siempre primero como CodDesc
    descMin.push({ "NombreMercancia": cd(item.tipoMercancia || "COMUN", TIPO_MERC) })
    // especifiqueNombreTxt
    const espec = item.descMinima["especifiqueNombreTxt"] || item.nandinaDesc
    if (espec) descMin.push({ "especifiqueNombreTxt": String(espec) })
    // resto de campos del descMinima (excluir NombreMercancia y especifiqueNombreTxt ya incluidos)
    for (const [k, v] of Object.entries(item.descMinima)) {
      if (v === null || v === undefined || k === "NombreMercancia" || k === "especifiqueNombreTxt") continue
      // Restaurar CodDesc si fue serializado como JSON en el parse
      if (v !== "" && v.startsWith("{")) {
        try { descMin.push({ [k]: JSON.parse(v) }); continue } catch {}
      }
      descMin.push({ [k]: v })
    }
    const fact = s.facturas.find(f => f.nroFactura === item.nroFactura) || s.facturas[0]
    const fobNum = parseFloat(item.fobItem) || parseFloat(item.cantFisica) * parseFloat(item.precioUnit) || 0
    return {
      factura: {
        numeroFactura: item.nroFactura,
        proveedor: { razonSocial: fact?.proveedorRazonSocial || "", numeroDocumento: fact?.proveedorNroDoc || "" }
      },
      identificacionMercanciaItem: {
        subPartidaArancelaria: { codigo: item.nandina, descripcion: item.nandinaDesc },
        unidadMedida: desc(item.umFisica, UNIDAD_COMERCIAL),
        unidadFisicaConversion: 0,
        cantidadUnidadFisica: item.cantFisica,
        cantidadFisicaConversion: 0,
        unidadComercial: cd(item.umComercial || item.umFisica, UNIDAD_COMERCIAL),
        unidadComercialEspecifique: null,
        cantidadUnidadComercial: item.cantComercial || item.cantFisica,
        precioUnitario: item.precioUnit,
        paisOrigen: cd(item.paisOrigen, PAISES),
        acuerdoComercial: (item.acuerdoComercial && item.acuerdoComercial !== "NA") ? cd(item.acuerdoComercial, ACUERDO_COMERCIAL) : null,
        criterioCalificacionOrigen: (item.criterioCalificacionOrigen && item.criterioCalificacionOrigen !== "")
          ? { codigo: item.criterioCalificacionOrigen, descripcion: desc(item.criterioCalificacionOrigen, CRITERIO_CALIFICACION_ORIGEN) } : null,
        embalaje: { codigo: item.embalaje, descripcion: desc(item.embalaje, EMBALAJE), tag: "false" },
        pesoNeto: item.pesoNeto, marcas: item.marcas || null,
        relacionItemBulto: item.relacionItemBulto || null,
        estado: cd(item.estado || "1", ESTADO_MERCANCIA),
        estadoEspecifique: null,
        descripcionMercanciaComercial: {
          descripcionMinimasMercancias: descMin,
          tipoMercancia: cd(item.tipoMercancia || "COMUN", TIPO_MERC),
          codigoOrigenDescripcionMinima: null
        }
      },
      informacionValoresTransaccionItem: {
        valorTransaccionItemUSD: String(fobNum),
        valorFOBItemUSD: String(fobNum),
        valorFOBUnitarioUsd: item.precioUnit
      },
      observaciones: null
    }
  })

  const formResult: DAMJson = {
    versionExcel: "2.11",
    datosGenerales: {
      identificacionDeclaracion: {
        numeroReferencia: s.nroReferencia,
        aduanaDespacho: cd(s.aduanaDespacho, ADUANAS),
        formaEnvio: cd(s.formaEnvio, FORMAS_ENVIO),
        cargaConsolidada: { codigo: s.cargaConsolidada || "2", descripcion: s.cargaConsolidada === "1" ? "SI" : "NO" },
        destinoRegimenAduanero: cd(s.destinoRegimen, REGIMENES_DESTINO),
        modalidadRegimen: cd(s.modalidadRegimen, MODALIDADES_REGIMEN),
        modalidadDespacho: s.modalidadDespacho ? cd(s.modalidadDespacho, MODALIDADES_DESPACHO) : null,
        tipoDam: s.tipoDam,
        desRegPos: isPost ? cd(s.desRegPosCod, REGIMENES_DESTINO) : null,
        modDesPos: isPost ? cd(s.modDesPosCode, MODALIDADES_DESPACHO) : null,
        emiParRec: cd(s.emiParRec || "2", EMI_PAR_REC),
        tipMer: s.tipMercaderia && s.tipMercaderia.length > 0
          ? s.tipMercaderia.map(v => ({ codigo: v.split(' - ')[0], descripcion: v.split(' - ').slice(1).join(' - ') }))
          : null
      },
      operadores: {
        importador: { numeroDocumento: s.nitImportador, tipoDocumento: cd(s.tipoDocImportador || "NIT", TIPO_DOCUMENTO) },
        consignatario: { numeroDocumento: s.nitConsignatario || s.nitImportador, tipoDocumento: cd(s.tipoDocConsignatario || "NIT", TIPO_DOCUMENTO) }
      },
      lugares: {
        paisExportacion: cd(s.paisExportacion, PAISES),
        paisProcedencia: cd(s.paisProcedencia, PAISES),
        paisTransito: cd(s.paisTransito, PAISES),
        aduanaIngreso: cd(s.aduanaIngreso, ADUANAS),
        aduanaDestino: cd(s.aduanaDestino || s.aduanaDespacho, ADUANAS),
        lugarEntrega: s.lugarEntrega
      },
      transporte: {
        cargaPeligrosa: s.cargaPeligrosa ? "true" : "false",
        desdeFrontera: cd(s.viaDesdefrontera, VIAS_TRANSPORTE),
        hastaFrontera: cd(s.viaHastaFrontera, VIAS_TRANSPORTE),
        informacionDocumentosEmbarque: docs
      }
    },
    totalControlDeclaracion: {
      totalFob: s.totalFob || s.facturas.reduce((a, f) => a + parseFloat(f.valorFobTotal || "0"), 0).toFixed(2),
      totalBultos: s.totalBultos,
      totalPesoBruto: s.totalPesoBruto
    },
    proveedores,
    datosTransacciones: transacciones,
    datosMercancias: mercancias
  }

  if (s._rawJson) {
    try {
      const raw = JSON.parse(s._rawJson)
      return {
        ...raw,
        versionExcel: formResult.versionExcel,
        datosGenerales: {
          ...(raw.datosGenerales ?? {}),
          identificacionDeclaracion: {
            ...(raw.datosGenerales?.identificacionDeclaracion ?? {}),
            ...formResult.datosGenerales.identificacionDeclaracion,
          },
          operadores: formResult.datosGenerales.operadores,
          lugares: formResult.datosGenerales.lugares,
          transporte: formResult.datosGenerales.transporte,
        },
        totalControlDeclaracion: {
          totalFob: raw.totalControlDeclaracion?.totalFob || formResult.totalControlDeclaracion.totalFob,
          totalBultos: raw.totalControlDeclaracion?.totalBultos || formResult.totalControlDeclaracion.totalBultos,
          totalPesoBruto: raw.totalControlDeclaracion?.totalPesoBruto || formResult.totalControlDeclaracion.totalPesoBruto,
        },
        proveedores: formResult.proveedores,
        datosTransacciones: formResult.datosTransacciones,
        datosMercancias: formResult.datosMercancias,
      } as DAMJson
    } catch { /* fall through */ }
  }

  return formResult
}

// ─── DIM ─────────────────────────────────────────────────────────────────────

export function buildDIMJson(s: DIMFormState): DIMJson {
  const proveedores: Proveedor[] = s.proveedores.map(p => ({
    tipoDocumento: p.tipoDoc ? cd(p.tipoDoc, TIPO_DOCUMENTO) : null,
    numeroDocumento: p.nroDoc, razonSocial: p.razonSocial,
    domicilio: {
      calleAvenida: p.calleAvenida, numero: p.numero, barrioZona: p.barrioZona,
      pais: cd(p.paisCod, PAISES), departamento: null,
      ciudad: cd(p.ciudadCod, PUERTOS), telefonoFax: p.telefonoFax,
      sitioWeb: null, correoElectronico: p.email
    }
  }))

  const transacciones: Transaccion[] = s.facturas.map(f => ({
    proveedor: {
      razonSocial: f.proveedorRazonSocial, numeroDocumento: f.proveedorNroDoc,
      condicionVendedor: cd(f.proveedorCondicion, CONDICION_VENDEDOR),
      especifiqueCondicionVendedor: f.especifiqueCondVendedor || null,
      paisAdquisicion: cd(f.proveedorPaisAdquisicion, PAISES)
    },
    detalleTransaccion: {
      numeroFactura: f.nroFactura, fechaFactura: f.fechaFactura,
      incoterms: { condicionEntrega: cd(f.incoterm, INCOTERMS), especifiqueCondicionEntrega: f.especifiqueIncoterm || null, lugarEntrega: f.lugarIncoterm },
      naturalezaTransaccion: cd(f.naturaleza, NATURALEZA_TRANSACCION), especifiqueNaturalezaTransaccion: f.especifiqueNaturaleza || null,
      monedaTransaccion: cd(f.moneda, MONEDAS), valorTransaccion: f.valorTransaccion, tipoCambio: parseFloat(f.tipoCambio) || 0,
      destinoMercancia: cd(f.destinoMercancia, DESTINO_MERCANCIA), especifiqueDestinoMercancia: f.especifiqueDestino || null,
      facturaSujetoDescuento: f.facturaSujetoDescuento === "SI" ? "true" : "false",
      nivelComercial: cd(f.nivelComercial || "05", NIVEL_COMERCIAL), especifiqueNivelComercial: ""
    },
    detallePagoTransaccion: {
      formaPago: cd(f.formaPago, FORMAS_PAGO), formaPagoEspecifique: f.especifiqueFormaPago || null,
      medioPago: cd(f.medioPago, MEDIOS_PAGO), medioPagoEspecifique: f.especifiqueMedioPago || null
    },
    valoresCostos: { valorFobTotalUsd: f.valorFobTotal, valorCifTotalUsd: parseFloat(f.valorCifTotal) || 0 },
    totalesControl: {
      numeroPaginas: f.totalPaginas || "1",
      totalItems: f.totalItems || String(s.items.filter(i => i.nroFactura === f.nroFactura).length),
      totalPesoNeto: f.totalPesoNeto || String(s.items.filter(i => i.nroFactura === f.nroFactura).reduce((acc, i) => acc + (parseFloat(i.pesoNeto) || 0), 0).toFixed(3))
    },
    observacionesGenerales: f.observaciones || null
  }))

  const DIM_TIPO_MERC = [
    { cod: "COMUN", desc: "Comunes" }, { cod: "VAGON", desc: "Vagon" },
    { cod: "AERONAVE", desc: "Aeronave" }, { cod: "VEHICULO", desc: "Vehiculo" }
  ]

  const mercancias: ItemMercancia[] = s.items.map(item => {
    const descMin: DescMinItem[] = []
    descMin.push({ "NombreMercancia": cd(item.tipoMercancia || "COMUN", DIM_TIPO_MERC) })
    const espec = item.descMinima["especifiqueNombreTxt"] || item.nandinaDesc
    if (espec) descMin.push({ "especifiqueNombreTxt": String(espec) })
    for (const [k, v] of Object.entries(item.descMinima)) {
      if (v === null || v === undefined || k === "NombreMercancia" || k === "especifiqueNombreTxt") continue
      if (v !== "" && v.startsWith("{")) {
        try { descMin.push({ [k]: JSON.parse(v) }); continue } catch {}
      }
      descMin.push({ [k]: v })
    }
    const dimFact = s.facturas.find(f => f.nroFactura === item.nroFactura) || s.facturas[0]
    const fobNum = parseFloat(item.fobItem) || parseFloat(item.cantFisica) * parseFloat(item.precioUnit) || 0
    return {
      factura: { numeroFactura: item.nroFactura, proveedor: { razonSocial: dimFact?.proveedorRazonSocial || "", numeroDocumento: dimFact?.proveedorNroDoc || "" } },
      identificacionMercanciaItem: {
        subPartidaArancelaria: { codigo: item.nandina, descripcion: item.nandinaDesc },
        unidadMedida: desc(item.umFisica, UNIDAD_COMERCIAL), unidadFisicaConversion: 0,
        cantidadUnidadFisica: item.cantFisica, cantidadFisicaConversion: 0,
        unidadComercial: cd(item.umComercial || item.umFisica, UNIDAD_COMERCIAL),
        unidadComercialEspecifique: 0 as unknown as null,
        cantidadUnidadComercial: item.cantComercial || item.cantFisica,
        precioUnitario: item.precioUnit,
        paisOrigen: cd(item.paisOrigen, PAISES),
        acuerdoComercial: (item.acuerdoComercial && item.acuerdoComercial !== "NA") ? cd(item.acuerdoComercial, ACUERDO_COMERCIAL) : null,
        criterioCalificacionOrigen: (item.criterioCalificacionOrigen && item.criterioCalificacionOrigen !== "")
          ? { codigo: item.criterioCalificacionOrigen, descripcion: desc(item.criterioCalificacionOrigen, CRITERIO_CALIFICACION_ORIGEN) } : null,
        embalaje: { codigo: item.embalaje, descripcion: desc(item.embalaje, EMBALAJE), tag: "false" },
        pesoNeto: item.pesoNeto, marcas: item.marcas || null,
        relacionItemBulto: item.relacionItemBulto || null,
        estado: cd(item.estado || "1", ESTADO_MERCANCIA), estadoEspecifique: null,
        descripcionMercanciaComercial: {
          descripcionMinimasMercancias: descMin,
          tipoMercancia: cd(item.tipoMercancia || "COMUN", DIM_TIPO_MERC),
          codigoOrigenDescripcionMinima: null
        },
        cantidadRitex: item.cantidadRitex || null,
        codigoRitex: item.codigoRitex || null,
        resolucionRitex: item.resolucionRitex || null,
        declaracionPresedente: item.declaracionPresedente || null,
        itemPresedente: item.itemPresedente ? parseInt(item.itemPresedente) : 0,
        subRegimenPresedente: item.subRegimenPresedente || null,
        ime: item.ime || null,
        incExeIva: item.incExeIva || null,
        timbre: item.timbre || null,
        regCodNal: item.regCodNal ? { codigo: item.regCodNal, descripcion: item.regCodNal } : { codigo: " ", descripcion: " " },
        relacionItemEmbalaje: null
      },
      informacionValoresTransaccionItem: {
        valorTransaccionItemUSD: String(fobNum),
        valorFOBItemUSD: String(fobNum),
        valorFOBUnitarioUsd: item.precioUnit
      },
      observaciones: null
    }
  })

  const fobTot = s.facturas.reduce((a, f) => a + parseFloat(f.valorFobTotal || "0"), 0)

  const formResult: DIMJson = {
    versionExcel: "1.9",
    datosGenerales: {
      identificacionDeclaracion: {
        numeroReferencia: s.nroReferencia, numeroDim: null, numeroDocAsociado: null,
        aduanaDespacho: cd(s.aduanaDespacho, ADUANAS),
        formaEnvio: cd(s.formaEnvio, FORMAS_ENVIO),
        destinoRegimenAduanero: cd(s.destinoRegimen, REGIMENES_DESTINO),
        modalidadRegimen: cd(s.modalidadRegimen, MODALIDADES_REGIMEN),
        modalidadDespacho: cd(s.modalidadDespacho, MODALIDADES_DESPACHO),
        tipoDespacho: cd(s.tipoDespacho || "02", TIPOS_DESPACHO_DIM),
        tratamientoEspecial: cd(s.tratamientoEspecial || "000", TRATAMIENTOS_ESPECIALES)
      },
      operadores: {
        entPubAbs: s.entPubAbs,
        importador: { numeroDocumento: s.nitImportador, tipoDocumento: cd(s.tipoDocImportador || "NIT", TIPO_DOCUMENTO) }
      },
      lugares: {
        paisExportacion: cd(s.paisExportacion, PAISES),
        paisProcedencia: cd(s.paisProcedencia, PAISES),
        paisTransito: cd(s.paisTransito, PAISES),
        aduanaIngreso: cd(s.aduanaIngreso, ADUANAS),
        fechaEmbarque: s.fechaEmbarque,
        lugarEmbarque: cd(s.lugarEmbarqueCod, PUERTOS),
        localidadDestino: cd(s.localidadDestinoCod, PUERTOS),
        departamentoDestino: cd(s.departamentoDestinoCod, PAISES)
      },
      transporte: {
        cargaPeligrosa: s.cargaPeligrosa, desdeFrontera: cd(s.viaDesdeFrontera, VIAS_TRANSPORTE),
        hastaFrontera: cd(s.viaHastaFrontera, VIAS_TRANSPORTE), proZonFra: s.proZonFra,
        costoTotalSeguro: s.costoSeguro || "0",
        gastosCargaDescargaManipulacion: s.gastosCargaDescarga || "0",
        gastosTransporteDesdePuertoTransito: s.gastosTransDesdePuerto || "0",
        gastosTransporteHastaLugarEmbarque: s.gastosTransHastaEmbarque || "0",
        gastosTransporteHastaLugarImportacion: s.gastosTransHastaImportacion || "0",
        gastosTransporteHastaPuertoTransito: s.gastosTransHastaPuerto || "0",
        otrasErogaciones: s.otrasErogaciones || "0",
        otrosGastos: s.otrosGastos || "0"
      },
      totalescontrol: {
        totalBul: s.totalBultos || "0", totalFac: String(s.facturas.length),
        totalFob: s.totalFob || fobTot.toFixed(2),
        totalIte: s.items.length, totalPesBru: s.totalPesoBruto || "0", totalPesNet: s.totalPesoNeto || "0"
      }
    },
    proveedores,
    datosTransacciones: transacciones,
    datosMercancias: mercancias
  }

  if (s._rawJson) {
    try {
      const raw = JSON.parse(s._rawJson)
      return {
        ...raw,
        versionExcel: formResult.versionExcel,
        datosGenerales: {
          ...(raw.datosGenerales ?? {}),
          identificacionDeclaracion: {
            ...(raw.datosGenerales?.identificacionDeclaracion ?? {}),
            ...formResult.datosGenerales.identificacionDeclaracion,
          },
          operadores: formResult.datosGenerales.operadores,
          lugares: formResult.datosGenerales.lugares,
          transporte: formResult.datosGenerales.transporte,
          totalescontrol: formResult.datosGenerales.totalescontrol,
        },
        proveedores: formResult.proveedores,
        datosTransacciones: formResult.datosTransacciones,
        datosMercancias: formResult.datosMercancias,
      } as DIMJson
    } catch { /* fall through */ }
  }

  return formResult
}

// ─── DEX ─────────────────────────────────────────────────────────────────────

export function buildDEXJson(s: DEXFormState): DEXJson {
  const items = s.items.map((item, idx) => ({
    numeroItem: idx + 1, idItem: null, idItemPrecedente: null,
    codigoMercancia: {
      subpartida: { codigo: item.nandina, descripcion: null },
      cantidad: item.cantidad, tipoUnidad: null,
      codigoSuplementario: null, codigoComplementario: null
    },
    descripcion: item.descripcion, marcas: item.marcas || null,
    paisOrigen: cd(item.paisOrigen, PAISES),
    regionOrigen: { codigo: "null", descripcion: "" },
    cantidad: item.cantidad, tipoUnidad: cd(item.unidad, UNIDAD_COMERCIAL),
    cantidadBultos: item.cantBultos || "1",
    pesoNeto: item.pesoNeto, pesoBruto: item.pesoBruto || item.pesoNeto,
    precioUnitario: item.precioUnit,
    valorTransaccion: item.valorTransaccion || item.valorFob,
    valorFob: item.valorFob,
    valorFlete: item.valorFlete || null,
    valorFleteInterno: null, valorSeguro: item.valorSeguro || null,
    embalaje: { codigo: item.embalaje, descripcion: desc(item.embalaje, EMBALAJE), tag: null },
    estado: cd(item.estado || "1", ESTADO_MERCANCIA),
    acuerdoComercial: item.acuerdoComercial ? cd(item.acuerdoComercial, ACUERDO_COMERCIAL) : null,
    origenMineralMetal: item.origenMineralMetal,
    codigoNacional: null, consignatario: null, remitente: null,
    plazo: null, modalidadRegimen: { codigo: null, descripcion: null },
    preferenciaArancelaria: null, ritex: null, liquidaciones: null,
    observacion: "", idItemPrecedente2: null
  }))

  const formResult: DEXJson = {
    versionExcel: "1.0",
    tipoFormulario: {
      formulario: { codigo: "DEX-2001", descripcion: "DECLARACION NORMAL" },
      operacion: "SALIDA", tipo: "EXP"
    },
    identificacion: {
      numeroReferencia: s.nroReferencia, aduanaDespacho: cd(s.aduanaDespacho, ADUANAS),
      regimenAduanero: cd(s.regimen || "10", REGIMENES_DEX),
      modalidadRegimen: cd(s.modalidadRegimen || "1000", MODALIDADES_DEX),
      tipoEmbarque: cd(s.tipoEmbarque || "ET", TIPO_EMBARQUE),
      paisTramite: { codigo: "BO", descripcion: "BOLIVIA" },
      numeroDeclaracion: null, numeroCarpeta: null,
      fechaAceptacion: null, fechaAutorizacion: null, fechaConfirmacion: null,
      fechaReciboPago: null, nitDeclarante: null, razonSocial: null,
      reciboPago: null, plazo: null
    },
    operadores: {
      importadorExportador: {
        numeroDocumento: s.nitExportador, tipoDocumento: cd(s.tipoDocExportador || "NIT", TIPO_DOCUMENTO),
        razonSocial: null, email: "", oea: false,
        domicilio: null, marcas: [], documentos: null,
        nroDocumentoIdoneidad: null, tipoEmpresa: null, tipoSolicitante: null, tiposOperadores: null
      },
      consignatario: {
        razonSocial: s.consigRazonSocial, numeroDocumento: s.consigNroDoc,
        tipoDocumento: null, email: s.consigEmail, oea: false,
        domicilio: {
          calle: s.consigCalle, numero: "", zona: "", departamento: "",
          ciudad: cd(s.consigCiudadCod, PUERTOS), pais: cd(s.consigPaisCod, PAISES),
          telefono: "", fax: "", email: s.consigEmail, descripcion: ""
        },
        marcas: [], documentos: null, nroDocumentoIdoneidad: null,
        tipoEmpresa: null, tipoSolicitante: null, tiposOperadores: null
      },
      proveedorDestinatario: null, declaranteRepresentante: null
    },
    lugar: {
      aduanaSalida: cd(s.aduanaSalida || s.aduanaDespacho, ADUANAS),
      lugarEmbarque: cd(s.lugarEmbarqueCod, PUERTOS),
      lugarDesembarque: cd(s.lugarDesembCod, PUERTOS),
      paisDestino: cd(s.paisDestino, PAISES),
      paisTransito: s.paisTransito ? cd(s.paisTransito, PAISES) : null
    },
    transporte: {
      internacional: cd(s.viaInternacional || "3", VIAS_TRANSPORTE),
      nacional: cd(s.viaNacional || "3", VIAS_TRANSPORTE),
      empresaTransporteNacional: null, nombreEmpresaTransporteNacional: null
    },
    valoresTransaccion: {
      condicionEntrega: { condicion: cd(s.incoterm, INCOTERMS), lugarEntrega: s.lugarIncoterm },
      naturalezaTransaccion: cd(s.naturaleza, NATURALEZA_TRANSACCION),
      formaPago: cd(s.formaPago, FORMAS_PAGO), medio: cd(s.medioPago, MEDIOS_PAGO),
      tasaMoneda: { moneda: cd(s.moneda || "USD", MONEDAS), cambio: 0 },
      valorTransaccion: s.valorTransaccion, valorFobUs: s.valorFobUs, valorFobBs: null,
      valorFleteTotal: s.valorFleteTotal || "0",
      valorFleteInterno: s.valorFleteInterno || "0",
      valorSeguro: s.valorSeguro || "0",
      tasaCambio: null, observacion: ""
    },
    totales: {
      cantidadBultos: parseFloat(s.totalBultos) || 0,
      cantidadItems: s.items.length,
      pesoBruto: parseFloat(s.totalPesoBruto) || 0,
      pesoNeto: parseFloat(s.totalPesoNeto) || 0,
      totalBultosAgrupados: 0, totalPesoAgrupados: 0
    },
    items: items as DEXJson["items"],
    estado: "BORRADOR",
    fechaUltimoCambioEstado: null, declaracionPrecedente: null,
    modalidadRegimenPrecedente: null, observacionHtml: "",
    fechaInicioAforo: null, infoBpmDex: null, observacionesAsignacionCanal: null,
    seccionDespacho: null, infoBpmAforo: null, infoBpmDeclaracionPendiente: null,
    infoBpmDexSinManifiesto: null, infoBpmRegularizacion: null, infoBpmDuctos: null,
    infoBpmAjuste: null, declaracionPendiente: null, manifiestosPendientes: null,
    primerManifiestoProcesado: null, primeraGuiaAereaProcesada: null,
    firmaPendiente: false, tramiteSidunea: null,
    liquidaciones: null, documentos: null, documentosFirmados: null,
    mediosalidaFisica: null, fechaSalidaPropiosMedios: null,
    fechaDesglose: null, observacionDesglose: null, desglose: null,
    selectividad: null, conSolicitudAnulacion: false
  }

  if (s._rawJson) {
    try {
      const raw = JSON.parse(s._rawJson)
      return {
        ...raw,
        versionExcel: formResult.versionExcel,
        tipoFormulario: formResult.tipoFormulario,
        identificacion: { ...(raw.identificacion ?? {}), ...formResult.identificacion },
        operadores: formResult.operadores,
        lugar: formResult.lugar,
        transporte: formResult.transporte,
        valoresTransaccion: formResult.valoresTransaccion,
        totales: formResult.totales,
        items: formResult.items,
      } as DEXJson
    } catch { /* fall through */ }
  }

  return formResult
}

// ─── DAV XML ─────────────────────────────────────────────────────────────────

function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

function extractXmlFields(el: Element): Record<string, string> {
  const out: Record<string, string> = {}
  for (const child of Array.from(el.children)) {
    out[child.tagName.toLowerCase()] = child.textContent ?? ""
  }
  return out
}

function buildDavItemXml(fields: Record<string, string>): string {
  const tags = Object.entries(fields)
    .map(([k, v]) => `      <${k}>${xmlEsc(v)}</${k}>`)
    .join("\n")
  return `\n    <items>\n${tags}\n    </items>`
}

function davDate(d: string): string {
  if (!d) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-")
    return `${day}/${m}/${y}`
  }
  return d
}

function padNandina(n: string): string {
  return n.length === 10 ? n + "0" : n
}

export function buildDAVXml(s: DAVFormState): string {
  const fob0 = Math.max(parseFloat(s.fobTotal) || 0, 0.001)
  const fleteTotal = parseFloat(s.flete) || 0
  const seguroTotal = parseFloat(s.seguro) || 0

  const buildItem = (it: DAVItemForm, i: number): string => {
    const fobItem = parseFloat(it.fobItem) || 0
    const ratio = fobItem / fob0
    const fletePror = fleteTotal * ratio
    const seguroPror = seguroTotal * ratio
    const cifItem = fobItem + fletePror + seguroPror
    const peso = Math.max(parseFloat(it.pesoNeto) || 0, 0.001)
    const cifUnit = cifItem / peso
    const f3 = (n: number) => n.toFixed(3)
    const fields: Record<string, string> = {
      c680: String(i + 1),
      c690: padNandina(it.nandina),
      c700: it.nroFactura,
      c701: davDate(it.fechaFactura),
      c710: it.cantidad,
      c711: it.descComercial,
      c7101: it.tipoMercancia,
      c7102: "",
      c7103: it.clase,
      c7104: it.modelo,
      c7105: it.cuanti1,
      c7106: it.cuanti2,
      c7107: it.formatoPresentacion,
      c7108: it.material,
      c7109: "",
      c7110: it.uso,
      c7111: it.otrasCaract,
      c7112: "", c7113: "", c7114: "", c7115: "", c7116: "",
      c7117: "", c7118: "", c7119: "", c7120: "", c7121: "",
      c7122: "", c7123: "", c7124: "", c7125: "", c7126: "", c7127: "", c7128: "",
      c760: "01",
      c770: "",
      c780: "0",
      c790: it.pesoNeto,
      c800: it.embalaje,
      c801: "",
      c820: f3(fobItem),
      c830: f3(parseFloat(it.fleteItem) || 0),
      c840: f3(fobItem + (parseFloat(it.fleteItem) || 0)),
      c850: f3(parseFloat(it.pesoNeto) || 0),
      c860: "0.000", c870: "0.000", c880: "0.000",
      c890: f3(fobItem + (parseFloat(it.fleteItem) || 0)),
      c900: f3(fletePror),
      c910: f3(seguroPror),
      c920: "",
      c930: f3(parseFloat(it.montoGA) || 0),
      c940: "",
      c950: f3(parseFloat(it.ice_monto) || 0),
      c960: "", c970: "0.000", c980: "", c990: "0.000",
      c1000: "", c1010: "0.000", c1020: "", c1030: "0",
      c1040: "", c1050: "0.000", c1060: "", c1070: "0.000",
      c1080: "", c1090: "0.000",
      c1100: "", c1110: "0.000",
      c1120: f3(cifItem),
      c1130: f3(cifUnit),
      c1140: "",
      c1150: "",
      c1160: "0.000",
      c1161: "",
      c1170: "", c1180: "", c1190: "0.000", c1191: "",
      c1200: "", c1210: "", c1220: "0.000", c1221: "", c1230: "",
      c1240: it.paisOrigen,
      c1250: it.paisOrigen,
      c1260: it.paisOrigen,
    }
    const rows = Object.entries(fields).map(([k, v]) => `<${k}><![CDATA[${v}]]></${k}>`).join("\n")
    return `<items>\n${rows}\n</items>`
  }

  // Passthrough: imported DAV merges form values into original XML structure
  if (s._rawJson) {
    try {
      const doc = new DOMParser().parseFromString(s._rawJson, "text/xml")
      const root = doc.documentElement
      const origItemEls = Array.from(root.querySelectorAll("items"))
      const mergedItemsXml = s.items.map((it, i) => {
        const origFields = origItemEls[i] ? extractXmlFields(origItemEls[i]) : {}
        const newFields: Record<string, string> = {}
        // Parse buildItem to get our corrected values and overlay
        const parsed = new DOMParser().parseFromString(`<r>${buildItem(it, i).replace(/<items>|<\/items>/g, "")}</r>`, "text/xml")
        for (const ch of Array.from(parsed.documentElement.children)) {
          newFields[ch.tagName] = ch.textContent ?? ""
        }
        return buildDavItemXml({ ...origFields, ...newFields })
      }).join("")

      const skipTags = new Set(["items", "citem", "cversion",
        "anticipado", "ref",
        "c70","c81","c82","c83","c90","c100","c110","c120","c130","c140","c150","c160",
        "c170","c180","c190","c200","c210","c220","c230","c240","c250",
        "c260","c270","c271","c280",
        "c290","c300","c310","c320","c330","c340","c350","c360","c361","c370","c380","c390",
        "c550","c560","c570",
        "c620","c621","c622","c630","c631","c632","c633","c634","c640","c650","c660","c670",
        "c1270","c1281","c1282","c1283","c1290","c1300","c1310","c1320","c1330","c1340",
      ])
      const extra: string[] = []
      for (const ch of Array.from(root.children)) {
        const t = ch.tagName.toLowerCase()
        if (!skipTags.has(t)) extra.push(`<${t}>${xmlEsc(ch.textContent ?? "")}</${t}>`)
      }
      return buildDAVFull(s, mergedItemsXml + (extra.length ? "\n" + extra.join("\n") : ""))
    } catch { /* fall through */ }
  }

  const itemsXml = s.items.map((it, i) => buildItem(it, i)).join("\n")
  return buildDAVFull(s, itemsXml)
}

function buildDAVFull(s: DAVFormState, itemsXml: string): string {
  const x = (v: string) => `<![CDATA[${v}]]>`
  const cifTot = s.cifTotal || s.fobTotal
  return `<?xml version="1.0" encoding="UTF-8"?>
<dav>
<anticipado>${x("0")}</anticipado>
<ref>${x(s.refDam)}</ref>
<c30>${x("")}</c30><c31>${x("")}</c31><c32>${x("")}</c32><c33>${x("")}</c33>
<c40>${x("")}</c40><c41>${x("")}</c41><c42>${x("")}</c42><c43>${x("")}</c43>
<c50>${x("")}</c50><c51>${x("")}</c51><c52>${x("")}</c52><c53>${x("")}</c53>
<c60>${x("")}</c60><c61>${x("")}</c61><c62>${x("")}</c62><c63>${x("")}</c63>
<c70>${x(s.importadorRazonSocial)}</c70>
<c81>${x(s.importadorTipoDoc)}</c81>
<c82>${x(s.importadorNroDoc)}</c82>
<c83>${x(s.importadorDepartamento || "LP")}</c83>
<c90>${x("01")}</c90>
<c100>${x("")}</c100>
<c110>${x(s.importadorCalle)}</c110>
<c120>${x(s.importadorCiudad)}</c120>
<c130>${x(s.importadorPais || "BO")}</c130>
<c140>${x(s.importadorTel)}</c140>
<c150>${x("")}</c150>
<c160>${x(s.importadorEmail)}</c160>
<c170>${x(s.vendedorRazonSocial)}</c170>
<c180>${x(s.vendedorCondicion)}</c180>
<c190>${x("")}</c190>
<c200>${x(s.vendedorCalle)}</c200>
<c210>${x(s.vendedorCiudad)}</c210>
<c220>${x(s.vendedorPais)}</c220>
<c230>${x(s.vendedorTel)}</c230>
<c240>${x("")}</c240>
<c250>${x(s.vendedorEmail)}</c250>
<c260>${x(s.nroFacturas)}</c260>
<c270>${x(s.facturas.split(",")[0]?.trim() || "")}</c270>
<c271>${x(s.facturas.split(",").slice(1).join(",").trim())}</c271>
<c280>${x("")}</c280>
<c290>${x(s.tipoVenta)}</c290>
<c300>${x("")}</c300>
<c310>${x(s.condicionEntrega)}</c310>
<c320>${x("")}</c320>
<c330>${x(s.formaPago)}</c330>
<c340>${x(s.medioPago)}</c340>
<c350>${x("")}</c350>
<c360>${x(s.incoterm)}</c360>
<c361>${x(s.lugarIncoterm)}</c361>
<c370>${x("")}</c370>
<c380>${x(s.fobTotal)}</c380>
<c390>${x(s.restricciones === "1" ? "SI" : "NO")}</c390>
<c400>${x("")}</c400><c410>${x("")}</c410><c420>${x("")}</c420><c430>${x("")}</c430>
<c440>${x("")}</c440><c450>${x("")}</c450><c460>${x("")}</c460><c470>${x("")}</c470><c480>${x("")}</c480>
<c490>${x("NO")}</c490><c500>${x("")}</c500><c510>${x("NO")}</c510>
<c520>${x("")}</c520><c530>${x("")}</c530><c540>${x("")}</c540>
<c550>${x(s.vinculacion === "1" ? "SI" : "NO")}</c550>
<c560>${x(s.vinculacionInfluye === "1" ? "SI" : "NO")}</c560>
<c570>${x(s.vinculacionPrecioAprox === "1" ? "SI" : "NO")}</c570>
<c580>${x("")}</c580><c590>${x("")}</c590><c600>${x("")}</c600><c610>${x("")}</c610><c611>${x("")}</c611>
<c620>${x(cifTot)}</c620>
<c621>${x(cifTot)}</c621>
<c622>${x("")}</c622>
<c631>${x("0")}</c631><c632>${x("0")}</c632><c633>${x("0")}</c633><c634>${x("0")}</c634>
<c630>${x(s.flete || "0")}</c630>
<c640>${x(s.seguro || "0")}</c640>
<c650>${x("0")}</c650>
<c660>${x("0")}</c660>
<c670>${x(cifTot)}</c670>
<c1281>${x(s.declaranteTipoDoc || s.importadorTipoDoc)}</c1281>
<c1282>${x(s.declaranteNroDoc || s.importadorNroDoc)}</c1282>
<c1283>${x(s.declaranteDepartamento || s.importadorDepartamento || "LP")}</c1283>
<c1270>${x(s.declaranteNombre || s.importadorRazonSocial)}</c1270>
<c1290>${x(s.declaranteCalle || s.importadorCalle)}</c1290>
<c1300>${x(s.declaranteCiudad || s.importadorCiudad)}</c1300>
<c1310>${x(s.declaranteTel || s.importadorTel)}</c1310>
<c1320>${x(s.apoderadoNombre)}</c1320>
<c1330>${x(s.apoderadoCI)}</c1330>
<c1340>${x(s.observaciones)}</c1340>
${itemsXml}
<citem>${x(String(s.items.length))}</citem>
<cversion>${x("2.4")}</cversion>
</dav>`
}

// ─── download helpers ─────────────────────────────────────────────────────────

export function downloadJson(data: object, filename: string) {
  const json = JSON.stringify(data, null, 2)
  // GESDES lee el archivo como Windows-1252 (ANSI). Convertimos char a char.
  // Todos los caracteres del JSON aduanero boliviano estan en el rango 0-255
  // y los valores cp1252 coinciden con ISO-8859-1 para ese rango.
  const bytes = new Uint8Array(json.length)
  for (let i = 0; i < json.length; i++) {
    const code = json.charCodeAt(i)
    bytes[i] = code <= 255 ? code : 63 // '?' para caracteres fuera de rango
  }
  const blob = new Blob([bytes], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function downloadXml(xml: string, filename: string) {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
