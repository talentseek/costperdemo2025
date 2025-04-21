// This file should only be imported in Server Components

import { createServerComponentClient } from './server'

/**
 * Get the authenticated user and their workspace
 * This is a server-side function that should only be used in server components
 * WARNING: This function will not work correctly in client components
 */
export async function getUserWithWorkspace() {
  try {
    // Get the Supabase client for server components
    const supabase = createServerComponentClient()
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { user: null, workspace: null }
    }
    
    // Get the user record from our database with the workspace_id
    const { data: userData, error: dbUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (dbUserError || !userData || !userData.workspace_id) {
      return { user, workspace: null }
    }
    
    // Get the user's workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', userData.workspace_id)
      .single()
    
    if (workspaceError || !workspace) {
      return { user, workspace: null }
    }
    
    return { user, workspace }
  } catch (error) {
    console.error('Error getting user with workspace:', error)
    return { user: null, workspace: null }
  }
} 