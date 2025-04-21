/**
 * Consolidated Supabase client utilities
 * This file exports all Supabase client functions for different contexts
 * IMPORTANT: Only the functions exported here are safe to use in client components
 */

// Client utilities - safe for use in client components
export { createBrowserClient, createClientComponentClient } from './client'

// Basic server client - minimal implementation safe for both client and server components 
export { createServerComponentClient } from './server'
export { createServerComponentClientWithCookies } from './server'

// Route handler client for API routes
export { createRouteHandlerClient, createRouteHandlerSupabaseClient } from './route'

// Middleware client utilities
export { createMiddlewareSupabaseClient, updateSession } from './middleware'

// Admin client for server-side admin operations
export { createAdminClient } from './admin'

// Server-only utility functions (use only in server components)
// These are deliberately not exported from here to prevent client-component usage
// If you need them, import directly from their modules
// import { createServerOnlyClient } from './server-only'
// import { getUserWithWorkspace } from './auth' 