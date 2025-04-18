'use client'

import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/AuthForm'

/**
 * LoginPage component renders the login form
 * Uses AuthForm component with login tab pre-selected
 */
export default function LoginPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">CostPerDemo</h1>
          <p className="text-muted-foreground">
            Sign in to manage your campaigns
          </p>
        </div>

        {message && (
          <div className="p-3 text-sm bg-green-50 text-green-700 rounded-md text-center">
            {message}
          </div>
        )}

        <AuthForm defaultTab="login" />
      </div>
    </div>
  )
} 