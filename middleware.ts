import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseCookieName } from './lib/supabase-shared'

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
  // SUPABASE AUTH MIDDLEWARE
  // ==============================

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
      cookieOptions: {
        name: getSupabaseCookieName()
      }
    }
  )

  // IMPORTANT:
  // Do not add logic between createServerClient and getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ==============================
  // PROTECTED ROUTES
  // ==============================

  const isProtectedRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/portal')

  if (isProtectedRoute && !user) {

    const url = request.nextUrl.clone()

    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)

    return NextResponse.redirect(url)
  }

  // ==============================
  // ADMIN ROUTE
  // ==============================

  if (pathname.startsWith('/admin') && !user) {

    const url = request.nextUrl.clone()

    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)

    return NextResponse.redirect(url)
  }

  // ==============================
  // RETURN RESPONSE
  // ==============================

  return supabaseResponse
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