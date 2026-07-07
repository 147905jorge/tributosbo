// Tipos que mapean exactamente la estructura JSON de GESDES

export type CodDesc = { codigo: string; descripcion: string }

// ─── DAM / DIM shared ──────────────────────────────────────────────────────

export type ProveedorDomicilio = {
  calleAvenida: string; numero: string; barrioZona: string
  pais: CodDesc; departamento: CodDesc | null; ciudad: CodDesc
  telefonoFax: string; sitioWeb: string | null; correoElectronico: string
}

export type Proveedor = {
  tipoDocumento: CodDesc | null; numeroDocumento: string | null; razonSocial: string
  domicilio: ProveedorDomicilio
}

export type DocEmbarque = {
  fechaEmbarque: string; lugarEmbarque: CodDesc; paisEmbarque: CodDesc
  numeroDocumentoEmbarque: string; tipoDocumentoEmbarque: CodDesc
  provieneZonaFranca: CodDesc
}

export type IncotermsVal = {
  condicionEntrega: CodDesc; especifiqueCondicionEntrega: string | null
  lugarEntrega: string
}

export type DetalleTransaccion = {
  numeroFactura: string; fechaFactura: string
  incoterms: IncotermsVal
  naturalezaTransaccion: CodDesc; especifiqueNaturalezaTransaccion: string | null
  monedaTransaccion: CodDesc; valorTransaccion: string; tipoCambio: number
  destinoMercancia: CodDesc; especifiqueDestinoMercancia: string | null
  facturaSujetoDescuento: string
  // DIM only
  nivelComercial?: CodDesc; especifiqueNivelComercial?: string
}

export type DetallePagoTransaccion = {
  formaPago: CodDesc; formaPagoEspecifique: string | null
  medioPago: CodDesc; medioPagoEspecifique: string | null
}

export type ValoresCostos = {
  valorFobTotalUsd: string; valorCifTotalUsd: number | string
}

export type Transaccion = {
  proveedor: {
    razonSocial: string; numeroDocumento: string
    condicionVendedor: CodDesc; especifiqueCondicionVendedor: string | null
    paisAdquisicion: CodDesc
  }
  detalleTransaccion: DetalleTransaccion
  detallePagoTransaccion: DetallePagoTransaccion
  valoresCostos: ValoresCostos
  totalesControl: { numeroPaginas: string; totalItems: string; totalPesoNeto: string }
  observacionesGenerales: string | null
}

export type DescMinItem = Record<string, string | CodDesc | (CodDesc & { especifique?: string })>

export type DescripcionMercanciaComercial = {
  tipoMercancia: CodDesc
  codigoOrigenDescripcionMinima: string | null
  descripcionMinimasMercancias: DescMinItem[]
}

export type ItemMercancia = {
  factura: { numeroFactura: string; proveedor: { razonSocial: string; numeroDocumento: string } }
  identificacionMercanciaItem: {
    subPartidaArancelaria: CodDesc
    unidadMedida: string
    unidadFisicaConversion: number
    cantidadUnidadFisica: string
    cantidadFisicaConversion: number
    unidadComercial: CodDesc; unidadComercialEspecifique: string | null
    cantidadUnidadComercial: string
    precioUnitario: string
    paisOrigen: CodDesc
    acuerdoComercial: CodDesc | null; criterioCalificacionOrigen: CodDesc | null
    embalaje: { codigo: string; descripcion: string; tag: string }
    pesoNeto: string; marcas: string | null
    relacionItemBulto: string | null; estado: CodDesc; estadoEspecifique: string | null
    descripcionMercanciaComercial: DescripcionMercanciaComercial
    // DIM extras
    cantidadRitex?: string | null; codigoRitex?: string | null; resolucionRitex?: string | null
    declaracionPresedente?: string | null; itemPresedente?: number; subRegimenPresedente?: string | null
    ime?: string | null; incExeIva?: string | null; timbre?: string | null
    regCodNal?: CodDesc; relacionItemEmbalaje?: string | null
  }
  informacionValoresTransaccionItem: {
    valorTransaccionItemUSD: string; valorFOBItemUSD: string; valorFOBUnitarioUsd: string
  }
  observaciones: number | null
}

// ─── DAM v2.8 ────────────────────────────────────────────────────────────────

