import { createServerClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for route handlers
 * Uses a dynamic approach to handle cookies that works with both App Router and Pages Router
 * @returns Supabase client configured for route handlers
 */
export function createRouteHandlerSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          try {
            // Only try to access cookies() in a server context
            if (typeof window === 'undefined') {
              // Use a try-catch around dynamic import to avoid build errors
              try {
                const { cookies } = require('next/headers')
                const cookieStore = await cookies()
                return cookieStore.get(name)?.value
              } catch (error) {
                // Silently handle when next/headers is not available (Pages Router)
                console.warn('Unable to access cookies in route handler:', error)
                return undefined
              }
            }
          } catch (error) {
            // Fallback for any other errors
            console.error('Error getting cookie in route handler:', error)
            return undefined
          }
          return undefined
        },
        async set(name: string, value: string, options) {
          try {
            if (typeof window === 'undefined') {
              try {
                const { cookies } = require('next/headers')
                const cookieStore = await cookies()
                cookieStore.set(name, value, options)
              } catch (error) {
                console.warn('Unable to set cookie:', error)
              }
            }
          } catch (error) {
            console.error('Error setting cookie in route handler:', error)
          }
        },
        async remove(name: string, options) {
          try {
            if (typeof window === 'undefined') {
              try {
                const { cookies } = require('next/headers')
                const cookieStore = await cookies()
                cookieStore.set(name, '', { ...options, maxAge: 0 })
              } catch (error) {
                console.warn('Unable to remove cookie:', error)
              }
            }
          } catch (error) {
            console.error('Error removing cookie in route handler:', error)
          }
        },
      },
    }
  )
} 