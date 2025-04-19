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

  // Refresh the session
  await supabase.auth.getUser()

  return response
} 