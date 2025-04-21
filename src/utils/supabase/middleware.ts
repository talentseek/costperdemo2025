import { createServerClient } from '@supabase/ssr'
import { NextResponse, NextRequest } from 'next/server'

export function createMiddlewareSupabaseClient(request: NextRequest) {
  // Create a response object to modify
  const response = NextResponse.next()
  
  // Initialize the Supabase client using request/response
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
            ...options 
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({ 
            name, 
            value: '', 
            ...options,
            maxAge: 0 
          })
        },
      },
    }
  )

  return { supabase, response }
}

export async function updateSession(request: NextRequest) {
  // Create an unmodified response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client using the request cookies
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
            maxAge: 0
          })
        },
      },
    }
  )

  try {
    console.log('Refreshing auth session in middleware');
    
    // Get all cookies from the request to debug
    const allCookies = request.cookies.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name).join(', '));
    
    // First get the session which also refreshes it if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error in middleware updateSession:', sessionError);
    }
    
    if (session) {
      console.log('Session found for user:', session.user.email);
      
      // Explicitly get user to verify token and trigger refresh if needed
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('User error in middleware updateSession:', userError);
      } else if (user) {
        console.log('User verified in middleware:', user.email);
      }
    } else {
      console.log('No session found in middleware updateSession');
    }
  } catch (error) {
    console.error('Error refreshing session in middleware:', error)
    // We just log the error but still return the response
    // to allow the middleware to continue
  }

  return response
} 