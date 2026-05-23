import { type NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { SESSION_COOKIE } from '@/lib/session'

const PROTECTED_PREFIXES = ['/dashboard', '/workspaces', '/projects', '/brains']
const AUTH_PREFIXES = ['/login', '/signup']

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null

  if (startsWithAny(pathname, PROTECTED_PREFIXES)) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (startsWithAny(pathname, AUTH_PREFIXES) && session) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)']
}
