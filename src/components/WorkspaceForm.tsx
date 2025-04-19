'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { ModeToggle } from '@/components/mode-toggle'

// Define the schema directly with the type
const _workspaceFormSchema = z.object({
  name: z.string().min(2, { message: "Workspace name must be at least 2 characters" }),
  subdomain: z.string()
    .min(2, { message: "Subdomain must be at least 2 characters" })
    .regex(/^[a-z0-9-]+$/, { message: "Subdomain can only contain lowercase letters, numbers, and hyphens" })
    .optional()
    .or(z.literal(''))
})

// Define type from the schema
type WorkspaceFormValues = z.infer<typeof _workspaceFormSchema>

/**
 * WorkspaceForm component handles workspace creation
 * Creates a workspace record and updates the user's workspace_id through the API
 */
export default function WorkspaceForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<WorkspaceFormValues>({
    defaultValues: {
      name: '',
      subdomain: '',
    },
  })

  const onSubmit = async (data: WorkspaceFormValues) => {
    setIsLoading(true)
    setError("")

    try {
      // Create the request payload
      const payload = {
        companyName: data.name, 
        subdomain: data.subdomain && data.subdomain.trim() !== '' ? data.subdomain : null
      };
      console.log('Sending workspace creation request with payload:', payload);
      
      // Use the API endpoint to create workspace
      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log('Workspace creation API response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create workspace')
      }

      // On success, redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error creating workspace:', err)
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        <Card className="w-full max-w-md">
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-center">Create Your Workspace</h2>
              <p className="text-muted-foreground text-center">
                Set up your company workspace to get started
              </p>
            </div>
            <Progress value={50} className="w-full" />
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Inc."
                  {...form.register("name")}
                  className={form.formState.errors.name ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                {form.formState.errors.name && (
                  <span className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subdomain"
                    placeholder="acme"
                    {...form.register("subdomain")}
                    className={form.formState.errors.subdomain ? "border-destructive" : ""}
                    disabled={isLoading}
                  />
                  <span className="text-muted-foreground">.costperdemo.com</span>
                </div>
                {form.formState.errors.subdomain && (
                  <span className="text-sm text-destructive">
                    {form.formState.errors.subdomain.message}
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Workspace"
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
} 