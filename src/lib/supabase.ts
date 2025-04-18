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

/**
 * Initialize Supabase client with environment variables and type safety
 * Uses Database type from generated types for type-safe queries
 * Uses SSR-compatible client for proper cookie handling
 */
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Export types for convenience
export type { Database } from '@/types/supabase' 