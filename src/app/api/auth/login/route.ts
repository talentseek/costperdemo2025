import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  try {
    // Parse request body
    let reqBody;
    try {
      reqBody = await request.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { email, password } = reqBody;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Create a response to include cookies
    const response = NextResponse.json({ 
      message: 'Authentication in progress' 
    });
    
    // Create Supabase client with cookie handling
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            // Parse cookies from the cookie header directly
            const cookieString = request.headers.get('cookie') || '';
            const match = cookieString.match(new RegExp(`(^| )${name}=([^;]+)`));
            return match?.[2];
          },
          set(name, value, options) {
            // Add cookie to the response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            // Remove the cookie
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Login error:', error)
      
      // Return user-friendly error message based on error code
      let errorMessage = 'Authentication failed'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }
    
    if (!data.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get user data from database to get role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, workspace_id')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'Error fetching user details' },
        { status: 500 }
      )
    }
    
    // Create final response with user details
    const authResponse = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userData?.role || 'client',
        workspace_id: userData?.workspace_id,
      },
      session: {
        expires_at: data.session?.expires_at,
      }
    })
    
    // Copy cookies from the login response to the final response
    response.cookies.getAll().forEach(cookie => {
      authResponse.cookies.set({
        name: cookie.name,
        value: cookie.value,
        path: '/',
        maxAge: cookie.maxAge,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
      });
    })
    
    return authResponse
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 