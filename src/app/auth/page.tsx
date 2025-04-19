'use client'

import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import { Suspense } from 'react'
import { ModeToggle } from '@/components/mode-toggle'

/**
 * AuthPage component renders the authentication form with tabs
 * The active tab can be controlled via ?tab=login or ?tab=signup in the URL
 */
export default function AuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">CostPerDemo</h1>
          <ModeToggle />
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm text-center mb-6">
          Grow your B2B SaaS with targeted demos.
        </p>
        
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <AuthContent />
        </Suspense>
      </div>
    </div>
  )
}

// Component using useSearchParams wrapped in Suspense
function AuthContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') as 'login' | 'signup' || 'login'
  
  return <AuthForm defaultTab={tab} />
} 