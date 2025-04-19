import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(/*request: Request*/): Promise<Response> {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('Admin workspaces API called')
    
    // Verify the user is authenticated and is an admin
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('Session error in admin/workspaces:', sessionError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Admin workspaces API - User authenticated:', session.user.email)

    // Get the user's role from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('User data fetch error in admin/workspaces:', userError)
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 })
    }
    
    if (!userData || userData.role !== 'admin') {
      console.log('Non-admin user attempted to access admin API:', userData)
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    console.log('Admin role confirmed, fetching workspaces')

    try {
      // Create admin client that bypasses RLS
      const adminClient = createAdminClient()
      
      // Use admin client to fetch all workspaces
      const { data: workspaces, error: workspacesError } = await adminClient
        .from('workspaces')
        .select(`
          id, 
          name, 
          subdomain, 
          owner_id,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        
      if (workspacesError) {
        throw workspacesError
      }
      
      // Log the count and data for debugging
      console.log(`Found ${workspaces?.length || 0} workspaces using service role`)
      
      return NextResponse.json({ workspaces })
    } catch (adminError) {
      console.error('Error using admin client:', adminError)
      
      // Fallback to SQL query if admin client fails
      const { data: workspaces, error: workspacesError } = await supabase.rpc('exec_sql', {
        query_text: `
          SELECT 
            id, 
            name, 
            subdomain, 
            owner_id,
            created_at,
            updated_at
          FROM workspaces
          ORDER BY created_at DESC;
        `
      })

      if (workspacesError) {
        console.error('Error executing SQL query:', workspacesError)
        
        // Fallback to RLS-filtered query as last resort
        const { data: filteredWorkspaces, error: filteredError } = await supabase
          .from('workspaces')
          .select(`
            id, 
            name, 
            subdomain, 
            owner_id,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
        
        if (filteredError) {
          console.error('Error fetching workspaces:', filteredError)
          return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
        }
        
        console.log(`Found ${filteredWorkspaces.length} workspaces with RLS filtering`)
        return NextResponse.json({ 
          workspaces: filteredWorkspaces,
          note: "Results may be filtered by RLS. Add SUPABASE_SERVICE_ROLE_KEY to environment variables to see all workspaces."
        })
      }
      
      console.log(`Found ${workspaces?.length || 0} workspaces via SQL bypass`)
      return NextResponse.json({ workspaces })
    }
  } catch (error) {
    console.error('Error in workspaces API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 