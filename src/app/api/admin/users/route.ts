import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET(/*request: Request*/): Promise<Response> {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('Admin users API called')
    
    // Verify the user is authenticated and is an admin - using getUser() instead of getSession() for security
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication error in admin/users:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Admin users API - User authenticated:', user.email)

    // Get the user's role from the database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
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

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, workspace_id, created_at')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    console.log(`Found ${users.length} users`)
    
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
          .maybeSingle() // Use maybeSingle instead of single to handle missing workspaces
          
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

    console.log(`Processed ${usersWithWorkspaces.length} users with workspace data`)

    return NextResponse.json({ users: usersWithWorkspaces })
  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 