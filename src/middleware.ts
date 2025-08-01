import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Use the environment variables directly
  const supabaseUrl = 'https://enpplseddbfstmefufee.supabase.co'
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVucHBsc2VkZGJmc3RtZWZ1ZmVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTgyMDUsImV4cCI6MjA2NTYzNDIwNX0.TxFqh1lGx91iKIOIZC-qnjT6n0s1jnBGH9R8SXMwCAE'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Check if the request is for a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/register') ||
                           request.nextUrl.pathname.startsWith('/reports') ||
                           request.nextUrl.pathname.startsWith('/logs') ||
                           request.nextUrl.pathname.startsWith('/account') ||
                           request.nextUrl.pathname.startsWith('/support')

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If accessing login page while authenticated, redirect to dashboard
  if ((request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 