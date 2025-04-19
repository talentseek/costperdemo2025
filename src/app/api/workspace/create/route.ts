import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function POST(request: Request) {
  try {
    // Log the raw request for debugging
    const rawBody = await request.text();
    console.log('Workspace creation API request body:', rawBody);

    // Parse the request body
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { companyName, subdomain } = body;
    console.log('Parsed workspace creation request:', { companyName, subdomain });
    
    if (!companyName) {
      console.log('Workspace creation failed: Company name is required');
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      
      // Check if session exists to diagnose the issue
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check in workspace create:', { 
        hasSession: !!session, 
        sessionError: sessionError || 'none' 
      })
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    console.log('Creating workspace for user:', user.email)
    
    try {
      // First, ensure the user exists in the 'users' table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .maybeSingle()
        
      if (userCheckError) {
        console.error('Error checking for existing user:', userCheckError)
        throw new Error(userCheckError.message)
      }
      
      // If user doesn't exist in the database, create them
      if (!existingUser) {
        console.log('User does not exist in users table, creating record...')
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: 'client'
          })
        
        if (createUserError) {
          console.error('Error creating user record:', createUserError)
          throw new Error(createUserError.message)
        }
      } else {
        console.log('Found existing user record:', existingUser)
      }
      
      // Now create the workspace
      console.log('Creating workspace with name:', companyName)
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: companyName,
          subdomain: subdomain || null,
          owner_id: user.id
        })
        .select()
        .single()
      
      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError)
        throw new Error(workspaceError.message)
      }
      
      if (!workspace) {
        throw new Error('Failed to create workspace')
      }
      
      console.log('Workspace created:', workspace)
      
      // Update the user record with the workspace ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ workspace_id: workspace.id })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Error updating user with workspace ID:', updateError)
        // We still continue even if this fails
      } else {
        console.log('User updated with workspace ID')
      }
      
      return NextResponse.json({
        message: 'Workspace created successfully',
        workspace
      })
    } catch (error: unknown) {
      console.error('Error creating workspace:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Workspace creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 