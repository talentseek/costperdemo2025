import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User authentication error:', userError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get user data including workspace_id
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id, email, role, workspace_id')
      .eq('id', user.id)
      .single()
    
    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      return NextResponse.json(
        { error: 'Failed to retrieve user data' },
        { status: 500 }
      )
    }
    
    // If user has a workspace, get workspace details
    let workspaceData = null
    if (userData?.workspace_id) {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, subdomain, owner_id, created_at')
        .eq('id', userData.workspace_id)
        .single()
      
      if (workspaceError) {
        console.error('Error fetching workspace data:', workspaceError)
        return NextResponse.json(
          { error: 'Failed to retrieve workspace data' },
          { status: 500 }
        )
      }
      
      workspaceData = workspace
    }
    
    // Check if user is an admin
    const isAdmin = userData?.role === 'admin'
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: userData?.role || 'client',
        isAdmin,
        workspace_id: userData?.workspace_id
      },
      workspace: workspaceData
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 