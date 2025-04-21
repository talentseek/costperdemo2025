import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = ['/auth', '/verify', '/forgot-password', '/reset-password']

// API routes should be excluded from middleware redirects
const isApiRoute = (pathname: string) => pathname.startsWith('/api/')

// Check if path is a static asset
const isStaticAsset = (pathname: string) => 
  pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|webp)$/) !== null

// Check if path is an admin route
const isAdminRoute = (pathname: string) => 
  pathname === '/admin' || pathname.startsWith('/admin/')

/**
 * Simplified middleware function to protect routes using Supabase Auth
 */
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = new URL(request.url).pathname
  const searchParams = new URL(request.url).searchParams
  
  console.log(`Middleware processing route: ${pathname}`)
  
  // Skip middleware for static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }
  
  // Skip middleware for API routes
  if (isApiRoute(pathname)) {
    console.log('Skipping middleware for API route:', pathname)
    return NextResponse.next()
  }
  
  // Allow auth and verification routes to pass through
  if (publicRoutes.includes(pathname) || pathname.startsWith('/verify')) {
    console.log('Allowing public route:', pathname)
    return NextResponse.next()
  }
  
  // For the root path, we'll handle authentication checks
  if (pathname === '/') {
    // Create response to modify
    const response = NextResponse.next()
    
    // Create supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set: () => {}, // Don't set cookies to avoid redirect issues
          remove: () => {} // Don't remove cookies to avoid redirect issues
        }
      }
    )
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      
      // If not authenticated, redirect to login
      if (!session) {
        console.log('No session found on root path, redirecting to login')
        return NextResponse.redirect(new URL('/auth?tab=login', request.url))
      }
      
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      // Redirect based on role
      if (userData?.role === 'admin') {
        console.log('Admin user on root path, redirecting to admin')
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        console.log('Regular user on root path, redirecting to dashboard')
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      console.error('Error in root path middleware:', error)
      // On error, redirect to login
      return NextResponse.redirect(new URL('/auth?tab=login', request.url))
    }
  }
  
  // Check if admin users are trying to access regular routes
  // or regular users trying to access admin routes
  try {
    // Create supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set: () => {}, // Don't set cookies to avoid redirect issues
          remove: () => {} // Don't remove cookies to avoid redirect issues
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    // If not authenticated, redirect to login
    if (!session) {
      console.log('No session found, redirecting to login:', pathname)
      const redirectUrl = new URL('/auth?tab=login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Get user data to check role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    const isAdmin = userData?.role === 'admin'
    
    // If admin is trying to access regular dashboard, redirect to admin dashboard
    if (isAdmin && pathname === '/dashboard') {
      console.log('Admin user redirected to admin dashboard')
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // If regular user is trying to access admin routes, redirect to dashboard
    if (!isAdmin && isAdminRoute(pathname)) {
      console.log('Non-admin user redirected from admin route to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // User is authenticated and accessing appropriate routes, allow access
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, allow the request to proceed
    // This prevents redirect loops caused by middleware errors
    return NextResponse.next()
  }
}

// Specify which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 