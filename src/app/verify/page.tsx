'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VerifyPrompt from '@/components/VerifyPrompt'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

/**
 * VerifyPage component renders the email verification prompt
 * Uses VerifyPrompt component to handle verification flow
 */
export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  
  // Log when the page loads to help with debugging
  useEffect(() => {
    console.log('⭐ Verify page loaded, URL:', window.location.href)
    
    // Log all URL parameters for debugging
    console.log('⭐ URL parameters:')
    searchParams.forEach((value, key) => {
      console.log(`⭐ - ${key}: ${value}`)
    })
    
    // Check for specific auth parameters
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    
    console.log('⭐ Auth parameters:', {
      token: token ? 'present' : 'not found',
      type,
      error,
      error_description
    })
    
    // Check if we have a hash fragment in the URL
    if (window.location.hash) {
      console.log('⭐ Hash fragment found:', window.location.hash)
      
      // Parse hash fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      console.log('⭐ Hash parameters:')
      hashParams.forEach((value, key) => {
        if (key === 'access_token') {
          console.log('⭐ - access_token: [present]')
        } else {
          console.log(`⭐ - ${key}: ${value}`)
        }
      })
      
      // Process the hash parameters if access_token is present
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken) {
        handleAuthCallback(accessToken, refreshToken || '')
      }
    }
    
    // Add hash change listener to catch Supabase auth callback
    const handleHashChange = () => {
      console.log('⭐ URL hash changed:', window.location.hash)
      
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken) {
          handleAuthCallback(accessToken, refreshToken || '')
        }
      }
    }
    
    window.addEventListener('hashchange', handleHashChange)
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [searchParams])
  
  // Handle Supabase auth callback
  const handleAuthCallback = async (accessToken: string, refreshToken: string) => {
    try {
      setIsProcessing(true)
      console.log('⭐ Processing auth callback with tokens')
      
      // Set the session manually
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      
      if (sessionError) {
        console.error('⭐ Error setting session:', sessionError)
        setError(sessionError.message)
        return
      }
      
      console.log('⭐ Session set successfully:', {
        hasUser: !!data?.user,
        email: data?.user?.email,
        emailConfirmed: !!data?.user?.email_confirmed_at
      })
      
      if (!data.user || !data.user.email_confirmed_at) {
        setError('Email verification failed. Please try again.')
        return
      }
      
      // Create user record if needed
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()
        
        if (!userData) {
          console.log('⭐ Creating user record for verified user')
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              role: 'client'
            })
        }
      } catch (dbError) {
        console.error('⭐ Database error (non-fatal):', dbError)
        // Continue even if this fails - middleware will handle it
      }
      
      setSuccess(true)
      setTimeout(() => {
        // Navigate to workspace creation
        console.log('⭐ Redirecting to workspace creation')
        router.push('/workspace')
      }, 2000)
    } catch (error) {
      console.error('⭐ Auth callback error:', error)
      setError('Error processing verification. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // If we see error or success, show a simple UI instead of the full VerifyPrompt
  if (error || success || isProcessing) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {success ? 'Email Verified!' : (isProcessing ? 'Processing...' : 'Verification Error')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {isProcessing ? (
              <div className="flex justify-center my-6">
                <Spinner size="lg" />
              </div>
            ) : success ? (
              <>
                <p className="text-green-600">Your email has been verified successfully!</p>
                <p>Redirecting to workspace creation...</p>
              </>
            ) : (
              <>
                <p className="text-red-500">{error}</p>
                <Button 
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  Return to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <VerifyPrompt />
    </main>
  )
} 