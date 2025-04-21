import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route';
import { cookies } from 'next/headers';

/**
 * GET /api/onboarding
 * Gets onboarding data for the current user's workspace
 */
export async function GET(req: NextRequest) {
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
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data', message: userError.message }, { status: 500 });
    }
    
    if (!userData.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }
    
    // Get onboarding data for the workspace
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('workspace_onboarding')
      .select('*')
      .eq('workspace_id', userData.workspace_id)
      .single();
    
    if (onboardingError && onboardingError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch onboarding data', message: onboardingError.message }, { status: 500 });
    }
    
    // If no onboarding record exists, return empty data
    if (!onboardingData) {
      return NextResponse.json({ data: null });
    }
    
    return NextResponse.json({ data: onboardingData });
  } catch (error: any) {
    console.error('Error in onboarding GET route:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/onboarding
 * Saves or updates onboarding data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.workspace_id) {
      return NextResponse.json(
        { error: 'Missing workspace_id' },
        { status: 400 }
      );
    }
    
    // Check if user has access to this workspace
    const { data: userWorkspace, error: workspaceError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', session.user.id)
      .single();
      
    if (workspaceError || !userWorkspace) {
      return NextResponse.json(
        { error: 'Failed to verify workspace access' },
        { status: 500 }
      );
    }
    
    // Verify user has access to the requested workspace
    if (userWorkspace.workspace_id !== body.workspace_id) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      );
    }
    
    // Check if onboarding record already exists
    const { data: existingData, error: existingError } = await supabase
      .from('workspace_onboarding')
      .select('id')
      .eq('workspace_id', body.workspace_id)
      .single();
      
    let result;
    
    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from('workspace_onboarding')
        .update({
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          company_name: body.company_name,
          product_description_short: body.product_description_short,
          usp: body.usp,
          icp_persona: body.icp_persona,
          icp_pains_needs: body.icp_pains_needs,
          lead_magnet_ideas: body.lead_magnet_ideas,
          status: body.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select()
        .single();
        
      if (error) {
        return NextResponse.json(
          { error: 'Failed to update onboarding data' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('workspace_onboarding')
        .insert({
          workspace_id: body.workspace_id,
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          company_name: body.company_name,
          product_description_short: body.product_description_short,
          usp: body.usp,
          icp_persona: body.icp_persona,
          icp_pains_needs: body.icp_pains_needs,
          lead_magnet_ideas: body.lead_magnet_ideas,
          status: body.status
        })
        .select()
        .single();
        
      if (error) {
        return NextResponse.json(
          { error: 'Failed to create onboarding data' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API error saving onboarding data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 