import { NextRequest, NextResponse } from "next/server"

const PUBLIC = ["/", "/login", "/registro"]
const PROTECTED = ["/app", "/admin"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some(p => pathname === p)) return NextResponse.next()

  const needsAuth = PROTECTED.some(p => pathname === p || pathname.startsWith(p + "/"))
  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get("tb_token")?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/admin"],
}
