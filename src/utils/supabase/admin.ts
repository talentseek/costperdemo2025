import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase admin client with service role privileges
 * This bypasses RLS policies and should ONLY be used in server-side admin routes
 * @returns Supabase client with service role permissions
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Admin client creation failed: Missing Supabase URL or service role key')
    throw new Error('Missing environment variables for Supabase admin client')
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey
  )
} 