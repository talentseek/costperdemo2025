import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: Request) {
  try {
    // Create a response that will contain cookies
    const response = NextResponse.json({
      message: 'Logout processing'
    })
    
    // Create Supabase client with response cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.headers.get('cookie')?.split(';')
              .find(c => c.trim().startsWith(`${name}=`))
              ?.split('=')[1]
          },
          set(name, value, options) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name, options) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            })
          }
        }
      }
    )
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    // Create a final response with the success message, but copy over the auth cookie deletions
    const finalResponse = NextResponse.json({
      message: 'Logout successful',
      redirectTo: '/auth?tab=login'
    })
    
    // Copy cookies from the response to final response
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie)
    })
    
    return finalResponse
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add a GET handler to return a helpful error message
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Logout requires a POST request. If you are seeing this message, please use the logout button in the user dropdown instead of navigating directly to this URL.' 
    },
    { status: 405 }
  )
} 