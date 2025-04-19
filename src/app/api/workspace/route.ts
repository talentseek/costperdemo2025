import { NextResponse } from 'next/server';

/**
 * Redirects to /api/workspace/get
 * This is for backward compatibility with components using /api/workspace directly
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const forwardUrl = new URL('/api/workspace/get', url.origin);
  
  // Copy any query parameters from the request
  url.searchParams.forEach((value, key) => {
    forwardUrl.searchParams.append(key, value);
  });
  
  return NextResponse.redirect(forwardUrl);
} 