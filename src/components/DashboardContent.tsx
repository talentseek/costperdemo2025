'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface Workspace {
  id: string
  name: string
  subdomain: string | null
}

export default function DashboardContent() {
  const router = useRouter()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWorkspace() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('Current user:', user)
        if (userError) throw userError
        if (!user) {
          console.log('No user found, redirecting to login')
          router.push('/login')
          return
        }

        // Get user's workspace
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('workspace_id')
          .eq('id', user.id)
          .single()
        
        console.log('User data:', userData)
        console.log('User data error:', userDataError)
        
        if (userDataError) {
          console.error('Error fetching user data:', userDataError)
          throw userDataError
        }
        
        if (!userData?.workspace_id) {
          console.log('No workspace_id found, redirecting to workspace creation')
          router.push('/workspace')
          return
        }

        // Get workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select('id, name, subdomain')
          .eq('id', userData.workspace_id)
          .single()

        console.log('Workspace data:', workspaceData)
        console.log('Workspace error:', workspaceError)

        if (workspaceError) throw workspaceError
        if (!workspaceData) throw new Error('Workspace not found')

        setWorkspace(workspaceData)
      } catch (err) {
        console.error('Error loading workspace:', err)
        setError(err instanceof Error ? err.message : 'Failed to load workspace')
      } finally {
        setLoading(false)
      }
    }

    loadWorkspace()
  }, [router])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
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

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
} 