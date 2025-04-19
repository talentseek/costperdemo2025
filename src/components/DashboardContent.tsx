'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { handleLogout } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'

interface User {
  id: string
  email: string
  role: string
  workspace_id: string | null
}

interface Workspace {
  id: string
  name: string
  subdomain: string | null
  owner_id: string
  created_at: string
}

export default function DashboardContent() {
  const router = useRouter()
  const [_user, setUser] = useState<User | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [_error, setError] = useState<string | null>(null)

  // Define fetchUserData with useCallback to avoid dependency issues
  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      // Check for HTTP error responses
      if (!response.ok) {
        const _errorData = await response.json();
        throw new Error(_errorData.error || 'Failed to fetch user session');
      }
      
      const data = await response.json();
      
      // If no user or session, redirect to login
      if (!data.user) {
        router.push('/login');
        return;
      }
      
      setUser(data.user);
    } catch (_err) {
      console.error('Error loading profile:', _err)
      setError(_err instanceof Error ? _err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
    
    // Define fetchWorkspaceData inside useEffect to avoid dependency issues
    const fetchWorkspaceData = async () => {
      try {
        const response = await fetch('/api/workspace/get');
        
        // Check for HTTP error responses
        if (!response.ok) {
          const _errorData = await response.json();
          setError('Failed to load workspace data');
          return;
        }
        
        const data = await response.json();
        
        if (data.workspace) {
          setWorkspace(data.workspace);
        } else {
          setError('No workspace found');
        }
      } catch (_err) {
        console.error('Error fetching workspace data:', _err);
        setError('Failed to load workspace data');
      }
    };
    
    fetchWorkspaceData();
  }, [fetchUserData]);

  const onLogout = async () => {
    handleLogout(
      router,
      setLoading,
      (_error) => {
        toast.error('Failed to log out. Please try again.');
      }
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="mr-2" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="outline" onClick={onLogout} disabled={loading}>
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              Logout
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Your Workspace</h2>
              <p className="text-muted-foreground">{workspace?.name}</p>
              {workspace?.subdomain && (
                <p className="text-sm text-muted-foreground">
                  Subdomain: {workspace.subdomain}.costperdemo.com
                </p>
              )}
            </div>

            {_error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {_error}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 