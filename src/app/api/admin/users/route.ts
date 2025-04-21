import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request): Promise<Response> {
  try {
    console.log('Admin users API called')
    
    // Create supabase client with request for cookie access
    const supabase = createRouteHandlerSupabaseClient(request)
    
    // Verify the user is authenticated and is an admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error in admin/users API:', sessionError)
      return NextResponse.json({ error: 'Unauthorized - No valid session' }, { status: 401 })
    }

    console.log('Admin users API - Session found for user:', session.user.email)
    
    // Get the user's role from the database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userDataError) {
      console.error('User data fetch error in admin/users:', userDataError)
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 })
    }
    
    if (!userData || userData.role !== 'admin') {
      console.log('Non-admin user attempted to access admin/users API:', userData)
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    console.log('Admin role confirmed, fetching users')

    try {
      // Create admin client that bypasses RLS
      const adminClient = createAdminClient()
      
      // Get all users with admin client
      const { data: users, error: usersError } = await adminClient
        .from('users')
        .select('id, email, role, workspace_id, created_at')
        .order('created_at', { ascending: false })

      if (usersError) {
        throw usersError
      }
      
      if (!users) {
        return NextResponse.json({ users: [] })
      }
      
      console.log(`Found ${users.length} users using service role`)
      
      // Manually fetch workspace data for each user with a workspace_id using admin client
      const usersWithWorkspaces = await Promise.all(
        users.map(async user => {
          if (!user.workspace_id) {
            return {
              ...user,
              workspace: null
            }
          }
          
          const { data: workspace, error: workspaceError } = await adminClient
            .from('workspaces')
            .select('id, name, subdomain')
            .eq('id', user.workspace_id)
            .maybeSingle()
            
          if (workspaceError) {
            console.log(`Error fetching workspace for user ${user.id}:`, workspaceError)
            return {
              ...user,
              workspace: null
            }
          }
          
          return {
            ...user,
            workspace: workspace
          }
        })
      )

      console.log(`Processed ${usersWithWorkspaces.length} users with workspace data using service role`)

      return NextResponse.json({ users: usersWithWorkspaces })
    } catch (adminError) {
      console.error('Error using admin client:', adminError)
      
      // Fallback to standard client if admin client fails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, role, workspace_id, created_at')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }
      
      if (!users) {
        return NextResponse.json({ users: [] })
      }
      
      console.log(`Found ${users.length} users (fallback method)`)
      
      // Manually fetch workspace data for each user with a workspace_id
      const usersWithWorkspaces = await Promise.all(
        users.map(async user => {
          if (!user.workspace_id) {
            return {
              ...user,
              workspace: null
            }
          }
          
          const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id, name, subdomain')
            .eq('id', user.workspace_id)
            .maybeSingle()
            
          if (workspaceError) {
            console.log(`Error fetching workspace for user ${user.id}:`, workspaceError)
            return {
              ...user,
              workspace: null
            }
          }
          
          return {
            ...user,
            workspace: workspace
          }
        })
      )

      console.log(`Processed ${usersWithWorkspaces.length} users with workspace data (fallback method)`)

      return NextResponse.json({ 
        users: usersWithWorkspaces,
        note: "Results may be filtered by RLS. Service role access failed."
      })
    }
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 