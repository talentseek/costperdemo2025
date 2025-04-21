import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request): Promise<Response> {
  try {
    console.log('Admin workspaces API called')
    
    // Create supabase client with request for cookie access
    const supabase = createRouteHandlerSupabaseClient(request)
    
    // Verify the user is authenticated and is an admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error in admin/workspaces API:', sessionError)
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    console.log('Admin workspaces API - Session found for user:', session.user.email)
    
    // Get the user's role from the database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userDataError) {
      console.error('User data fetch error in admin/workspaces:', userDataError)
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 })
    }
    
    if (!userData || userData.role !== 'admin') {
      console.log('Non-admin user attempted to access admin/workspaces API:', userData)
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    console.log('Admin role confirmed, fetching workspaces')

    try {
      // Create admin client that bypasses RLS
      const adminClient = createAdminClient()
      
      // Get all workspaces with their owner information using admin client
      const { data: workspaces, error: workspacesError } = await adminClient
        .from('workspaces')
        .select(`
          id, 
          name, 
          subdomain, 
          created_at, 
          updated_at,
          owner_id
        `)
        .order('created_at', { ascending: false })

      if (workspacesError) {
        throw workspacesError
      }
      
      // Handle case where workspaces could be null
      if (!workspaces) {
        return NextResponse.json({ workspaces: [] })
      }
      
      console.log(`Found ${workspaces.length} workspaces using service role`)
      
      // Fetch owner details for each workspace using admin client
      const workspacesWithOwners = await Promise.all(
        workspaces.map(async workspace => {
          if (!workspace.owner_id) {
            return {
              ...workspace,
              owner: null
            }
          }
          
          const { data: owner, error: ownerError } = await adminClient
            .from('users')
            .select('id, email')
            .eq('id', workspace.owner_id)
            .maybeSingle()
            
          if (ownerError) {
            console.log(`Error fetching owner for workspace ${workspace.id}:`, ownerError)
            return {
              ...workspace,
              owner: null
            }
          }
          
          return {
            ...workspace,
            owner
          }
        })
      )

      if (workspacesWithOwners) {
        console.log(`Processed ${workspacesWithOwners.length} workspaces with owner data`)
      }

      return NextResponse.json({ workspaces: workspacesWithOwners || [] })
    } catch (adminError) {
      console.error('Error using admin client:', adminError)
      
      // Fallback to standard client if admin client fails
      const { data: fallbackWorkspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select(`
          id, 
          name, 
          subdomain, 
          created_at, 
          updated_at,
          owner_id
        `)
        .order('created_at', { ascending: false })

      if (workspacesError) {
        console.error('Error fetching workspaces:', workspacesError)
        return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
      }
      
      // Handle case where workspaces could be null
      if (!fallbackWorkspaces) {
        return NextResponse.json({ workspaces: [] })
      }
      
      console.log(`Found ${fallbackWorkspaces.length} workspaces (fallback method)`)
      
      // Fetch owner details for each workspace
      const workspacesWithOwners = await Promise.all(
        fallbackWorkspaces.map(async workspace => {
          if (!workspace.owner_id) {
            return {
              ...workspace,
              owner: null
            }
          }
          
          const { data: owner, error: ownerError } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', workspace.owner_id)
            .maybeSingle()
            
          if (ownerError) {
            console.log(`Error fetching owner for workspace ${workspace.id}:`, ownerError)
            return {
              ...workspace,
              owner: null
            }
          }
          
          return {
            ...workspace,
            owner
          }
        })
      )

      if (workspacesWithOwners) {
        console.log(`Processed ${workspacesWithOwners.length} workspaces with owner data (fallback method)`)
      }

      return NextResponse.json({ 
        workspaces: workspacesWithOwners || [],
        note: "Results may be filtered by RLS. Service role access failed."
      })
    }
  } catch (error) {
    console.error('Error in workspaces API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 