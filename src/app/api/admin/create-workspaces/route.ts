import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('Create Workspaces Utility API called')
    
    // Get all users with workspace IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, workspace_id')
      .not('workspace_id', 'is', null)
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }
    
    console.log(`Found ${users.length} users with workspace IDs`)
    
    // Create workspaces for each user
    const results = []
    
    for (const user of users) {
      if (!user.workspace_id) continue
      
      // Check if workspace exists already
      const { data: existing, error: checkError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', user.workspace_id)
        .maybeSingle()
      
      if (checkError) {
        console.error(`Error checking workspace ${user.workspace_id}:`, checkError)
        results.push({
          workspaceId: user.workspace_id,
          userId: user.id,
          email: user.email,
          status: 'error',
          error: checkError.message
        })
        continue
      }
      
      if (existing) {
        console.log(`Workspace ${user.workspace_id} already exists`)
        results.push({
          workspaceId: user.workspace_id,
          userId: user.id,
          email: user.email,
          status: 'exists'
        })
        continue
      }
      
      // Create the workspace
      const workspaceName = user.email.split('@')[0] + "'s Workspace"
      
      const { data: workspace, error: createError } = await supabase
        .from('workspaces')
        .insert({
          id: user.workspace_id,
          name: workspaceName,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error(`Error creating workspace for ${user.email}:`, createError)
        results.push({
          workspaceId: user.workspace_id,
          userId: user.id,
          email: user.email,
          status: 'error',
          error: createError.message
        })
      } else {
        console.log(`Created workspace for ${user.email}:`, workspace)
        results.push({
          workspaceId: user.workspace_id,
          userId: user.id,
          email: user.email,
          status: 'created',
          workspace
        })
      }
    }
    
    return NextResponse.json({
      users: users.length,
      results
    })
  } catch (error) {
    console.error('Error in create workspaces API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 