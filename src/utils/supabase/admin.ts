import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase admin client with service role privileges
 * This should only be used in server-side admin API routes
 * @returns A Supabase client with service role privileges that can bypass RLS
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role key or URL. Admin client cannot be created.')
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} 