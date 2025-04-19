import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route';
import { NextResponse } from 'next/server';

export async function GET(/*request: Request*/): Promise<Response> {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 401 }
      );
    }

    // If no session, return null user
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Verify email exists
    if (!session.user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get user data including role and workspace_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, workspace_id')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...session.user,
        role: userData.role,
        workspace_id: userData.workspace_id
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 