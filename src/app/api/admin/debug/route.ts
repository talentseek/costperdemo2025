import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('Debug API for workspaces called')
    
    // Direct query to fetch all workspaces
    const { data: allWorkspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspacesError) {
      console.error('Error fetching workspaces in debug route:', workspacesError)
      return NextResponse.json({ error: workspacesError.message }, { status: 500 })
    }

    console.log(`Debug: Found ${allWorkspaces.length} workspaces:`, allWorkspaces)

    return NextResponse.json({ 
      count: allWorkspaces.length,
      workspaces: allWorkspaces
    })
  } catch (error) {
    console.error('Error in debug API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 