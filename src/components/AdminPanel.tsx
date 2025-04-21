'use client'

import { useState, useEffect } from 'react'
import { LogOut, Edit, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { handleLogout } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'

interface Workspace {
  id: string
  name: string
  subdomain: string
  created_at: string
  owner?: {
    id: string
    email: string
  } | null
}

interface User {
  id: string
  email: string
  role: string
  workspace_id: string
  created_at: string
  workspace?: {
    id: string
    name: string
    subdomain: string
  } | null
}

interface ErrorState {
  [key: string]: string | undefined
  workspaces?: string
  users?: string
  action?: string
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('workspaces')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [errors, setErrors] = useState<ErrorState>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Define fetchData inside useEffect to avoid dependency warning
    const fetchData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchWorkspaces(), fetchUsers()])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, []) // fetchData is defined inside useEffect, so it doesn't need to be a dependency

  const fetchWorkspaces = async () => {
    try {
      // Fetch workspaces using API endpoint
      console.log('Fetching workspaces for admin panel')
      const workspacesResponse = await fetch('/api/admin/workspaces')
      
      if (!workspacesResponse.ok) {
        const _error = await workspacesResponse.json()
        console.error('Error response from workspaces API:', _error)
        throw new Error(_error.error || 'Failed to fetch workspaces')
      }
      
      const workspacesData = await workspacesResponse.json()
      console.log(`Received ${workspacesData.workspaces?.length || 0} workspaces:`, workspacesData)
      setWorkspaces(workspacesData.workspaces || [])
      
      // Show note about RLS if present
      if (workspacesData.note) {
        console.warn(workspacesData.note)
        toast.warning(workspacesData.note)
      }
    } catch (error) {
      console.error('Error in fetchWorkspaces:', error)
      setErrors(prev => ({
        ...prev,
        workspaces: `Error loading workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      // Show toast for better visibility
      toast.error('Failed to load workspaces. Please try again later.')
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch users using API endpoint
      console.log('Fetching users for admin panel')
      const usersResponse = await fetch('/api/admin/users')
      
      if (!usersResponse.ok) {
        const _error = await usersResponse.json()
        console.error('Error response from users API:', _error)
        throw new Error(_error.error || 'Failed to fetch users')
      }
      
      const usersData = await usersResponse.json()
      console.log(`Received ${usersData.users?.length || 0} users`)
      setUsers(usersData.users || [])
      
      // Show note about RLS if present
      if (usersData.note) {
        console.warn(usersData.note)
        toast.warning(usersData.note)
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error)
      setErrors(prev => ({
        ...prev,
        users: `Error loading users: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      // Show toast for better visibility
      toast.error('Failed to load users. Please try again later.')
    }
  }

  const onLogout = async () => {
    handleLogout(
      router,
      setLoading,
      (_error) => {
        setErrors(prev => ({
          ...prev,
          action: 'Failed to log out. Please try again.'
        }));
        toast.error('Failed to log out. Please try again.');
      }
    );
  };

  const handleDelete = async (type: 'workspace' | 'user', id: string) => {
    try {
      const response = await fetch(`/api/admin/${type === 'workspace' ? 'workspaces' : 'users'}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete ${type}`)
      }

      // Update local state
      if (type === 'workspace') {
        setWorkspaces(prev => prev.filter(w => w.id !== id))
      } else {
        setUsers(prev => prev.filter(u => u.id !== id))
      }

      toast.success(`${type} deleted successfully`)
    } catch (_err) {
      // Log error and show toast notification
      toast.error(`Failed to delete ${type}. Please try again.`)
    }
  }

  const handleEdit = (type: 'workspace' | 'user', _id: string) => {
    // Placeholder for edit functionality
    toast.info(`Edit ${type} functionality coming soon`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="text-xl font-bold">CostPerDemo</div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">
                <ExternalLink className="w-4 h-4 mr-2" />
                View as Client
              </a>
            </Button>
            <Button variant="destructive" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container p-4 mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            {errors[activeTab] && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors[activeTab]}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner className="mr-2" />
                <p>Loading...</p>
              </div>
            ) : (
              <Tabs defaultValue="workspaces" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                {/* Workspaces Tab */}
                <TabsContent value="workspaces" className="mt-4">
                  <div className="overflow-x-auto">
                    {workspaces.length > 0 ? (
                      <>
                        {/* Desktop Table */}
                        <Table className="hidden md:table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Subdomain</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {workspaces.map((workspace) => (
                              <TableRow key={workspace.id}>
                                <TableCell className="max-w-[100px] truncate">{workspace.id}</TableCell>
                                <TableCell>{workspace.name}</TableCell>
                                <TableCell>{workspace.subdomain}</TableCell>
                                <TableCell>{workspace.owner?.email || 'N/A'}</TableCell>
                                <TableCell>{format(new Date(workspace.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit('workspace', workspace.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete('workspace', workspace.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                          {workspaces.map((workspace) => (
                            <Card key={workspace.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium">{workspace.name}</div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit('workspace', workspace.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete('workspace', workspace.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Subdomain: {workspace.subdomain}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Owner: {workspace.owner?.email || 'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Created: {format(new Date(workspace.created_at), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  ID: {workspace.id}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">No workspaces found</div>
                    )}
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-4">
                  <div className="overflow-x-auto">
                    {users.length > 0 ? (
                      <>
                        {/* Desktop Table */}
                        <Table className="hidden md:table">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Workspace</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.workspace?.name || 'None'}</TableCell>
                                <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit('user', user.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete('user', user.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {/* Mobile Cards */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                          {users.map((user) => (
                            <Card key={user.id}>
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="font-medium">{user.email}</div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit('user', user.id)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete('user', user.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Role: {user.role}
                                </div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Workspace: {user.workspace?.name || 'None'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Created: {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">No users found</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 