export type DAMJson = {
  versionExcel: string
  datosGenerales: {
    identificacionDeclaracion: {
      numeroReferencia: string
      aduanaDespacho: CodDesc; formaEnvio: CodDesc; cargaConsolidada: CodDesc
      destinoRegimenAduanero: CodDesc; modalidadRegimen: CodDesc
      modalidadDespacho: CodDesc | null; tipoDam: string
      desRegPos: CodDesc | null; modDesPos: CodDesc | null
      emiParRec: CodDesc; tipMer: CodDesc[] | null
    }
    operadores: {
      importador: { numeroDocumento: string; tipoDocumento: CodDesc }
      consignatario: { numeroDocumento: string; tipoDocumento: CodDesc }
    }
    lugares: {
      paisExportacion: CodDesc; paisProcedencia: CodDesc; paisTransito: CodDesc
      aduanaIngreso: CodDesc; aduanaDestino: CodDesc; lugarEntrega: string
    }
    transporte: {
      cargaPeligrosa: boolean | string; desdeFrontera: CodDesc; hastaFrontera: CodDesc
      informacionDocumentosEmbarque: DocEmbarque[]
    }
  }
  totalControlDeclaracion: { totalFob: string; totalBultos: string; totalPesoBruto: string }
  proveedores: Proveedor[]
  datosTransacciones: Transaccion[]
  datosMercancias: ItemMercancia[]
}

// ─── DIM v1.8 ────────────────────────────────────────────────────────────────

export type DIMJson = {
  versionExcel: string
  datosGenerales: {
    identificacionDeclaracion: {
      numeroReferencia: string; numeroDim: string | null; numeroDocAsociado: string | null
      aduanaDespacho: CodDesc; formaEnvio: CodDesc
      destinoRegimenAduanero: CodDesc; modalidadRegimen: CodDesc
      modalidadDespacho: CodDesc; tipoDespacho: CodDesc; tratamientoEspecial: CodDesc
    }
    operadores: {
      entPubAbs: boolean
      importador: { numeroDocumento: string; tipoDocumento: CodDesc }
    }
    lugares: {
      paisExportacion: CodDesc; paisProcedencia: CodDesc; paisTransito: CodDesc
      aduanaIngreso: CodDesc; fechaEmbarque: string
      lugarEmbarque: CodDesc; localidadDestino: CodDesc; departamentoDestino: CodDesc
    }
    transporte: {
      cargaPeligrosa: boolean | string; desdeFrontera: CodDesc; hastaFrontera: CodDesc
      proZonFra: boolean
      costoTotalSeguro: string; gastosCargaDescargaManipulacion: string
      gastosTransporteDesdePuertoTransito: string; gastosTransporteHastaLugarEmbarque: string
      gastosTransporteHastaLugarImportacion: string; gastosTransporteHastaPuertoTransito: string
      otrasErogaciones: string; otrosGastos: string
    }
    totalescontrol: {
      totalBul: string; totalFac: string; totalFob: string
      totalIte: number; totalPesBru: string; totalPesNet: string
    }
  }
  proveedores: Proveedor[]
  datosTransacciones: Transaccion[]
  datosMercancias: ItemMercancia[]
}

// ─── DEX v1.0 ────────────────────────────────────────────────────────────────

export type DEXItem = {
  numeroItem: number; idItem: null; idItemPrecedente: null
  codigoMercancia: {
    subpartida: { codigo: string; descripcion: string | null }
    cantidad: string; tipoUnidad: CodDesc | null
    codigoSuplementario: null; codigoComplementario: null
  }
  descripcion: string; marcas: string | null
  paisOrigen: CodDesc; regionOrigen: { codigo: string; descripcion: string }
  cantidad: string; tipoUnidad: CodDesc; cantidadBultos: string
  pesoNeto: string; pesoBruto: string; precioUnitario: string
  valorTransaccion: string; valorFob: string
  valorFlete: string | null; valorFleteInterno: string | null; valorSeguro: string | null
  embalaje: { codigo: string; descripcion: string; tag: string | null }
  estado: CodDesc; acuerdoComercial: CodDesc | null; origenMineralMetal: boolean
  codigoNacional: null; consignatario: null; remitente: null
  plazo: null; modalidadRegimen: { codigo: null; descripcion: null }
  preferenciaArancelaria: null; ritex: null; liquidaciones: null
  observacion: string; idItemPrecedente2: null
}

