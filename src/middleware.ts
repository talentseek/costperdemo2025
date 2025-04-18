import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const pathname = requestUrl.pathname

    // Create response to modify headers later
    const response = NextResponse.next()

    // Initialize Supabase client with request cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Set cookie on response instead of request
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            // Remove cookie from response instead of request
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Check if the route is public
    if (publicRoutes.includes(pathname)) {
      console.log('Public route accessed:', pathname)
      return response
    }

    console.log('Checking auth for path:', pathname)

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }

    // If no session, redirect to login
    if (!session) {
      console.log('No session found, redirecting to login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    console.log('Session found for user:', session.user.email)

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

    // Check if trying to access admin routes
    const isAdminRoute = pathname.startsWith('/admin')
    const isAdmin = userData?.role === 'admin'

    console.log('Route check:', {
      email: session.user.email,
      role: userData?.role,
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

      // If user has no workspace, redirect to workspace creation
      if (!userData.workspace_id && pathname !== '/workspace') {
        console.log('User has no workspace, redirecting to workspace creation')
        return NextResponse.redirect(new URL('/workspace', request.url))
      }
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Only redirect to login if not on a public route
    if (!publicRoutes.includes(new URL(request.url).pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 