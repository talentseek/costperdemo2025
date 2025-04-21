import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

/**
 * Creates a basic Supabase client for server components
 * This version doesn't use cookies but creates a minimal client
 * @returns Supabase client
 */
export function createServerComponentClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined, // No cookies access in this version
        set: () => {}, // Server components can't set cookies
        remove: () => {} // Server components can't remove cookies
      }
    }
  )
}

/**
 * Creates a Supabase client for server components that uses cookie handler functions
 * @param cookieHandlers - Object with get/set/remove functions for cookie management 
 * @returns Supabase client
 */
export function createServerComponentClientWithCookies(cookieHandlers: {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options: any) => void;
  remove: (name: string, options: any) => void;
}) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieHandlers
    }
  )
} 