export type DEXJson = {
  versionExcel: string
  tipoFormulario: {
    formulario: CodDesc; operacion: "SALIDA"; tipo: "EXP"
  }
  identificacion: {
    numeroReferencia: string; aduanaDespacho: CodDesc
    regimenAduanero: CodDesc; modalidadRegimen: CodDesc
    tipoEmbarque: CodDesc; paisTramite: CodDesc
    numeroDeclaracion: null; numeroCarpeta: null
    fechaAceptacion: null; fechaAutorizacion: null; fechaConfirmacion: null
    fechaReciboPago: null; nitDeclarante: null; razonSocial: null
    reciboPago: null; plazo: null
  }
  operadores: {
    importadorExportador: {
      numeroDocumento: string; tipoDocumento: CodDesc
      razonSocial: null; email: string; oea: boolean
      domicilio: null; marcas: []; documentos: null
      nroDocumentoIdoneidad: null; tipoEmpresa: null; tipoSolicitante: null; tiposOperadores: null
    }
    consignatario: {
      razonSocial: string; numeroDocumento: string; tipoDocumento: null
      email: string; oea: boolean
      domicilio: {
        calle: string; numero: string; zona: string; departamento: string
        ciudad: CodDesc; pais: CodDesc; telefono: string; fax: string
        email: string; descripcion: string
      }
      marcas: []; documentos: null; nroDocumentoIdoneidad: null
      tipoEmpresa: null; tipoSolicitante: null; tiposOperadores: null
    }
    proveedorDestinatario: null; declaranteRepresentante: null
  }
  lugar: {
    aduanaSalida: CodDesc; lugarEmbarque: CodDesc; lugarDesembarque: CodDesc
    paisDestino: CodDesc; paisTransito: CodDesc | null
  }
  transporte: {
    internacional: CodDesc; nacional: CodDesc
    empresaTransporteNacional: null; nombreEmpresaTransporteNacional: null
  }
  valoresTransaccion: {
    condicionEntrega: { condicion: CodDesc; lugarEntrega: string }
    naturalezaTransaccion: CodDesc; formaPago: CodDesc; medio: CodDesc
    tasaMoneda: { moneda: CodDesc; cambio: number }
    valorTransaccion: string; valorFobUs: string; valorFobBs: null
    valorFleteTotal: string; valorFleteInterno: string; valorSeguro: string
    tasaCambio: null; observacion: string
  }
  totales: {
    cantidadBultos: number; cantidadItems: number
    pesoBruto: number; pesoNeto: number
    totalBultosAgrupados: number; totalPesoAgrupados: number
  }
  items: DEXItem[]
  estado: "BORRADOR"
  fechaUltimoCambioEstado: null
  declaracionPrecedente: null; modalidadRegimenPrecedente: null
  observacionHtml: string
  // SUMA system fields (null on creation)
  fechaInicioAforo: null; infoBpmDex: null; observacionesAsignacionCanal: null
  seccionDespacho: null; infoBpmAforo: null; infoBpmDeclaracionPendiente: null
  infoBpmDexSinManifiesto: null; infoBpmRegularizacion: null; infoBpmDuctos: null
  infoBpmAjuste: null; declaracionPendiente: null; manifiestosPendientes: null
  primerManifiestoProcesado: null; primeraGuiaAereaProcesada: null
  firmaPendiente: boolean; tramiteSidunea: null
  liquidaciones: null; documentos: null; documentosFirmados: null
  mediosalidaFisica: null; fechaSalidaPropiosMedios: null
  fechaDesglose: null; observacionDesglose: null; desglose: null
  selectividad: null; conSolicitudAnulacion: boolean
}

// ─── DAV v2.4 (XML casillas) ────────────────────────────────────────────────

