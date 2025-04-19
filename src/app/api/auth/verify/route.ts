import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'
import { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    const supabase = createRouteHandlerSupabaseClient()

    // Handle direct verification code flow
    if (code) {
      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Code verification error:', error)
          return NextResponse.redirect(new URL('/verify?error=' + encodeURIComponent(error.message), request.url))
        }
        
        // Get the user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('Session error after code verification:', sessionError)
          return NextResponse.redirect(new URL('/verify?error=session_error', request.url))
        }

        // Create or update user record
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: session.user.id,
            email: session.user.email,
            role: 'client'
          }, { onConflict: 'id' })

        if (upsertError) {
          console.error('User record update error:', upsertError)
        }

        // Redirect to workspace creation or dashboard
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('workspace_id')
          .eq('id', session.user.id)
          .single()

        if (!userError && userData && userData.workspace_id) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/workspace', request.url))
        }
      } catch (error) {
        console.error('Code verification error:', error)
        return NextResponse.redirect(new URL('/verify?error=verification_failed', request.url))
      }
    }

    // Legacy token_hash flow
    if (token_hash && type) {
      // Exchange the OTP for a session
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error('Verification error:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      // Get the newly created session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('Session error after verification:', sessionError)
        return NextResponse.json(
          { error: 'Failed to get session after verification' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: 'Email verified successfully',
        user: {
          id: session.user.id,
          email: session.user.email
        }
      })
    }

    // No valid verification parameters
    return NextResponse.json(
      { error: 'Missing verification parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Verification internal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 