import type { Metadata } from "next"
import { AppSidebar } from "@/components/sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { UserDropdown } from "@/components/user-dropdown"
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from "@/utils/supabase/admin"

export const metadata: Metadata = {
  title: "Dashboard - CostPerDemo",
  description: "Manage your CostPerDemo campaigns and settings",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Default user info - we'll update this with the actual user info
  let userInfo = {
    name: "User",
    email: "",
    image: "",
  };
  
  try {
    // Create a simple client - we'll focus on using admin client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => undefined,
          set: () => {},
          remove: () => {}
        }
      }
    );
    
    // Try to get session and user data from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      try {
        // Try to use admin client as fallback to get user details
        const adminClient = createAdminClient();
        
        // Use admin client to bypass RLS
        const { data: userData } = await adminClient
          .from('users')
          .select('email, role')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          // Extract display name from email (everything before @)
          const displayName = userData.email?.split('@')[0] || 
                          user.email?.split('@')[0] ||
                          'User';
          
          console.log('User display name:', displayName);
          
          // Update user info with the extracted name and email
          userInfo = {
            // Display the email username as the display name
            name: displayName,
            // Keep the full email for the dropdown
            email: userData.email || user.email || '',
            image: user.user_metadata?.avatar_url || '',
          };
          
          console.log('Dashboard layout user:', userInfo.name, userData.role);
        } else {
          console.log('No user data found from admin client');
          
          // Fallback to auth data if we have an email
          if (user.email) {
            const displayName = user.email.split('@')[0];
            userInfo = {
              name: displayName,
              email: user.email,
              image: user.user_metadata?.avatar_url || '',
            };
            console.log('Using fallback user info:', displayName);
          }
        }
      } catch (error) {
        console.error('Error fetching user data with admin client:', error);
        
        // Fallback to just using auth data if we have an email
        if (user.email) {
          const displayName = user.email.split('@')[0];
          userInfo = {
            name: displayName,
            email: user.email,
            image: user.user_metadata?.avatar_url || '',
          };
          console.log('Using error fallback user info:', displayName);
        }
      }
    } else {
      console.log('No user session found');
    }
  } catch (error) {
    console.error('Error in dashboard layout:', error);
  }
  
  console.log('Final user info being passed to dropdown:', userInfo);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="h-4" />
              <h1 className="text-lg font-semibold">CostPerDemo</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserDropdown user={userInfo} />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 