export type DAVItem = {
  c680: string   // N item
  c690: string   // NANDINA
  c700: string   // N factura
  c701: string   // Fecha factura
  c710: string   // Cantidad
  c711: string   // Descripcion comercial
  c7101: string  // Nombre mercancia (vendedor)
  c7102: string  // Tipo
  c7103: string  // Clase
  c7104: string  // Modelo
  c7105: string  // Cuanti1
  c7106: string  // Cuanti2
  c7107: string  // Formato/Presentacion
  c7108: string  // Material
  c7109: string  // Especificacion tecnica
  c7110: string  // Uso/Aplicacion
  c7111: string  // Otras caract 1
  c7112: string  // Otras caract 2
  c7113: string  // Forma presentacion
  c7114: string  // Campo extra 1
  c7115: string  // Composicion
  c7116: string  // Campo extra 2
  c7117: string  // Funcion
  c7118: string  // Campo extra 3
  c7119: string  // Codigo producto
  c7120: string; c7121: string; c7122: string; c7123: string
  c7124: string; c7125: string; c7126: string; c7127: string; c7128: string
  c760: string   // Pais origen
  c770: string   // Acuerdo comercial
  c780: string   // Sujeto descuento (0/1)
  c790: string   // Anio fabricacion
  c800: string   // Embalaje cod
  c801: string   // Embalaje desc
  c820: string   // FOB item
  c830: string   // Flete item
  c840: string   // CIF item
  c850: string   // Peso neto item
  c860: string; c870: string; c880: string // ajustes
  c890: string   // CIF ajustado
  c900: string   // GA %
  c910: string   // Monto GA
  c920: string; c930: string   // ICE
  c940: string; c950: string   // IVA
  c960: string; c970: string   // IEHD
  c980: string; c990: string   // Otros tributos
  c1000: string; c1010: string; c1020: string; c1030: string
  c1040: string; c1050: string; c1060: string; c1070: string
  c1080: string; c1090: string
  c1120: string  // Peso total
  c1130: string  // Peso neto total
  c1150: string  // Moneda
  c1160: string  // Tipo cambio
  c1161: string  // Fecha tipo cambio
  c1170: string; c1180: string; c1190: string; c1191: string
  c1200: string; c1210: string; c1220: string; c1221: string; c1230: string
  c1240: string  // Pais origen (cod)
  c1250: string  // Pais procedencia (cod)
  c1260: string  // Pais exportacion (cod)
}

export type DAVData = {
  ref: string
  cversion: "2.4"
  anticipado: string
  // Importador
  c70: string   // Razon social importador
  c81: string   // Tipo doc importador
  c82: string   // N doc importador
  c83: string   // Ciudad importador
  c90: string   // N orden
  c100: string  // Ref DAM
  c110: string  // Calle importador
  c120: string  // Ciudad importador
  c130: string  // Pais importador (cod)
  c140: string  // Telefono
  c150: string  // Fax
  c160: string  // Email
  // Vendedor
  c170: string  // Razon social vendedor
  c180: string  // Condicion vendedor
  c190: string  // Especifique
  c200: string  // Calle vendedor
  c210: string  // Ciudad vendedor
  c220: string  // Pais vendedor (cod)
  c230: string  // Tel vendedor
  c240: string  // Fax vendedor
  c250: string  // Email vendedor
  // Facturas
  c260: string  // N facturas
  c270: string  // N factura 1
  c271: string  // N factura 2+
  // Transaccion
  c290: string  // Tipo venta
  c300: string  // Esp tipo venta
  c310: string  // Condicion entrega
  c320: string  // Especifique entrega
  c330: string  // Forma pago
  c340: string  // Medio pago
  c350: string  // Descuento (SI/NO)
  c360: string  // Incoterms
  c361: string  // Lugar incoterms
  c370: string  // Comisiones corretajes
  c380: string  // FOB total USD
  c390: string  // Restricciones (SI/NO)
  c30: string; c31: string; c32: string; c33: string
  c40: string; c41: string; c42: string; c43: string
  c50: string; c51: string; c52: string; c53: string
  c60: string; c61: string; c62: string; c63: string
  // Vinculacion
  c400: string; c410: string; c420: string; c430: string
  c440: string; c450: string; c460: string; c470: string; c480: string
  c490: string  // Mercancias identicas (NO/SI)
  c500: string
  c510: string  // Mercancias similares (NO/SI)
  c520: string; c530: string; c540: string
  c550: string  // Vinculacion comprador/vendedor (NO/SI)
  c560: string  // Vinculacion influye precio (NO/SI)
  c570: string  // Precio aprox precio libre (NO/SI)
  c580: string; c590: string; c600: string; c610: string; c611: string
  // Valores
  c620: string  // CIF total USD
  c621: string  // CIF total Bs
  c622: string  // Aduana cod
  c630: string  // Flete total
  c631: string; c632: string; c633: string; c634: string
  c640: string  // Seguro
  c650: string; c660: string
  c670: string  // Total ajustes CIF
  // Items
  citem: string
  items: DAVItem[]
}

