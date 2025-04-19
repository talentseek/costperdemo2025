import { NextResponse } from 'next/server'
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'

// Define result interfaces
type _QueryResult = {
  count: number;
  error: string | null;
  data?: unknown[];
}

export async function GET(): Promise<Response> {
  try {
    const supabase = createRouteHandlerSupabaseClient()
    const { error } = await supabase.from('users').select('*').limit(1)
    
    if (error) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    
    return NextResponse.json({ status: 'ok', message: 'Database is connected' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 