"use client"
import { useState, useEffect, useCallback } from "react"
import { Clock, RefreshCw, Users, CheckCircle, LogOut as LogOutIcon, LogIn, Download } from "lucide-react"
import { api } from "@/lib/api"

type Persona = {
  persona_id: string; nombre: string
  primera: string | null; ultima: string | null
  estado: string; total: number
}
type Resumen = {
  fecha: string; total_empleados_con_marca: number
  total_registros: number; personas: Persona[]
}
type DiaDet = {
  persona_id: string; nombre: string; fecha: string
  ingreso_manana: string | null; ingreso_tarde: string | null; salida: string | null
  atraso_manana_min: number; atraso_manana_str: string
  atraso_tarde_min: number; atraso_tarde_str: string
  tiene_atraso: boolean; total_marcaciones: number
  sin_ingreso_tarde: boolean
}
type Empleado = {
  persona_id: string; nombre: string
  dias_presentes: number; dias_con_atraso: number
  atrasos_manana: number; atrasos_tarde: number
  total_min_atraso_str: string; detalle: DiaDet[]
}
type Reporte = {
  fecha_ini: string; fecha_fin: string
  total_registros: number; empleados: Empleado[]
}

const ESTADO_COLOR: Record<string, string> = {
  Entrada: "#10b981", "Entrada/Salida": "#10b981",
  Regreso: "#3b82f6", Descanso: "#f59e0b", Salida: "#6b7280",
}
const ESTADO_LABEL: Record<string, string> = {
  Entrada: "Presente", "Entrada/Salida": "Presente",
  Regreso: "Regreso", Descanso: "Descanso", Salida: "Retirado",
}
const hoy    = () => new Date().toISOString().substring(0, 10)
const priMes = () => { const d = new Date(); d.setDate(1); return d.toISOString().substring(0, 10) }