// ─── UI form state types ────────────────────────────────────────────────────

export type TipoDoc = "DAM" | "DIM" | "DEX" | "DAV"

// Form state for items grid (shared DAM/DIM)
export type ItemForm = {
  id: string
  nroFactura: string; nandina: string; nandinaDesc: string
  tipoMercancia: string; descMinima: Record<string, string>
  umFisica: string; cantFisica: string; unidadFisicaConversion: string; cantFisicaConversion: string
  umComercial: string; umComercialEspecifique: string; cantComercial: string
  precioUnit: string; paisOrigen: string; acuerdoComercial: string
  criterioCalificacionOrigen: string
  pesoNeto: string; embalaje: string; estado: string; estadoEspecifique: string; marcas: string
  relacionItemBulto: string
  valorTransaccionItem: string; fobItem: string; ga_pct: string; ice_pct: string; iva_pct: string
  observaciones: string
  // DIM extras
  codigoRitex: string; cantidadRitex: string; resolucionRitex: string
  incExeIva: string; timbre: string; ime: string; regCodNal: string
  declaracionPresedente: string; itemPresedente: string; subRegimenPresedente: string
}

export type FacturaForm = {
  id: string
  nroFactura: string; fechaFactura: string
  proveedorRazonSocial: string; proveedorNroDoc: string; proveedorCondicion: string
  especifiqueCondVendedor: string
  proveedorPaisAdquisicion: string
  incoterm: string; lugarIncoterm: string; especifiqueIncoterm: string
  naturaleza: string; especifiqueNaturaleza: string
  moneda: string; valorTransaccion: string; tipoCambio: string
  formaPago: string; especifiqueFormaPago: string
  medioPago: string; especifiqueMedioPago: string
  destinoMercancia: string; especifiqueDestino: string
  facturaSujetoDescuento: string
  nivelComercial: string
  valorFobTotal: string; valorCifTotal: string
  totalPaginas: string; totalItems: string; totalPesoNeto: string
  observaciones: string
}

export type DocEmbarqueForm = {
  id: string
  tipoDoc: string; nroDoc: string; fechaEmbarque: string
  lugarEmbarqueCod: string; paisEmbarqueCod: string; provieneZonaFranca: string
}

export type ProveedorForm = {
  id: string
  razonSocial: string; tipoDoc: string; nroDoc: string; nroDocIsNull?: boolean
  calleAvenida: string; numero: string; barrioZona: string
  paisCod: string; departamentoJson?: string; ciudadCod: string; telefonoFax: string; email: string
}

// DAM form state
export type DAMFormState = {
  // Identificacion
  nroReferencia: string; aduanaDespacho: string; formaEnvio: string
  cargaConsolidada: string; destinoRegimen: string; modalidadRegimen: string
  modalidadDespacho: string; tipoDam: string; desRegPosCod: string
  modDesPosCode: string; emiParRec: string; tipMercaderia: string[]
  // Operadores
  nitImportador: string; tipoDocImportador: string; razonSocialImportador: string
  nitConsignatario: string; tipoDocConsignatario: string; razonSocialConsignatario: string
  // Lugares
  paisExportacion: string; paisProcedencia: string; paisTransito: string
  aduanaIngreso: string; aduanaDestino: string; lugarEntrega: string
  // Transporte
  viaHastaFrontera: string; viaDesdefrontera: string; cargaPeligrosa: boolean
  docsEmbarque: DocEmbarqueForm[]
  // Control totals
  totalFob: string; totalBultos: string; totalPesoBruto: string; totalPesoNeto: string
  // Ajustes CIF (para calculo de tributos, no se exportan al JSON)
  fleteTotal: string; seguroTotal: string
  // Proveedor principal
  proveedores: ProveedorForm[]
  // Facturas
  facturas: FacturaForm[]
  // Items
  items: ItemForm[]
  // JSON original importado (pass-through para campos no editables)
  _rawJson?: string
}

