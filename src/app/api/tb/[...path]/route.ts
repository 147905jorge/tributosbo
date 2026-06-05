import { NextRequest, NextResponse } from "next/server"

const ORACLE = "https://193.122.138.87.nip.io/tb"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path   = params.path.join("/")
  const search = req.nextUrl.search
  const url    = `${ORACLE}/${path}${search}`

  const headers: Record<string, string> = {
    "Content-Type": req.headers.get("content-type") || "application/json",
  }
  const auth = req.headers.get("authorization")
  if (auth) headers["Authorization"] = auth

  const init: RequestInit = { method: req.method, headers }

  if (!["GET", "HEAD", "DELETE"].includes(req.method)) {
    const ct = req.headers.get("content-type") || ""
    if (ct.includes("application/x-www-form-urlencoded")) {
      headers["Content-Type"] = "application/x-www-form-urlencoded"
      init.body = await req.text()
    } else {
      const text = await req.text()
      if (text) init.body = text
    }
  }

  try {
    const res  = await fetch(url, { ...init, cache: "no-store" })
    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") || "application/json" },
    })
  } catch (e) {
    return NextResponse.json({ detail: "Error conectando con el servidor" }, { status: 502 })
  }
}
