'use client'

import { useState, useEffect } from 'react'
import { LogOut, Edit, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Workspace {
  id: string
  name: string
  subdomain: string
  created_at: string
}

interface User {
  id: string
  email: string
  role: string
  workspace_id: string
  created_at: string
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch workspaces
      const { data: workspacesData, error: workspacesError } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false })

      if (workspacesError) throw new Error('Failed to fetch workspaces')
      setWorkspaces(workspacesData)

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw new Error('Failed to fetch users')
      setUsers(usersData)
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        [activeTab]: `Error loading ${activeTab}: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to log out. Please try again.')
    }
  }

  const handleDelete = async (type: 'workspace' | 'user', id: string) => {
    try {
      const { error } = await supabase
        .from(type === 'workspace' ? 'workspaces' : 'users')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      if (type === 'workspace') {
        setWorkspaces(prev => prev.filter(w => w.id !== id))
      } else {
        setUsers(prev => prev.filter(u => u.id !== id))
      }

      toast.success(`${type} deleted successfully`)
    } catch (error) {
      toast.error(`Failed to delete ${type}. Please try again.`)
    }
  }

  const handleEdit = (type: 'workspace' | 'user', id: string) => {
    // Placeholder for edit functionality
    toast.info(`Edit ${type} functionality coming soon`)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="text-xl font-bold">CostPerDemo</div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">
                <ExternalLink className="w-4 h-4 mr-2" />
                View as Client
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              <span className="sr-only">Logout</span>
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

            <Tabs defaultValue="workspaces" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              {/* Workspaces Tab */}
              <TabsContent value="workspaces" className="mt-4">
                <div className="overflow-x-auto">
                  {/* Desktop Table */}
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Subdomain</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workspaces.map((workspace) => (
                        <TableRow key={workspace.id}>
                          <TableCell>{workspace.id}</TableCell>
                          <TableCell>{workspace.name}</TableCell>
                          <TableCell>{workspace.subdomain}</TableCell>
                          <TableCell>{format(new Date(workspace.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit('workspace', workspace.id)}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete('workspace', workspace.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Mobile Cards */}
                  <div className="grid gap-4 md:hidden">
                    {workspaces.map((workspace) => (
                      <Card key={workspace.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{workspace.name}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit('workspace', workspace.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete('workspace', workspace.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">ID:</div>
                            <div>{workspace.id}</div>
                            <div className="text-muted-foreground">Subdomain:</div>
                            <div>{workspace.subdomain}</div>
                            <div className="text-muted-foreground">Created:</div>
                            <div>{format(new Date(workspace.created_at), 'MMM d, yyyy')}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="mt-4">
                <div className="overflow-x-auto">
                  {/* Desktop Table */}
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Workspace ID</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.workspace_id}</TableCell>
                          <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit('user', user.id)}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete('user', user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Mobile Cards */}
                  <div className="grid gap-4 md:hidden">
                    {users.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">{user.email}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit('user', user.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete('user', user.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-sm">
                            <div className="text-muted-foreground">ID:</div>
                            <div>{user.id}</div>
                            <div className="text-muted-foreground">Role:</div>
                            <div>{user.role}</div>
                            <div className="text-muted-foreground">Workspace:</div>
                            <div>{user.workspace_id}</div>
                            <div className="text-muted-foreground">Created:</div>
                            <div>{format(new Date(user.created_at), 'MMM d, yyyy')}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 