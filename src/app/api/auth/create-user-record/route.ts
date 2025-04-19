import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('API: Create user record endpoint called')
    
    // Extract project ref from URL to use in cookie name
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || ''
    const cookieName = `sb-${projectRef}-auth-token`
    
    console.log('API: Looking for cookie:', cookieName)
    
    // Get the auth cookie directly from the request headers
    const authCookie = request.cookies.get(cookieName)?.value
    
    // Log all available cookies for debugging
    const allCookies = request.cookies.getAll().map(c => c.name)
    console.log('API: Available cookies:', allCookies)
    
    if (!authCookie) {
      console.error('API: No auth cookie found in request')
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'No auth cookie found' },
        { status: 401 }
      )
    }
    
    // Create a direct Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Get user from the auth cookie
    const { data: { user }, error: authError } = await supabase.auth.getUser(authCookie)
    
    if (authError || !user) {
      console.error('API: Auth error or no user:', authError)
      return NextResponse.json(
        { success: false, error: 'Authentication error', message: authError?.message || 'Failed to authenticate user' },
        { status: 401 }
      )
    }
    
    console.log('API: User found:', user.email)
    
    // Check if user record already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()
      
    if (checkError) {
      console.error('API: Database check error:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error', message: checkError.message },
        { status: 500 }
      )
    }
    
    // If user record already exists, return success
    if (existingUser) {
      console.log('API: User record already exists')
      return NextResponse.json(
        { success: true, message: 'User record already exists', user_id: user.id },
        { status: 200 }
      )
    }
    
    console.log('API: Creating new user record for', user.email)
    // Create user record
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        role: 'client' // Default role
      })
      
    if (createError) {
      console.error('API: User creation error:', createError)
      return NextResponse.json(
        { success: false, error: 'Creation error', message: createError.message },
        { status: 500 }
      )
    }
    
    console.log('API: User record created successfully')
    return NextResponse.json(
      { success: true, message: 'User record created successfully', user_id: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('API: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Unexpected error', message: error.message || 'An unknown error occurred' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 