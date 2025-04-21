'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export default function LogoutPage() {
  const [message, setMessage] = useState('Logging out...')
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Call the logout API
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Logout failed')
        }

        // Redirect to login page
        setMessage('Logout successful! Redirecting...')
        
        // Short delay to show the success message
        setTimeout(() => {
          window.location.href = '/auth?tab=login'
        }, 1000)
      } catch (error) {
        console.error('Logout error:', error)
        setMessage('Logout failed. Redirecting to login...')
        
        // Redirect anyway after a short delay
        setTimeout(() => {
          window.location.href = '/auth?tab=login'
        }, 2000)
      }
    }

    performLogout()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 text-center">
        <h1 className="text-2xl font-bold">CostPerDemo</h1>
        <div className="flex flex-col items-center space-y-4">
          <Spinner className="w-8 h-8" />
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
} 