// DIM form state (extends DAM with different fields)
export type DIMFormState = {
  nroReferencia: string; aduanaDespacho: string; formaEnvio: string
  destinoRegimen: string; modalidadRegimen: string; modalidadDespacho: string
  tipoDespacho: string; tratamientoEspecial: string; numeroDim: string
  entPubAbs: boolean
  nitImportador: string; tipoDocImportador: string
  paisExportacion: string; paisProcedencia: string; paisTransito: string
  aduanaIngreso: string; fechaEmbarque: string; lugarEmbarqueCod: string
  localidadDestinoCod: string; departamentoDestinoCod: string
  viaHastaFrontera: string; viaDesdeFrontera: string; cargaPeligrosa: boolean
  proZonFra: boolean
  costoSeguro: string; gastosCargaDescarga: string
  gastosTransDesdePuerto: string; gastosTransHastaEmbarque: string
  gastosTransHastaImportacion: string; gastosTransHastaPuerto: string
  otrasErogaciones: string; otrosGastos: string
  totalBultos: string; totalFacturas: string; totalFob: string
  totalPesoBruto: string; totalPesoNeto: string
  proveedores: ProveedorForm[]
  facturas: FacturaForm[]
  items: ItemForm[]
  _rawJson?: string
}

// DEX form state
export type DEXFormState = {
  _rawJson?: string
  nroReferencia: string; aduanaDespacho: string; regimen: string
  modalidadRegimen: string; tipoEmbarque: string
  nitExportador: string; tipoDocExportador: string
  consigRazonSocial: string; consigNroDoc: string; consigEmail: string
  consigCalle: string; consigNumero: string; consigPaisCod: string; consigCiudadCod: string
  aduanaSalida: string; lugarEmbarqueCod: string; lugarDesembCod: string
  paisDestino: string; paisTransito: string
  viaInternacional: string; viaNacional: string
  incoterm: string; lugarIncoterm: string; naturaleza: string
  formaPago: string; medioPago: string; moneda: string; tipoCambio: string
  valorTransaccion: string; valorFobUs: string
  valorFleteTotal: string; valorFleteInterno: string; valorSeguro: string
  totalBultos: string; totalPesoBruto: string; totalPesoNeto: string
  items: DEXItemForm[]
}

export type DEXItemForm = {
  id: string
  nandina: string; nandinaDesc: string; descripcion: string; marcas: string
  paisOrigen: string; cantidad: string; unidad: string; cantBultos: string
  pesoNeto: string; pesoBruto: string; precioUnit: string
  valorTransaccion: string; valorFob: string; valorFlete: string; valorSeguro: string
  embalaje: string; estado: string; acuerdoComercial: string; origenMineralMetal: boolean
}

// DAV form state
export type DAVFormState = {
  _rawJson?: string
  refDam: string
  // Importador
  importadorRazonSocial: string; importadorTipoDoc: string; importadorNroDoc: string
  importadorDepartamento: string; importadorCiudad: string; importadorPais: string
  importadorCalle: string; importadorTel: string; importadorFax: string; importadorEmail: string
  // Vendedor
  vendedorRazonSocial: string; vendedorCondicion: string
  vendedorCalle: string; vendedorCiudad: string; vendedorPais: string
  vendedorTel: string; vendedorEmail: string
  // Facturas
  nroFacturas: string; facturas: string
  // Transaccion
  tipoVenta: string; condicionEntrega: string; incoterm: string; lugarIncoterm: string
  formaPago: string; medioPago: string; sujDescuento: string
  comisiones: string; fobTotal: string; restricciones: string
  // Ajustes CIF
  flete: string; seguro: string; otrosGastos: string; cifTotal: string; aduana: string
  // Vinculacion
  vinculacion: string; vinculacionInfluye: string; vinculacionPrecioAprox: string
  // Declarante / Representante (c1270-c1340)
  declaranteNombre: string; declaranteTipoDoc: string; declaranteNroDoc: string
  declaranteDepartamento: string; declaranteCalle: string; declaranteCiudad: string
  declaranteTel: string; apoderadoNombre: string; apoderadoCI: string
  observaciones: string
  // Items
  items: DAVItemForm[]
}

export type DAVItemForm = {
  id: string; nroItem: string; nandina: string; nroFactura: string; fechaFactura: string
  cantidad: string; descComercial: string; tipoMercancia: string; clase: string
  modelo: string; cuanti1: string; cuanti2: string; formatoPresentacion: string
  material: string; uso: string; otrasCaract: string
  paisOrigen: string; acuerdoComercial: string; anioFab: string; embalaje: string
  fobItem: string; fleteItem: string; cifItem: string; pesoNeto: string
  ga_pct: string; montoGA: string; ice_monto: string; iva_monto: string
  moneda: string; tipoCambio: string
}
