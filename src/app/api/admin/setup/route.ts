import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// This is a development-only endpoint for setting up an admin user
// It should be removed or disabled in production

export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 })
  }

  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .maybeSingle()
    
    // No error checking needed for existingUser - we handle both cases
    const _checkError = userCheckError // Keep error for debugging but don't use it
    
    // Create or update user in Supabase Auth
    if (existingUser) {
      // Update existing user's password
      const { error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      )
      
      if (error) {
        console.error('Error updating user password:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Update role to admin
      if (existingUser.role !== 'admin') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', existingUser.id)
        
        if (updateError) {
          console.error('Error updating user role:', updateError)
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
      }
      
      // Check if the user exists in our users table
      const { error: checkError } = await supabase
        .from('users')
        .select('id, role, workspace_id')
        .eq('id', existingUser.id)
        .single()
      
      // If user doesn't exist in the database or there was an error finding them
      if (checkError) {
        console.log('Creating user record after code verification')
        // Create the user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: existingUser.id,
            email: email,
            role: 'admin'
          })
        
        if (insertError) {
          console.error('Error creating user record:', insertError)
          return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
        }
      }
      
      return NextResponse.json({
        message: 'Admin user updated successfully',
        email
      })
    } else {
      // Create new user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
        }
      })
      
      if (error) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      if (!data.user) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      
      // Create user in users table with admin role
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: 'admin'
        })
      
      if (insertError) {
        console.error('Error creating user record:', insertError)
        return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
      }
      
      return NextResponse.json({
        message: 'Admin user created successfully. Please check your email for verification.',
        email
      })
    }
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 