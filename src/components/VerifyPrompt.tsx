'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase, COOKIE_NAME } from '@/lib/supabase'

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
  // Save email in component state to use for resending
  const [email, setEmail] = useState<string | null>(null)

  // Extract error messages from URL
  useEffect(() => {
    // Get error from query params or hash
    const urlError = searchParams.get('error_description')
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hashError = hashParams.get('error_description')
    
    if (urlError || hashError) {
      const errorMessage = (urlError || hashError)?.replace(/\+/g, ' ')
      console.log('Error found in URL:', errorMessage)
      setError(errorMessage || 'Verification failed')
      setIsVerifying(false)
    }
    
    // Get email from query params
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to retrieve from localStorage if set previously
      const storedEmail = localStorage.getItem('verificationEmail')
      if (storedEmail) {
        setEmail(storedEmail)
      }
    }
  }, [searchParams])

  const handleResendVerification = async () => {
    try {
      setIsResending(true)
      
      if (!email) {
        throw new Error('No email provided')
      }

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

  // Function to create user record via API endpoint
  const createUserRecord = async () => {
    try {
      console.log('⭐ Calling API to create user record')
      const response = await fetch('/api/auth/create-user-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Include cookies with the request
        cache: 'no-store'
      })
      
      if (!response.ok) {
        console.error('⭐ API error:', response.status, response.statusText)
        return false
      }
      
      try {
        const result = await response.json()
        console.log('⭐ API response:', result)
        return true
      } catch (parseError) {
        console.error('⭐ Error parsing API response:', parseError)
        console.log('⭐ Response text:', await response.text())
        return false
      }
    } catch (error) {
      console.error('⭐ Error creating user record via API:', error)
      return false
    }
  }

  // Function to force redirect to workspace
  const forceRedirectToWorkspace = async () => {
    try {
      console.log('⭐ Forcing redirect to workspace')
      console.log('⭐ Cookie name being used:', COOKIE_NAME)
      
      // First try to ensure user record exists via API
      const apiSuccess = await createUserRecord()
      
      if (!apiSuccess) {
        console.log('⭐ API failed, trying direct database approach')
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('⭐ Error fetching current user:', userError)
          setError('Authentication error. Please try logging in again.')
          return
        }
        
        console.log('⭐ Current user found:', user.email)
        
        // Try to create user record directly
        try {
          // First check if user record exists
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle()
          
          // If error checking or no existing user, try to insert
          if (checkError || !existingUser) {
            console.log('⭐ Creating user record directly')
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email || '',
                role: 'client'
              })
            
            if (insertError) {
              console.error('⭐ Error inserting user record:', insertError)
            } else {
              console.log('⭐ User record created successfully')
            }
          } else {
            console.log('⭐ User record already exists')
          }
        } catch (dbError) {
          console.error('⭐ Database error:', dbError)
        }
      }
      
      // Then redirect regardless of the outcome
      setError('Redirecting to workspace...')
      setTimeout(() => router.push('/workspace'), 500)
    } catch (error) {
      console.error('⭐ Error during force redirect:', error)
      setError('Failed to redirect. Please try again.')
    }
  }

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // First check if there's an error in the URL
        const urlError = searchParams.get('error_description')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashError = hashParams.get('error_description')
        
        if (urlError || hashError) {
          // Already handled in the other useEffect
          return
        }
        
        console.log('⭐ Starting email verification process')
        
        // Check for verification code in the query parameter
        const verificationCode = searchParams.get('code')
        
        if (verificationCode) {
          console.log('⭐ Verification code found in URL:', verificationCode)
          
          try {
            console.log('⭐ Checking for existing session after code verification')
            
            // After email verification, Supabase should have already created a session
            // Just check if we now have a valid session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            
            if (sessionError) {
              console.error('⭐ Error checking session after verification:', sessionError)
              throw sessionError
            }
            
            if (!sessionData.session) {
              console.log('⭐ No session after verification, trying a different approach')
              
              // Try signing in with the stored email if available
              if (email) {
                console.log('⭐ Redirecting to login with stored email')
                router.push(`/login?email=${encodeURIComponent(email)}`)
                return
              }
              
              throw new Error('Verification did not create a session')
            }
            
            console.log('⭐ Found valid session after verification:', {
              user: sessionData.session.user.email,
              expires: new Date(sessionData.session.expires_at! * 1000).toLocaleString()
            })
            
            const user = sessionData.session.user
            
            // Store email for resending if needed
            if (user.email) {
              localStorage.setItem('verificationEmail', user.email)
              setEmail(user.email)
            }
            
            // Try to create a user record
            try {
              // Check if user record already exists
              const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle()
                
              if (checkError) {
                console.error('⭐ Error checking user record:', checkError)
              }
              
              if (!existingUser) {
                console.log('⭐ Creating user record after verification')
                const { error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: user.id,
                    email: user.email || '',
                    role: 'client'
                  })
                  
                if (createError) {
                  console.error('⭐ Error creating user record:', createError)
                } else {
                  console.log('⭐ User record created successfully')
                }
              } else {
                console.log('⭐ User record already exists')
              }
            } catch (dbError) {
              console.error('⭐ Database error:', dbError)
              // Continue despite DB errors
            }
            
            setIsVerified(true)
            setIsVerifying(false)
            
            console.log('⭐ Redirecting to workspace after successful verification')
            router.push('/workspace')
            return
          } catch (codeError) {
            console.error('⭐ Error processing verification code:', codeError)
          }
        }
        
        // Check if we have a hash fragment from Supabase redirect
        if (typeof window !== 'undefined' && window.location.hash) {
          // Get the access_token from the URL fragment
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          console.log('⭐ URL hash found:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken 
          })
          
          if (accessToken) {
            console.log('⭐ Found access token in hash, setting session manually...')
            
            try {
              // Set the access token in the session
              const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || '',
              })
              
              if (setSessionError) {
                console.error('⭐ Error setting session:', setSessionError)
                throw setSessionError
              }
              
              console.log('⭐ Session set successfully:', { 
                hasSession: !!sessionData.session,
                user: sessionData.session?.user.email
              })
              
              // Now get the user data
              const { data: { user }, error: getUserError } = await supabase.auth.getUser()
              
              if (getUserError) {
                console.error('⭐ Error getting user after setting session:', getUserError)
                throw getUserError
              }
              
              if (!user) {
                console.error('⭐ No user returned after setting session')
                throw new Error('No user found after verification')
              }
              
              console.log('⭐ User retrieved:', {
                id: user.id,
                email: user.email,
                emailConfirmed: !!user.email_confirmed_at
              })
              
              if (!user.email_confirmed_at) {
                console.error('⭐ Email is not confirmed yet, despite successful verification')
                throw new Error('Email confirmation failed')
              }
              
              // Store email in localStorage for future use
              if (user.email) {
                localStorage.setItem('verificationEmail', user.email)
                setEmail(user.email)
              }
  
              // Check if the user record exists already
              console.log('⭐ Checking if user record exists for', user.id)
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, workspace_id, role')
                .eq('id', user.id)
                .maybeSingle()
              
              if (userError && userError.code !== 'PGRST116') {
                console.error('⭐ Error checking user record:', userError)
                throw userError
              }
              
              // If no user record, create one
              if (!userData) {
                console.log('⭐ No user record found, creating new user record')
                const { error: createError } = await supabase
                  .from('users')
                  .insert({
                    id: user.id,
                    email: user.email || '',
                    role: 'client' // Default role
                  })
                
                if (createError) {
                  console.error('⭐ Error creating user record:', createError)
                  // Continue anyway - we'll try a different approach
                }
                
                // Double-check that the record was created
                const { data: checkData, error: checkError } = await supabase
                  .from('users')
                  .select('id')
                  .eq('id', user.id)
                  .single()
                  
                if (checkError || !checkData) {
                  console.error('⭐ User record not confirmed:', checkError)
                  // Try one more time with a delay
                  await new Promise(resolve => setTimeout(resolve, 1000))
                  await supabase
                    .from('users')
                    .insert({
                      id: user.id,
                      email: user.email || '',
                      role: 'client'
                    })
                }
              }
              
              setIsVerified(true)
              setIsVerifying(false)
              
              console.log('⭐ Email verified successfully, redirecting to workspace')
              // Force refresh the auth state by getting the session again
              await supabase.auth.getSession()
              
              // Add a delay to ensure the session is fully established
              await new Promise(resolve => setTimeout(resolve, 1000))
              
              // Redirect to workspace creation page for all new users
              router.push('/workspace')
              return
            } catch (tokenError) {
              console.error('⭐ Error handling token verification:', tokenError)
              // Continue to check current session
            }
          }
        }

        // Check if the user is already verified via current session
        console.log('⭐ Checking if user is already verified via current session')
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('⭐ Error getting current session:', sessionError)
          throw sessionError
        }
        
        const session = data.session
        const { data: userData, error: userError } = await supabase.auth.getUser()
        const user = userData?.user
        
        if (session && user) {
          console.log('⭐ Found user in current session:', user.email)
          
          // Store email for resending if needed
          if (user.email) {
            localStorage.setItem('verificationEmail', user.email)
            setEmail(user.email)
          }
          
          if (user.email_confirmed_at) {
            console.log('⭐ User email is already confirmed, redirecting to workspace')
            setIsVerified(true)
            setIsVerifying(false)
            
            // Short delay to show verification success
            await new Promise(resolve => setTimeout(resolve, 1500))
            router.push('/workspace')
            return
          }
        }

        // If still here, show waiting screen
        console.log('⭐ Verification not complete, showing waiting screen')
        setIsVerifying(false)
        if (!email) {
          setError('No email provided for verification. Please try signing up again.')
        } else {
          setError('Please check your email and click the verification link.')
        }
      } catch (err) {
        console.error('⭐ Verification error:', err)
        
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
  }, [router, searchParams, email])

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
                disabled={isResending || !email}
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
              <Button
                onClick={async () => {
                  try {
                    // Force check current session
                    console.log('⭐ Manually checking current session status')
                    
                    // Get the verification code from the URL if available
                    const verificationCode = searchParams.get('code')
                    console.log('⭐ Verification code present:', !!verificationCode)
                    
                    // Check for an existing session
                    const { data, error } = await supabase.auth.getSession()
                    
                    if (error) {
                      console.error('⭐ Session error:', error)
                      setError('Session error: ' + error.message)
                      return
                    }
                    
                    if (data.session) {
                      console.log('⭐ Active session found:', {
                        user: data.session.user.email,
                        expires: data.session.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'unknown'
                      })
                      
                      // Create user record and redirect
                      await forceRedirectToWorkspace()
                    } else {
                      console.log('⭐ No active session found')
                      
                      // Try to log in with stored email
                      if (email) {
                        console.log('⭐ Redirecting to login with stored email')
                        router.push(`/login?email=${encodeURIComponent(email)}`)
                      } else {
                        setError('No active session. Please try logging in again.')
                      }
                    }
                  } catch (err) {
                    console.error('⭐ Manual check error:', err)
                    setError('Error checking session: ' + (err instanceof Error ? err.message : String(err)))
                  }
                }}
                variant="default"
                className="w-full"
              >
                Continue to Workspace
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
} 