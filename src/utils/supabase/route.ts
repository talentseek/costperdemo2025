import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for route handlers
 * This version works in API routes with proper cookie handling
 * @param request - The request object to get cookies from
 * @param response - The response object to set cookies on
 * @returns Supabase client configured for route handlers
 */
export function createRouteHandlerClient(request: Request, response: Response) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split(';')
            .find(c => c.trim().startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: any) {
          // Build cookie string
          let cookieStr = `${name}=${value}; path=${options.path || '/'}`;
          
          if (options.maxAge) cookieStr += `; max-age=${options.maxAge}`;
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.secure) cookieStr += '; secure';
          if (options.httpOnly) cookieStr += '; httponly';
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
          
          response.headers.append('Set-Cookie', cookieStr);
        },
        remove(name: string, options: any) {
          // Set cookie with empty value and immediate expiration
          let cookieStr = `${name}=; path=${options.path || '/'}; max-age=0`;
          
          if (options.domain) cookieStr += `; domain=${options.domain}`;
          if (options.secure) cookieStr += '; secure';
          if (options.httpOnly) cookieStr += '; httponly';
          if (options.sameSite) cookieStr += `; samesite=${options.sameSite}`;
          
          response.headers.append('Set-Cookie', cookieStr);
        }
      }
    }
  )
}

/**
 * Creates a Supabase client for API route handlers
 * This version uses direct cookie parsing from request headers
 * and should be used with the request object available in route handlers
 * @param request - The request object to get cookies from
 * @returns Supabase client for API routes
 */
export function createRouteHandlerSupabaseClient(request: Request) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Parse cookies from the cookie header directly
          const cookieString = request.headers.get('cookie') || '';
          const match = cookieString.match(new RegExp(`(^| )${name}=([^;]+)`));
          return match?.[2];
        },
        set: () => {}, // No-op since we can't set cookies at request time
        remove: () => {} // No-op since we can't remove cookies at request time
      }
    }
  )
} 