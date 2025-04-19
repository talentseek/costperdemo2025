import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.json()
    
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check if the user has permission to submit for this workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id, role')
      .eq('id', session.user.id)
      .single()
      
    if (!userData || (userData.workspace_id !== formData.workspace_id && userData.role !== 'admin')) {
      return NextResponse.json(
        { message: 'You do not have permission to submit for this workspace' },
        { status: 403 }
      )
    }
    
    // Check if a record exists
    const { data: existingRecord, error: selectError } = await supabase
      .from('workspace_onboarding')
      .select('id')
      .eq('workspace_id', formData.workspace_id)
      .single()
      
    let result
    
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('workspace_onboarding')
        .update(formData)
        .eq('workspace_id', formData.workspace_id)
    } else {
      // Insert new record
      result = await supabase
        .from('workspace_onboarding')
        .insert([formData])
    }
    
    if (result.error) {
      console.error('Database error:', result.error)
      return NextResponse.json(
        { message: result.error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { success: true, message: 'Onboarding data saved successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in onboarding submission:', error)
    return NextResponse.json(
      { message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 