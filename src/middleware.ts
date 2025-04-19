import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

// Define cookie options type
interface _CookieOptions {
  domain?: string
  path?: string
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
}

// Public routes that don't require authentication
const publicRoutes = ['/auth', '/verify', '/forgot-password', '/reset-password']

// Helper function to check if a path is an admin route
const checkIsAdminRoute = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/')

// API routes should be excluded from middleware redirects
const isApiRoute = (pathname: string) => pathname.startsWith('/api/')

/**
 * Middleware function to protect routes using Supabase Auth
 * Handles role-based routing and authentication checks
 */
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = new URL(request.url).pathname
  const url = new URL(request.url)
  const searchParams = url.searchParams
  
  console.log(`Middleware processing route: ${pathname}`)
  
  // Handle root path specially - redirect to dashboard or login without error
  if (pathname === '/') {
    console.log('Processing root path')
    // Create response to check for session
    const response = await updateSession(request)
    
    // Create supabase client to check auth status
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options) {
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
      // Check if user is logged in, but don't error on failure
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Fetch user data but don't error if it fails
        const { data: userData } = await supabase
          .from('users')
          .select('role, workspace_id')
          .eq('id', user.id)
          .single()
        
        // Redirect based on user role and workspace status
        if (userData?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (userData?.workspace_id) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/workspace', request.url))
        }
      } else {
        // If not logged in, redirect to auth page without error params
        return NextResponse.redirect(new URL('/auth?tab=login', request.url))
      }
    } catch (error) {
      // On any error, just redirect to auth page without error params
      console.log('Error checking session for root path:', error)
      return NextResponse.redirect(new URL('/auth?tab=login', request.url))
    }
  }
  
  // Allow verification routes with code parameter to pass through
  if (pathname === '/verify' && searchParams.has('code')) {
    console.log('Allowing verification with code parameter')
    return NextResponse.next()
  }
  
  // Allow API routes for verification to pass through
  if (pathname === '/api/auth/verify' && searchParams.has('code')) {
    console.log('Allowing API verification with code parameter')
    return NextResponse.next()
  }
  
  // Allow API routes for callback, workspace creation, and debug endpoints to pass through
  if (pathname === '/api/auth/callback' || 
      pathname.startsWith('/api/workspace/') || 
      pathname === '/api/admin/debug' ||
      pathname === '/api/admin/db-check' ||
      pathname === '/api/admin/db-users' ||
      pathname === '/api/admin/create-workspaces' ||
      pathname === '/api/admin/rls-bypass' ||
      pathname === '/api/admin/sql-query') {
    console.log('Allowing API route to pass through:', pathname)
    return NextResponse.next()
  }
  
  // Skip middleware for API routes to prevent redirect loops
  if (isApiRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Update the session first to handle auth token refresh
  const response = await updateSession(request)
  
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAdminRoute = checkIsAdminRoute(pathname)

  // Create a Supabase client specifically for middleware checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
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
    // Check if we have a user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('User error:', userError)
      throw userError
    }

    // Handle unauthenticated users
    if (!user) {
      console.log('No user found')
      if (!isPublicRoute) {
        const redirectUrl = new URL('/auth?tab=login', request.url)
        redirectUrl.searchParams.set('redirect', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      return response
    }

    // Get user data including role and workspace_id
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('User data error:', userDataError)
      throw userDataError
    }

    const isAdmin = userData?.role === 'admin' || user?.user_metadata?.role === 'admin'

    console.log('User data:', {
      email: user.email,
      dbRole: userData?.role,
      authRole: user?.user_metadata?.role,
      isAdmin,
      workspace_id: userData?.workspace_id,
      pathname,
      isAdminRoute
    })

    // Handle role-based routing
    if (userData) {
      // First handle admin users - they have priority routing
      if (isAdmin) {
        // Non-admin routes should redirect to admin for admin users
        if (pathname === '/dashboard' || pathname === '/workspace') {
          console.log('Admin user redirected to admin dashboard')
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        
        // For public routes (login, signup, etc.), redirect to admin dashboard
        if (isPublicRoute) {
          console.log('Admin on public route redirected to admin dashboard')
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        
        // For admin routes, allow access
        if (isAdminRoute) {
          console.log('Admin accessing admin route')
          return response
        }
        
        // For any other paths, redirect to admin dashboard
        return NextResponse.redirect(new URL('/admin', request.url))
      } 
      // Then handle non-admin users
      else {
        // Block access to admin routes
        if (isAdminRoute) {
          console.log('Non-admin user trying to access admin route')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        
        // For public routes, redirect to dashboard if they have a workspace
        if (isPublicRoute) {
          console.log('Authenticated user on public route')
          return NextResponse.redirect(
            new URL(userData.workspace_id ? '/dashboard' : '/workspace', request.url)
          )
        }
        
        // Handle workspace creation
        if (pathname === '/workspace' && userData.workspace_id) {
          console.log('User with workspace trying to access workspace creation')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        
        // Redirect users without workspace to workspace creation
        if (!userData.workspace_id && pathname !== '/workspace') {
          console.log('User without workspace redirected to workspace creation')
          return NextResponse.redirect(new URL('/workspace', request.url))
        }
      }
    }

    return response
  } catch (error) {
    // Log error but don't expose it to the client
    console.error('Auth middleware error:', error)

    // Check if this is a normal auth session missing error (like after logout)
    // which shouldn't show an error to the user
    const isNormalAuthSessionMissing = 
      error instanceof Error && 
      error.name === 'AuthSessionMissingError' && 
      error.message.includes('Auth session missing');

    // On error, redirect to login for safety
    if (!publicRoutes.includes(new URL(request.url).pathname)) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('tab', 'login')
      
      // Only add the error parameter for unexpected auth errors
      if (!isNormalAuthSessionMissing) {
        redirectUrl.searchParams.set('error', 'auth_error')
      }
      
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
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
}

export function isAdmin(response: NextResponse): boolean {
  try {
    const userData = response.cookies.get('user-data')?.value
    if (!userData) return false
    
    const user = JSON.parse(userData) as { role?: string }
    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
} 