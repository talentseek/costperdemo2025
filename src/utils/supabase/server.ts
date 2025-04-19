import { createServerClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for server components
 * Uses a dynamic approach that works with both App Router and Pages Router
 * @returns Supabase client
 */
export function createServerComponentClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            // Only try to access cookies() in a server context
            if (typeof window === 'undefined') {
              try {
                const { cookies } = require('next/headers')
                return cookies().get(name)?.value
              } catch {
                // Silently handle when next/headers is not available (Pages Router)
                return undefined
              }
            }
          } catch {
            // Fallback for any other errors
            return undefined
          }
          return undefined
        },
        set() {
          // Can't set cookies in server components
          console.warn('Cannot set cookies in a Server Component')
        },
        remove() {
          // Can't remove cookies in server components
          console.warn('Cannot remove cookies in a Server Component')
        }
      }
    }
  )
} 