export default function AsistenciaPage() {
  const [tab, setTab] = useState<"resumen" | "atrasos" | "reporte">("resumen")

  // Resumen
  const [fechaRes, setFechaRes] = useState(hoy())
  const [resumen,  setResumen]  = useState<Resumen | null>(null)
  const [loadRes,  setLoadRes]  = useState(true)
  const [errRes,   setErrRes]   = useState("")
  const [lastSync, setLastSync] = useState("")

  // Atrasos
  const [fiAtr,    setFiAtr]  = useState(priMes())
  const [ffAtr,    setFfAtr]  = useState(hoy())
  const [empAtr,   setEmpAtr] = useState("")
  const [repAtr,   setRepAtr] = useState<Reporte | null>(null)
  const [loadAtr,  setLoadAtr] = useState(false)
  const [errAtr,   setErrAtr] = useState("")

  // Reporte
  const [fiRep,    setFiRep]  = useState(priMes())
  const [ffRep,    setFfRep]  = useState(hoy())
  const [repData,  setRepData] = useState<Reporte | null>(null)
  const [loadRep,  setLoadRep] = useState(false)

  const cargarResumen = useCallback(async (f: string) => {
    setLoadRes(true); setErrRes("")
    try {
      const r = await api.get(`/asistencia/resumen?fecha=${f}`)
      setResumen(r)
      setLastSync(new Date().toLocaleTimeString("es-BO"))
    } catch (e: unknown) {
      setErrRes(e instanceof Error ? e.message : "Error de conexion")
    } finally { setLoadRes(false) }
  }, [])

  useEffect(() => { cargarResumen(fechaRes) }, [cargarResumen, fechaRes])

  // Auto-refresh 90s solo si pestaña resumen activa
  useEffect(() => {
    const t = setInterval(() => {
      if (tab === "resumen") cargarResumen(fechaRes)
    }, 90_000)
    return () => clearInterval(t)
  }, [tab, fechaRes, cargarResumen])

  async function cargarAtrasos() {
    setLoadAtr(true); setErrAtr(""); setRepAtr(null)
    try {
      const r = await api.get(`/asistencia/reporte_rango?fecha_ini=${fiAtr}&fecha_fin=${ffAtr}`)
      setRepAtr(r)
    } catch (e: unknown) {
      setErrAtr(e instanceof Error ? e.message : "Error")
    } finally { setLoadAtr(false) }
  }

  async function cargarReporte() {
    setLoadRep(true); setRepData(null)
    try {
      const r = await api.get(`/asistencia/reporte_rango?fecha_ini=${fiRep}&fecha_fin=${ffRep}`)
      setRepData(r)
    } finally { setLoadRep(false) }
  }

  function descargarCSV() {
    if (!repData) return
    const cols = ["Empleado","Fecha","Ingreso Manana","Ingreso Tarde","Salida",
      "Atraso Manana (min)","Atraso Manana","Atraso Tarde (min)","Atraso Tarde","Marcaciones","Tiene Atraso"]
    const rows: string[][] = [cols]
    for (const emp of repData.empleados) {
      for (const d of emp.detalle) {
        rows.push([emp.nombre, d.fecha, d.ingreso_manana||"", d.ingreso_tarde||"", d.salida||"",
          String(d.atraso_manana_min), d.atraso_manana_str,
          String(d.atraso_tarde_min),  d.atraso_tarde_str,
          String(d.total_marcaciones), d.tiene_atraso ? "SI" : "NO"])
      }
    }
    const csv  = "﻿" + rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(",")).join("\r\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement("a"), {
      href: url, download: `asistencia_oriental_${fiRep}_${ffRep}.csv`
    })
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const filasAtrasos = (repAtr?.empleados ?? []).flatMap(e =>
    (e.detalle ?? [])
      .filter(d => empAtr ? String(d.persona_id) === empAtr : true)
      .filter(d => d.tiene_atraso || d.sin_ingreso_tarde)
  )

  const inputStyle = {
    padding: "6px 10px", border: "1.5px solid #d1d5db",
    borderRadius: 8, fontSize: ".88rem", outline: "none",
  }
  const btnPrimary = {
    padding: "6px 16px", background: "#0F2B5B", color: "#fff",
    border: "none", borderRadius: 8, fontSize: ".85rem",
    fontWeight: 600 as const, cursor: "pointer" as const,
  }
  const cellStyle = { padding: "9px 12px", borderBottom: "1px solid #f1f5f9" }
  const thStyle   = { padding: "9px 12px", textAlign: "left" as const, fontSize: ".74rem", fontWeight: 600 as const, whiteSpace: "nowrap" as const }

  return (
    <div style={{ padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <Clock size={26} color="#3b82f6" />
        <div>
          <h1 style={{ fontSize:"1.3rem", fontWeight:700, margin:0 }}>Control de Asistencia</h1>
          <p style={{ color:"#6b7280", fontSize:"0.8rem", margin:0 }}>Oriental SRL · 08:00 (tol. 10 min) / 14:00 (tol. 10 min)</p>
        </div>
        {lastSync && <span style={{ marginLeft:"auto", fontSize:".75rem", color:"#9ca3af" }}>Sync {lastSync}</span>}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:"2px solid #e5e7eb", marginBottom:"1.25rem", display:"flex" }}>
        {(["resumen","atrasos","reporte"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"8px 20px", background:"none", border:"none",
            borderBottom: tab===t ? "2px solid #3b82f6" : "2px solid transparent",
            color: tab===t ? "#3b82f6" : "#6b7280",
            fontWeight:600, fontSize:".88rem", cursor:"pointer", marginBottom:"-2px",
          }}>
            {t === "resumen" ? "Resumen" : t === "atrasos" ? "Atrasos" : "Reporte"}
          </button>
        ))}
      </div>

      {/* ── Resumen ─────────────────────────────────── */}
      {tab === "resumen" && (
        <div>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", alignItems:"center", flexWrap:"wrap" }}>
            <input type="date" value={fechaRes} onChange={e => setFechaRes(e.target.value)} style={inputStyle} />
            <button onClick={() => cargarResumen(fechaRes)} style={{
              ...btnPrimary, display:"flex", alignItems:"center", gap:"0.4rem",
            }}>
              <RefreshCw size={13} style={{ animation: loadRes ? "spin 1s linear infinite" : "none" }} />
              Actualizar
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"0.75rem", marginBottom:"1.25rem" }}>
            {[
              { label:"Con marca",    value: resumen?.total_empleados_con_marca ?? "-", color:"#3b82f6", icon:<Users size={18}/> },
              { label:"Presentes",    value: (resumen?.personas??[]).filter(p=>p.estado!=="Salida"&&p.total>0).length, color:"#10b981", icon:<CheckCircle size={18}/> },
              { label:"Retirados",    value: (resumen?.personas??[]).filter(p=>p.estado==="Salida").length, color:"#6b7280", icon:<LogOutIcon size={18}/> },
              { label:"Marcaciones",  value: resumen?.total_registros ?? "-", color:"#8b5cf6", icon:<LogIn size={18}/> },
            ].map(s => (
              <div key={s.label} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10,
                padding:"12px 14px", display:"flex", alignItems:"center", gap:"0.6rem",
                boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ color:s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:"1.4rem", fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:".7rem", color:"#6b7280" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {errRes && <div style={{ color:"#dc2626", padding:"0.75rem", background:"#fee2e2", borderRadius:8, marginBottom:"1rem" }}>{errRes}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:"0.75rem" }}>
            {(resumen?.personas ?? []).map(p => {
              const color = ESTADO_COLOR[p.estado] ?? "#ef4444"
              const label = ESTADO_LABEL[p.estado] ?? "Sin marca"
              const ini   = p.nombre.trim().split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()
              return (
                <div key={p.persona_id} style={{ background:"#fff", borderRadius:10, borderLeft:`4px solid ${color}`,
                  padding:"12px 14px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.5rem" }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:color+"22",
                      color, display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:700, fontSize:".82rem" }}>{ini}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:".86rem", overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.nombre}</div>
                      <span style={{ fontSize:".66rem", fontWeight:600, padding:"1px 6px",
                        borderRadius:999, background:color+"20", color }}>{label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:".76rem", color:"#6b7280", lineHeight:1.8 }}>
                    <div>Entrada: <strong style={{ color:"#111" }}>{p.primera ?? "--:--"}</strong></div>
                    <div>Ultima:  <strong style={{ color:"#111" }}>{p.ultima  ?? "--:--"}</strong></div>
                    <div>Marcaciones: <strong style={{ color:"#111" }}>{p.total}</strong></div>
                  </div>
                </div>
              )
            })}
            {(!resumen || resumen.personas.length === 0) && !loadRes && (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"3rem", color:"#9ca3af" }}>
                Sin registros para esta fecha.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Atrasos ─────────────────────────────────── */}
      {tab === "atrasos" && (
        <div>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", alignItems:"center", flexWrap:"wrap" }}>
            <label style={{ fontSize:".82rem", color:"#6b7280" }}>Desde:</label>
            <input type="date" value={fiAtr} onChange={e=>setFiAtr(e.target.value)} style={inputStyle} />
            <label style={{ fontSize:".82rem", color:"#6b7280" }}>Hasta:</label>
            <input type="date" value={ffAtr} onChange={e=>setFfAtr(e.target.value)} style={inputStyle} />
            <select value={empAtr} onChange={e=>setEmpAtr(e.target.value)}
              style={{ ...inputStyle, minWidth:150 }}>
              <option value="">Todos los empleados</option>
              {(resumen?.personas ?? []).map(p =>
                <option key={p.persona_id} value={p.persona_id}>{p.nombre}</option>
              )}
            </select>
            <button onClick={cargarAtrasos} style={btnPrimary}>Buscar</button>
          </div>

          {loadAtr && <div style={{ textAlign:"center", padding:"2rem", color:"#9ca3af" }}>Cargando...</div>}
          {errAtr  && <div style={{ color:"#dc2626", padding:"0.75rem", background:"#fee2e2", borderRadius:8 }}>{errAtr}</div>}

          {repAtr && (
            <div style={{ fontSize:".78rem", color:"#6b7280", marginBottom:"0.75rem" }}>
              {fiAtr} a {ffAtr} · {filasAtrasos.filter(d=>d.tiene_atraso).length} registros con atraso
            </div>
          )}

          {repAtr && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff",
                borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                <thead>
                  <tr style={{ background:"#0F2B5B", color:"#fff" }}>
                    {["Empleado","Fecha","Ingreso Mañana","Atraso Mañana","Ingreso Tarde","Atraso Tarde","Marcaciones"].map(h =>
                      <th key={h} style={thStyle}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filasAtrasos.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign:"center", padding:"2rem", color:"#9ca3af" }}>Sin atrasos en este rango</td></tr>
                  ) : filasAtrasos.map((d, i) => (
                    <tr key={i}>
                      <td style={cellStyle}><strong>{d.nombre}</strong></td>
                      <td style={cellStyle}>{d.fecha}</td>
                      <td style={cellStyle}>{d.ingreso_manana ?? "-"}</td>
                      <td style={cellStyle}>
                        {d.atraso_manana_min > 0
                          ? <span style={{ background:"#fee2e2",color:"#dc2626",padding:"2px 7px",borderRadius:999,fontSize:".7rem",fontWeight:700 }}>{d.atraso_manana_str}</span>
                          : <span style={{ background:"#dcfce7",color:"#16a34a",padding:"2px 7px",borderRadius:999,fontSize:".7rem",fontWeight:700 }}>OK</span>}
                      </td>
                      <td style={cellStyle}>{d.ingreso_tarde ?? "-"}</td>
                      <td style={cellStyle}>
                        {!d.ingreso_tarde
                          ? <span style={{ background:"#f3f4f6",color:"#6b7280",padding:"2px 7px",borderRadius:999,fontSize:".7rem" }}>Sin marca</span>
                          : d.atraso_tarde_min > 0
                            ? <span style={{ background:"#fee2e2",color:"#dc2626",padding:"2px 7px",borderRadius:999,fontSize:".7rem",fontWeight:700 }}>{d.atraso_tarde_str}</span>
                            : <span style={{ background:"#dcfce7",color:"#16a34a",padding:"2px 7px",borderRadius:999,fontSize:".7rem",fontWeight:700 }}>OK</span>}
                      </td>
                      <td style={{ ...cellStyle, textAlign:"center" }}>{d.total_marcaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!repAtr && !loadAtr && (
            <div style={{ textAlign:"center", padding:"3rem", color:"#9ca3af", fontSize:".9rem" }}>
              Seleccione un rango y presione Buscar.
            </div>
          )}
        </div>
      )}

      {/* ── Reporte ─────────────────────────────────── */}
      {tab === "reporte" && (
        <div>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", alignItems:"center", flexWrap:"wrap" }}>
            <label style={{ fontSize:".82rem", color:"#6b7280" }}>Desde:</label>
            <input type="date" value={fiRep} onChange={e=>setFiRep(e.target.value)} style={inputStyle} />
            <label style={{ fontSize:".82rem", color:"#6b7280" }}>Hasta:</label>
            <input type="date" value={ffRep} onChange={e=>setFfRep(e.target.value)} style={inputStyle} />
            <button onClick={cargarReporte} style={btnPrimary}>Generar</button>
            {repData && (
              <button onClick={descargarCSV} style={{
                ...btnPrimary, background:"#10b981",
                display:"flex", alignItems:"center", gap:"0.4rem",
              }}>
                <Download size={13}/> Descargar CSV
              </button>
            )}
          </div>

          {loadRep && <div style={{ textAlign:"center", padding:"2rem", color:"#9ca3af" }}>Generando reporte...</div>}

          {repData && (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff",
                borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                <thead>
                  <tr style={{ background:"#0F2B5B", color:"#fff" }}>
                    {["Empleado","Dias Presentes","Dias con Atraso","Atrasos Mañana","Atrasos Tarde","Total Tiempo Atraso"].map(h =>
                      <th key={h} style={thStyle}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {repData.empleados.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign:"center", padding:"2rem", color:"#9ca3af" }}>Sin datos</td></tr>
                  ) : repData.empleados.map(e => (
                    <tr key={e.persona_id} style={{ borderBottom:"1px solid #f1f5f9", background: e.dias_con_atraso > 0 ? "#fff9f9" : undefined }}>
                      <td style={{ ...cellStyle, fontWeight:600 }}>{e.nombre}</td>
                      <td style={{ ...cellStyle, textAlign:"center" }}>{e.dias_presentes}</td>
                      <td style={{ ...cellStyle, textAlign:"center" }}>
                        {e.dias_con_atraso > 0
                          ? <span style={{ background:"#fee2e2",color:"#dc2626",padding:"2px 8px",borderRadius:999,fontSize:".72rem",fontWeight:700 }}>{e.dias_con_atraso}</span>
                          : <span style={{ background:"#dcfce7",color:"#16a34a",padding:"2px 8px",borderRadius:999,fontSize:".72rem",fontWeight:700 }}>0</span>}
                      </td>
                      <td style={{ ...cellStyle, textAlign:"center" }}>{e.atrasos_manana}</td>
                      <td style={{ ...cellStyle, textAlign:"center" }}>{e.atrasos_tarde}</td>
                      <td style={{ ...cellStyle, fontWeight:500 }}>{e.total_min_atraso_str}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!repData && !loadRep && (
            <div style={{ textAlign:"center", padding:"3rem", color:"#9ca3af", fontSize:".9rem" }}>
              Seleccione un rango y presione Generar.
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
