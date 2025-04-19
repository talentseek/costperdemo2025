/**
 * Consolidated Supabase client utilities
 * This file exports all Supabase client functions for different contexts
 */

// Browser client for client components
export { createBrowserClient } from './client'

// Server client for server components
export { createServerComponentClient as createClient } from './server'

// Route handler client for API routes
export { createRouteHandlerSupabaseClient as createRouteHandlerClient } from './route'

// Middleware client utilities
export { createMiddlewareSupabaseClient, updateSession } from './middleware' 