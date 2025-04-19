import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

export async function GET() {
  const supabase = createRouteHandlerSupabaseClient()

  try {
    console.log('SQL Query API called')
    
    // Execute direct SQL query to bypass RLS
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: 'SELECT * FROM workspaces;'
    })
    
    if (error) {
      console.error('Error executing SQL query:', error)
      
      // Try an alternative approach - special admin view
      const { data: rawData, error: rawError } = await supabase
        .from('admin_workspaces_view')
        .select('*')
        
      if (rawError) {
        console.error('Admin view query error:', rawError)
        
        // Last attempt - a simple select with auth.role() bypassing
        const { data: simpleData, error: simpleError } = await supabase
          .from('workspaces')
          .select('*')
        
        console.log('Basic select results:', {
          success: !simpleError,
          count: simpleData?.length || 0,
          error: simpleError?.message
        })
        
        return NextResponse.json({
          error: 'All query methods failed',
          details: {
            rpcError: error.message,
            viewError: rawError.message,
            selectError: simpleError?.message
          }
        }, { status: 500 })
      }
      
      return NextResponse.json({
        source: 'admin_view',
        count: rawData?.length || 0,
        workspaces: rawData || []
      })
    }
    
    return NextResponse.json({
      source: 'direct_sql',
      count: data?.length || 0,
      workspaces: data || []
    })
  } catch (error) {
    console.error('Error in SQL query API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 