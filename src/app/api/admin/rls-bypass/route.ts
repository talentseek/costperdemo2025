import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('RLS Bypass API called')
    
    // Use a service role token to bypass RLS
    // Execute raw SQL query to see workspaces
    const { data, error } = await supabase.rpc('admin_get_all_workspaces')
    
    if (error) {
      console.error('Error executing SQL query:', error)
      
      // Try a direct query with auth.uid() override
      const { data: directData, error: directError } = await supabase
        .from('workspaces')
        .select('*')
        .limit(100)
        
      if (directError) {
        console.error('Direct query error:', directError)
        return NextResponse.json({ error: directError.message }, { status: 500 })
      }
      
      return NextResponse.json({
        message: 'Direct query results (might be filtered by RLS)',
        count: directData?.length || 0,
        workspaces: directData || []
      })
    }
    
    return NextResponse.json({
      count: data?.length || 0,
      workspaces: data || []
    })
  } catch (error) {
    console.error('Error in RLS bypass API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 