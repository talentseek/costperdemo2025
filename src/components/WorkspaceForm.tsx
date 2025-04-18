'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'

// Schema for form validation
const workspaceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  subdomain: z.string().optional(),
})

type WorkspaceFormValues = z.infer<typeof workspaceSchema>

/**
 * WorkspaceForm component handles workspace creation
 * Creates a workspace record and updates the user's workspace_id in Supabase
 */
export default function WorkspaceForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<WorkspaceFormValues>({
    defaultValues: {
      companyName: '',
      subdomain: '',
    },
  })

  const onSubmit = async (data: WorkspaceFormValues) => {
    setIsLoading(true)
    setError("")

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(userError.message)
      if (!user) throw new Error('No authenticated user found')

      // Start a transaction by creating the workspace first
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: data.companyName,
          subdomain: data.subdomain || null,
          owner_id: user.id // Set the owner_id to the current user
        })
        .select()
        .single()

      if (workspaceError) throw new Error(workspaceError.message)
      if (!workspace) throw new Error('Failed to create workspace')

      // Check if user record exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .maybeSingle()

      if (userCheckError) throw new Error(userCheckError.message)

      if (!existingUser) {
        // Create new user record if it doesn't exist
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: 'client',
            workspace_id: workspace.id
          })

        if (createUserError) throw new Error(createUserError.message)
      } else {
        // Update existing user's workspace_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ workspace_id: workspace.id })
          .eq('id', user.id)

        if (updateError) throw new Error(updateError.message)
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Error creating workspace:', err)
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[hsl(var(--background))]">
      <div className="w-full max-w-md">
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
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  {...form.register("companyName")}
                  className={form.formState.errors.companyName ? "border-destructive" : ""}
                />
                {form.formState.errors.companyName && (
                  <span className="text-sm text-destructive">
                    {form.formState.errors.companyName.message}
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
                {isLoading ? "Creating..." : "Create Workspace"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
} 