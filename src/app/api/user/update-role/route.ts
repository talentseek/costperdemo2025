import { createRouteHandlerSupabaseClient } from '@/utils/supabase/route';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (role !== 'admin' && role !== 'client') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "client"' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerSupabaseClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if current user has admin role
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
    
    // Update the target user's role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 