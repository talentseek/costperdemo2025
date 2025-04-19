import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('id');
    
    const supabase = createRouteHandlerSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get workspace details
    if (workspaceId) {
      // Get specific workspace by ID
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
      
      if (error) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ workspace });
    } else {
      // Get user's workspace from their user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('workspace_id')
        .eq('id', session.user.id)
        .single();
      
      if (userError || !userData?.workspace_id) {
        return NextResponse.json(
          { error: 'No workspace associated with user' },
          { status: 404 }
        );
      }
      
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', userData.workspace_id)
        .single();
      
      if (workspaceError) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ workspace });
    }
  } catch (error) {
    console.error('Get workspace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 