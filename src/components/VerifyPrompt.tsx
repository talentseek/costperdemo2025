'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/utils/supabase'

/**
 * VerifyPrompt component handles email verification flow
 * Shows verification status and redirects to workspace creation on success
 */
export default function VerifyPrompt() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const supabase = createBrowserClient()

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      const email = searchParams.get('email')
      if (!email) throw new Error('No email provided')

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (resendError) throw resendError

      // Show success message
      setError('Verification email resent. Please check your inbox.')
    } catch (err) {
      console.error('Error resending verification:', err)
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  useEffect(() => {
    // Check if we have a session when the component mounts
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }

    checkSession()
  }, [router, supabase.auth])

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if we have a hash fragment from Supabase redirect
        if (typeof window !== 'undefined' && window.location.hash) {
          // Get the access_token and refresh_token from the URL fragment
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          
          if (accessToken) {
            // Set the session
            const { data: { user }, error: sessionError } = await supabase.auth.getUser(accessToken)
            
            if (sessionError) throw sessionError
            if (!user?.email_confirmed_at) throw new Error('Email not confirmed')

            setIsVerified(true)
            setIsVerifying(false)
            // Redirect to workspace creation after a short delay
            setTimeout(() => router.push('/workspace'), 2000)
            return
          }
        }

        // If no hash fragment, check query parameters
        const email = searchParams.get('email')
        if (!email) {
          setError('No email provided for verification')
          setIsVerifying(false)
          return
        }

        // Check if the user is already verified
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!userError && user?.email_confirmed_at) {
          setIsVerified(true)
          setIsVerifying(false)
          setTimeout(() => router.push('/workspace'), 2000)
          return
        }

        // If not verified, show waiting screen
        setIsVerifying(false)
        setError('Please check your email and click the verification link.')
      } catch (err) {
        console.error('Verification error:', err)
        
        if (err instanceof Error) {
          if (err.message.includes('Email not confirmed')) {
            setError('Please check your email and click the verification link.')
          } else {
            setError(err.message)
          }
        } else {
          setError('Failed to verify email')
        }
        
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [router, searchParams, supabase.auth])

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="text-center space-y-4">
        {isVerifying ? (
          <>
            <div className="animate-pulse text-2xl mb-4">⌛</div>
            <h2 className="text-xl font-semibold">Verifying your email...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
          </>
        ) : isVerified ? (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Email verified!</h2>
            <p className="text-muted-foreground">Redirecting you to create your workspace...</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Verification needed</h2>
            <p className="text-muted-foreground">Please check your email and click the verification link.</p>
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="pt-4 space-y-2">
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
              <Button
                onClick={() => router.push('/signup')}
                variant="ghost"
                className="w-full"
              >
                Back to Sign Up
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
} 