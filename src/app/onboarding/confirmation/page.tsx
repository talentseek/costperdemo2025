'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase/client'
import { Spinner } from "@/components/ui/spinner"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function ConfirmationPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        if (!session) {
          // Redirect to login if not authenticated
          router.push('/auth?tab=login')
          return
        }

        // Get user data using API route instead of direct query
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch user data')
        }
        
        const userData = await response.json()
        
        // Redirect to dashboard if not a client user
        if (userData.role !== 'client') {
          router.push('/dashboard')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Authentication error:', error)
        toast({
          title: "Authentication Error",
          description: "Please log in again to continue.",
          variant: "destructive"
        })
        router.push('/auth?tab=login')
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center text-center">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-green-600"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your onboarding information has been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Our team will review your information and begin setting up your campaign. You'll receive
            updates on your dashboard as we progress.
          </p>
          <p className="font-medium text-muted-foreground">
            Feel free to explore your dashboard while we get things ready.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="w-full"
          >
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => router.push('/onboarding')} 
            variant="outline" 
            className="w-full"
          >
            Update Information
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 