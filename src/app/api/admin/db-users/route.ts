import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('DB Users Check API called')
    
    // Query users table to see workspace IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, workspace_id, created_at')
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }
    
    console.log('User records:', users)
    
    return NextResponse.json({
      count: users?.length || 0,
      users: users || []
    })
  } catch (error) {
    console.error('Error in users check API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 