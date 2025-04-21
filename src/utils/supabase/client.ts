import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase client for browser/client usage
 * @returns Supabase client
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Creates a Supabase client for client components
 * This is an alias of createBrowserClient for semantic clarity
 * @returns Supabase client
 */
export const createClientComponentClient = createBrowserClient; 