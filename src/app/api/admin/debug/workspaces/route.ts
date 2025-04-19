import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET(): Promise<Response> {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('Admin debug workspaces API called')
    
    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication error in debug/workspaces:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's role from the database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData || userData.role !== 'admin') {
      console.error('Admin access check failed:', userDataError)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Get all workspaces with debugging info
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspacesError) {
      console.error('Error fetching workspaces data:', workspacesError)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    return NextResponse.json({ workspaces })
  } catch (_err) {
    console.error('Error in debug/workspaces API:', _err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 