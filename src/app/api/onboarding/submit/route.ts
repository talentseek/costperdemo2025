import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route';
import { onboardingSchema } from '@/lib/schemas/onboarding';
import { NextRequest, NextResponse } from 'next/server';

// POST - handle final submission of onboarding form
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Unauthorized', message: sessionError.message }, { status: 401 });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized', message: 'No session found' }, { status: 401 });
    }
    
    // Parse the request body
    const formData = await req.json();
    
    // Validate the form data
    const validationResult = onboardingSchema.safeParse(formData);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        issues: validationResult.error.issues 
      }, { status: 400 });
    }
    
    const validData = validationResult.data;
    
    // Check if the user has access to the workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data', message: userError.message }, { status: 500 });
    }
    
    if (userData.workspace_id !== validData.workspace_id) {
      return NextResponse.json({ error: 'Unauthorized', message: 'You do not have access to this workspace' }, { status: 403 });
    }
    
    // Check if an onboarding record already exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('workspace_onboarding')
      .select('id')
      .eq('workspace_id', validData.workspace_id)
      .single();
    
    let result;
    
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('workspace_onboarding')
        .update({
          ...validData,
          status: 'submitted', // Set status to submitted when saving the form
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
    } else {
      // Insert new record
      result = await supabase
        .from('workspace_onboarding')
        .insert([{
          ...validData,
          status: 'submitted', // Set status to submitted when saving the form
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
    }
    
    if (result.error) {
      return NextResponse.json({ error: 'Failed to save onboarding data', message: result.error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Onboarding data submitted successfully'
    });
    
  } catch (error: any) {
    console.error('Error in onboarding submit route:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
} 