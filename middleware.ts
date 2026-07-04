import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {

  const pathname = request.nextUrl.pathname

  // ==============================
  // CORS HANDLING FOR API ROUTES
  // ==============================
  if (pathname.startsWith('/api')) {

    const origin = request.headers.get('origin') || ''

    const allowedOrigins = [
      'https://manglamvastu.in',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:3000'
    ]

    const isAllowedOrigin = allowedOrigins.includes(origin)

    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin
        ? origin
        : 'https://manglamvastu.in',

      'Access-Control-Allow-Methods':
        'GET, POST, PATCH, DELETE, OPTIONS',

      'Access-Control-Allow-Headers':
        'Content-Type, Authorization',

      'Access-Control-Allow-Credentials': 'true',
    }

    // Handle preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    const response = NextResponse.next()

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // ==============================
  // NEXT-AUTH JWT MIDDLEWARE
  // ==============================
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // ==============================
  // PROTECTED ROUTES
  // ==============================

  const isProtectedRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/portal')

  if (isProtectedRoute && !token) {

    const url = request.nextUrl.clone()

    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)

    return NextResponse.redirect(url)
  }

  // ==============================
  // ADMIN ROUTE
  // ==============================

  if (pathname.startsWith('/admin')) {
    if (!token || token.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
    }
  }

  // ==============================
  // RETURN RESPONSE
  // ==============================

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next static files
     * - images
     * - favicon
     * - file assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
}