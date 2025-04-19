import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const pathname = requestUrl.pathname
    
    console.log('🔑 Middleware processing path:', pathname)

    // Check if the route is public
    if (publicRoutes.includes(pathname)) {
      console.log('🔑 Public route accessed:', pathname)
      return NextResponse.next()
    }

    // Check specifically for API routes and exclude them
    if (pathname.startsWith('/api/')) {
      console.log('🔑 API route accessed, skipping auth check:', pathname)
      return NextResponse.next()
    }

    // Check specifically for workspace route which needs special attention
    if (pathname === '/workspace') {
      console.log('🔑 Workspace route accessed, checking authentication')
      // For workspace route, continue with auth check but don't redirect away if user has auth
    }

    // Create response to modify headers later
    const response = NextResponse.next()

    // Check for cookie integrity
    const authCookie = request.cookies.get('sb-pzmhkkszivskjmpjgfrm-auth-token')
    console.log('🔑 Auth cookie present:', !!authCookie)

    if (!authCookie) {
      console.log('🔑 No auth cookie found, redirecting to login')
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

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

    console.log('🔑 Checking auth for path:', pathname)

    try {
      // Get session directly from the auth cookie
      const { data: { user }, error: authError } = await supabase.auth.getUser(authCookie.value)
      
      if (authError || !user) {
        console.error('🔑 User auth error:', authError)
        throw authError || new Error('No user found')
      }

      console.log('🔑 Session found for user:', user.email)

      try {
        // Get user data including role and workspace_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, workspace_id')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('🔑 User data error:', userError)
          
          // If user record doesn't exist, redirect to workspace creation
          // This should be properly handled by the AuthForm, but here's a safety net
          if (userError.code === 'PGRST116') { // No rows returned
            console.log('🔑 User record not found in middleware, redirecting to workspace creation')
            return NextResponse.redirect(new URL('/workspace', request.url))
          }
          
          throw userError
        }

        // Check if trying to access admin routes
        const isAdminRoute = pathname.startsWith('/admin')
        const isAdmin = userData?.role === 'admin'

        console.log('🔑 Route check:', {
          email: user.email,
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
            console.log('🔑 Non-admin user trying to access admin route')
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }

          // Redirect admin users to admin dashboard
          if (isAdmin && pathname === '/dashboard') {
            console.log('🔑 Admin user redirected to admin dashboard')
            return NextResponse.redirect(new URL('/admin', request.url))
          }

          // If user has no workspace, redirect to workspace creation
          // But only if they're not already on the workspace route
          if (!userData.workspace_id && pathname !== '/workspace') {
            console.log('🔑 User has no workspace, redirecting to workspace creation')
            return NextResponse.redirect(new URL('/workspace', request.url))
          }
          
          // If user has a workspace and is trying to access workspace creation page,
          // redirect them to dashboard instead
          if (userData.workspace_id && pathname === '/workspace' && !isAdmin) {
            console.log('🔑 User already has workspace, redirecting to dashboard')
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }

        // For all other authenticated routes, allow access
        return response
      } catch (userDataError) {
        console.error('🔑 Error getting user data:', userDataError)
        // If we can't get user data but have a valid session, still allow access
        // The application can handle missing user data in its own components
        return response
      }
    } catch (sessionError) {
      console.error('🔑 Session error:', sessionError)
      // Only redirect to login if not on a public route
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  } catch (error) {
    console.error('🔑 Middleware error:', error)
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
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}