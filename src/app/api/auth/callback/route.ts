import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/verify/success'
  
  console.log('Auth callback received with:', { 
    code: code ? `${code.substring(0, 10)}...` : null, 
    redirectTo,
    url: request.url
  })
  
  try {
    const supabase = createRouteHandlerSupabaseClient()
    
    if (code) {
      // There are two possible formats:
      // 1. A code parameter with an OAuth code
      // 2. A code parameter with a hash containing access_token etc.
      
      // Check if this is a hash format with access_token (from email verification)
      if (code.includes('access_token')) {
        console.log('Processing token-based verification')
        const hashParams = new URLSearchParams(code)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('token_type')
        
        if (accessToken && refreshToken && tokenType) {
          // Set the session manually using the tokens
          const { data: { user }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError)
            return NextResponse.redirect(new URL('/login?error=auth_error', requestUrl.origin))
          }
          
          console.log('Session established for user:', user?.email)
          
          // If we have a user, create or verify their record
          if (user && user.email) {
            // Check if the user exists in our users table
            const { data: existingUser, error: checkError } = await supabase
              .from('users')
              .select('id, role, workspace_id')
              .eq('id', user.id)
              .single()
              
            // If user doesn't exist in the database or there was an error finding them
            if (checkError && checkError.code === 'PGRST116') {
              console.log('Creating new user record for:', user.email)
              // Create the user record
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email,
                  role: 'client'
                })
                
              if (insertError) {
                console.error('Error creating user record:', insertError)
                return NextResponse.redirect(new URL('/login?error=user_creation_failed', requestUrl.origin))
              }
              
              // Redirect to workspace creation since this is a new user
              return NextResponse.redirect(new URL('/workspace', requestUrl.origin))
            }
            
            console.log('User exists:', existingUser)
            
            // Existing user with a workspace - redirect to dashboard
            if (existingUser && existingUser.workspace_id) {
              return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            }
            
            // Existing user with no workspace - redirect to workspace creation
            return NextResponse.redirect(new URL('/workspace', requestUrl.origin))
          }
        }
        
        // If we couldn't extract tokens or user, redirect to success
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
      }
      
      // Regular OAuth code flow
      console.log('Processing regular code verification')
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=exchange_failed', requestUrl.origin))
      }
      
      // Get the user details
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user after code exchange:', userError)
        return NextResponse.redirect(new URL('/login?error=user_retrieval_failed', requestUrl.origin))
      }
      
      console.log('Code exchanged successfully for user:', user?.email)
      
      if (user && user.email) {
        // Check if the user exists in our users table
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, workspace_id')
          .eq('id', user.id)
          .single()
          
        // If user doesn't exist in the database or there was an error finding them
        if (checkError && checkError.code === 'PGRST116') {
          console.log('Creating user record after code verification')
          // Create the user record
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              role: 'client'
            })
            
          if (insertError) {
            console.error('Error creating user record:', insertError)
            // Redirect to login with error
            return NextResponse.redirect(new URL('/login?error=user_creation_failed', requestUrl.origin))
          }
          
          // Redirect to workspace creation since this is a new user
          return NextResponse.redirect(new URL('/workspace', requestUrl.origin))
        }
        
        // User exists - check if they need to create a workspace
        if (existingUser && !existingUser.workspace_id) {
          return NextResponse.redirect(new URL('/workspace', requestUrl.origin))
        }
        
        // User exists and has a workspace - redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      }
      
      // No valid user found - redirect to login
      return NextResponse.redirect(new URL('/login', requestUrl.origin))
    }
    
    // No code parameter, redirect to login
    console.log('No code parameter provided in callback')
    return NextResponse.redirect(new URL('/auth?tab=login', requestUrl.origin))
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=auth_error', requestUrl.origin))
  }
} 