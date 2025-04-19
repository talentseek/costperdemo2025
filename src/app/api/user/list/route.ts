import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user role:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }
    
    // Fetch all users
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        *,
        workspaces (
          id, 
          name, 
          subdomain
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Users retrieved successfully',
      users,
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 