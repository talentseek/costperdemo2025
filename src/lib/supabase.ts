/**
 * Supabase client initialization and configuration
 * This file sets up and exports the Supabase client for use throughout the application
 */

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Extract the project reference from the URL to use in the cookie name
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] || ''

/**
 * Initialize Supabase client with environment variables and type safety
 * Uses Database type from generated types for type-safe queries
 * Uses SSR-compatible client for proper cookie handling
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // Ensure cookies are properly stored
      persistSession: true,
      // Define how cookies are stored with correct naming convention
      storageKey: `sb-${projectRef}-auth-token`,
      // Ensure we're handling cookie/token expiration properly
      autoRefreshToken: true,
      // Detect if cookies are enabled
      detectSessionInUrl: true
    },
    // Global error handler
    global: {
      fetch: (...args) => {
        return fetch(...args)
      }
    }
  }
)

// Store the cookie name for reference elsewhere in the app
export const COOKIE_NAME = `sb-${projectRef}-auth-token`

// Export types for convenience
export type { Database } from '@/types/supabase' 