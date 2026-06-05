import { NextRequest, NextResponse } from "next/server"

const PUBLIC = ["/", "/login", "/registro"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rutas públicas pasan directo
  if (PUBLIC.some(p => pathname === p) || !pathname.startsWith("/app")) {
    return NextResponse.next()
  }

  // Verificar token en cookie (lo guardamos también en cookie desde el cliente)
  const token = req.cookies.get("tb_token")?.value

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*"],
}
