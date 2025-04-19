import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

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
    
    // Create Supabase client with proper cookie handling
    const supabase = createRouteHandlerSupabaseClient()
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.log('Login error:', error.message)
      
      // Provide more user-friendly error messages based on Supabase error codes
      let userMessage = 'Invalid login credentials'
      
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'The email or password you entered is incorrect'
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please verify your email before logging in'
      } else if (error.message.includes('rate limit')) {
        userMessage = 'Too many login attempts. Please try again later'
      }
      
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      )
    }
    
    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed. Please try again' },
        { status: 401 }
      )
    }
    
    // Get user data including role and workspace_id from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, workspace_id')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user data:', userError)
      // Continue with default role if user data can't be fetched
    }
    
    const userRole = userData?.role || 'client'
    const workspaceId = userData?.workspace_id || null
    
    // Return response with user data
    // Cookies have already been set by the ssr client
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        workspace_id: workspaceId,
      },
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later' },
      { status: 500 }
    )
  }
} 