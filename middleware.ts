import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']

// Admin-only routes
const adminRoutes = ['/admin']

/**
 * Middleware function to protect routes using Supabase Auth
 * Handles role-based routing and authentication checks
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }

    const pathname = new URL(request.url).pathname
    const isPublicRoute = publicRoutes.includes(pathname)
    const isAdminRoute = adminRoutes.includes(pathname)

    // Handle unauthenticated users
    if (!session) {
      console.log('No session found')
      if (!isPublicRoute) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('redirect', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      return response
    }

    // Get user data including role and workspace_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, workspace_id')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('User data error:', userError)
      throw userError
    }

    // Get user metadata from auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth user error:', authError)
      throw authError
    }

    const isAdmin = userData?.role === 'admin' || authUser?.user_metadata?.role === 'admin'

    console.log('User data:', {
      email: session.user.email,
      dbRole: userData?.role,
      authRole: authUser?.user_metadata?.role,
      isAdmin,
      workspace_id: userData?.workspace_id,
      pathname,
      isAdminRoute
    })

    // Handle role-based routing
    if (userData) {
      // Redirect non-admin users trying to access admin routes
      if (isAdminRoute && !isAdmin) {
        console.log('Non-admin user trying to access admin route')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect admin users to admin dashboard
      if (isAdmin && pathname === '/dashboard') {
        console.log('Admin user redirected to admin dashboard')
        return NextResponse.redirect(new URL('/admin', request.url))
      }

      // Handle public routes for authenticated users
      if (isPublicRoute) {
        return NextResponse.redirect(
          new URL(userData.workspace_id ? '/dashboard' : '/workspace', request.url)
        )
      }

      // Handle workspace creation
      if (pathname === '/workspace' && userData.workspace_id) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // Redirect users without workspace to workspace creation
      if (!userData.workspace_id && pathname !== '/workspace') {
        return NextResponse.redirect(new URL('/workspace', request.url))
      }
    }

    return response
  } catch (error) {
    // Log error but don't expose it to the client
    console.error('Auth middleware error:', error)

    // On error, redirect to login for safety
    if (!publicRoutes.includes(new URL(request.url).pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }
}

/**
 * Configure which routes to run middleware on
 * Matches all routes except static files and api routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 