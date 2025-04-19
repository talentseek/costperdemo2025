'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase, COOKIE_NAME } from '@/lib/supabase'
import { Card } from "@/components/ui/card"
import { Spinner } from '@/components/ui/spinner'

interface FormState {
  email: string
  password: string
  confirmPassword?: string
}

interface FormErrors {
  signupEmail: string
  signupPassword: string
  signupConfirmPassword: string
  loginEmail: string
  loginPassword: string
  signupSuccess?: string
}

interface AuthFormProps {
  defaultTab?: "login" | "signup"
}

/**
 * AuthForm component handles user authentication with email/password
 * Supports both signup (with email verification) and login flows
 * Uses Supabase Auth and follows mobile-first design principles
 */
export default function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [signupForm, setSignupForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loginForm, setLoginForm] = useState<FormState>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({
    signupEmail: '',
    signupPassword: '',
    signupConfirmPassword: '',
    loginEmail: '',
    loginPassword: '',
  })

  // Pre-fill email from URL parameter or localStorage
  useEffect(() => {
    // Check for email in URL parameters
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    
    if (emailParam) {
      console.log('⭐ Using email from URL parameter:', emailParam)
      setLoginForm(prev => ({ ...prev, email: emailParam }))
      setSignupForm(prev => ({ ...prev, email: emailParam }))
    } else {
      // Try to get email from localStorage
      const storedEmail = localStorage.getItem('verificationEmail')
      if (storedEmail) {
        console.log('⭐ Using email from localStorage:', storedEmail)
        setLoginForm(prev => ({ ...prev, email: storedEmail }))
        setSignupForm(prev => ({ ...prev, email: storedEmail }))
      }
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignupForm((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (name === 'email') {
      setErrors((prev) => ({ ...prev, signupEmail: '' }))
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, signupPassword: '' }))
    } else if (name === 'confirmPassword') {
      setErrors((prev) => ({ ...prev, signupConfirmPassword: '' }))
    }
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (name === 'email') {
      setErrors((prev) => ({ ...prev, loginEmail: '' }))
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, loginPassword: '' }))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true
    const newErrors = { ...errors }

    // Validate email
    if (!signupForm.email) {
      newErrors.signupEmail = 'Email is required'
      valid = false
    } else if (!validateEmail(signupForm.email)) {
      newErrors.signupEmail = 'Please enter a valid email'
      valid = false
    }

    // Validate password
    if (!signupForm.password) {
      newErrors.signupPassword = 'Password is required'
      valid = false
    } else if (signupForm.password.length < 8) {
      newErrors.signupPassword = 'Password must be at least 8 characters'
      valid = false
    }

    // Validate password confirmation
    if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.signupConfirmPassword = 'Passwords do not match'
      valid = false
    }

    setErrors(newErrors)

    if (valid) {
      setIsLoading(true)
      try {
        // Generate the site URL from the current window location
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const redirectUrl = `${siteUrl}/verify`
        console.log('⭐ Signup debug - Using redirect URL:', redirectUrl)
        
        // Store email in localStorage for verification purposes
        localStorage.setItem('verificationEmail', signupForm.email)
        
        // Print more debug info
        console.log('⭐ Signup debug - Current URL:', window.location.href)
        console.log('⭐ Signup debug - Current origin:', window.location.origin)
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: signupForm.email,
          password: signupForm.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              // Add additional user metadata if needed
              signup_source: 'website',
            },
          }
        })

        if (signUpError) {
          console.error('⭐ Signup error from Supabase:', signUpError)
          throw new Error(signUpError.message || 'Failed to sign up. Please try again.')
        }

        if (!data?.user) {
          throw new Error('No user data returned from signup. Please try again.')
        }

        console.log('⭐ Signup debug - Response:', {
          userId: data.user.id,
          userEmail: data.user.email,
          emailConfirmed: data.user.email_confirmed_at !== null,
          identitiesLength: data.user.identities?.length,
          identities: data.user.identities
        })

        // Check if the user already exists but doesn't have a confirmed email
        if (data.user.identities && data.user.identities.length === 0) {
          throw new Error('This email is already registered. Please log in instead.')
        }

        // Check if email is already confirmed (unlikely during signup)
        if (data.user.email_confirmed_at) {
          console.log('⭐ Email already confirmed, redirecting to workspace')
          // Create user record in database
          const { error: createUserError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email || '',
              role: 'client' // Default role
            })
          
          if (createUserError) {
            console.error('⭐ Error creating user record:', createUserError)
          }
          
          router.push('/workspace')
          return
        }

        // Set success message
        setErrors(prev => ({
          ...prev,
          signupEmail: '',
          signupSuccess: 'Check your email for the verification link to complete signup.' 
        }))

        // Add small delay to show success message before redirecting
        setTimeout(() => {
          // Redirect to verify page with email parameter
          router.push(`/verify?email=${encodeURIComponent(signupForm.email)}`)
        }, 1500)
      } catch (err) {
        console.error('Signup error:', err)
        setErrors(prev => ({
          ...prev,
          signupEmail: err instanceof Error ? err.message : 'An error occurred during signup'
        }))
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Function to attempt creating a user record via API
  const createUserRecordViaApi = async (userId: string) => {
    try {
      console.log('⭐ Calling API to create user record')
      
      // Use the exported cookie name
      console.log('⭐ Using cookie name:', COOKIE_NAME)
      
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
        
        // If unauthorized, try direct database approach immediately
        if (response.status === 401) {
          console.log('⭐ API returned 401, attempting direct database creation')
          return false
        }
        
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    let valid = true
    const newErrors = { ...errors }

    // Validate email
    if (!loginForm.email) {
      newErrors.loginEmail = 'Email is required'
      valid = false
    } else if (!validateEmail(loginForm.email)) {
      newErrors.loginEmail = 'Please enter a valid email'
      valid = false
    }

    // Validate password
    if (!loginForm.password) {
      newErrors.loginPassword = 'Password is required'
      valid = false
    }

    setErrors(newErrors)

    if (valid) {
      setIsLoading(true)
      try {
        console.log('⭐ Attempting login with:', loginForm.email)
        
        // Sign in with password
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginForm.email,
          password: loginForm.password,
        })

        if (signInError) {
          console.error('⭐ Sign in error:', signInError)
          throw signInError
        }

        console.log('⭐ Login successful for user:', {
          id: authData.user.id,
          email: authData.user.email,
          emailConfirmed: authData.user.email_confirmed_at ? 'yes' : 'no'
        })

        // Double-check that we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('⭐ Failed to get session after login:', sessionError)
          throw new Error('Authentication succeeded but session creation failed. Please try again.')
        }
        
        console.log('⭐ Session confirmed after login:', {
          id: session.user.id,
          aud: session.user.aud,
          exp: new Date(session.expires_at! * 1000).toLocaleString()
        })

        // Store email in local storage
        localStorage.setItem('verificationEmail', authData.user.email || '')

        // Check if this is a new user that has just verified their email
        // In this case, they might not have a record in the users table yet
        const isNewlyVerifiedUser = authData.user.email_confirmed_at && 
          (new Date().getTime() - new Date(authData.user.email_confirmed_at).getTime() < 5 * 60 * 1000)
          
        if (isNewlyVerifiedUser) {
          console.log('⭐ Recently verified user detected')
        }

        // Attempt to create user record via API (this will be idempotent)
        const apiSuccess = await createUserRecordViaApi(authData.user.id)
        
        // If API succeeded, we can proceed with confidence
        if (apiSuccess) {
          console.log('⭐ User record confirmed via API')
          // Check if user has record in database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('workspace_id, role')
            .eq('id', authData.user.id)
            .single()
            
          if (userError) {
            // Should not happen since API should have created the record
            console.error('⭐ Unexpected user data error after API success:', userError)
            // Continue to workspace creation as fallback
            await new Promise(resolve => setTimeout(resolve, 500))
            router.push('/workspace')
            return
          }
          
          // Add a small delay to ensure the session is fully committed before redirecting
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Redirect based on role and workspace status
          if (userData?.role === 'admin') {
            console.log('⭐ Redirecting admin to /admin')
            router.push('/admin')
          } else if (userData?.workspace_id) {
            console.log('⭐ Redirecting to /dashboard')
            router.push('/dashboard')
          } else {
            // If no workspace_id, redirect to workspace creation
            console.log('⭐ No workspace found, redirecting to /workspace')
            router.push('/workspace')
          }
          
          // Force refresh the router to update the UI
          router.refresh()
          return
        }
        
        // If API failed, fall back to direct database check
        console.log('⭐ Falling back to direct database check')

        // Check if user has a workspace record in our database
        console.log('⭐ Checking if user has a record in database')
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('workspace_id, role')
            .eq('id', authData.user.id)
            .single()

          if (userError) {
            // If the user record doesn't exist in the database, create it
            if (userError.code === 'PGRST116') { // No rows returned error
              console.log('⭐ User record not found, creating with default client role')
              
              // Ensure we have a valid user ID and email
              if (!authData.user.id || !authData.user.email) {
                throw new Error('Missing user ID or email for database record creation')
              }
              
              // Create user record with client role
              await supabase
                .from('users')
                .insert({
                  id: authData.user.id,
                  email: authData.user.email || '',
                  role: 'client' // Default role
                })
              
              console.log('⭐ User record created, directing to workspace creation')
              // Add a small delay to ensure the database update has propagated
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // For newly verified users or users without a workspace, go to workspace creation
              router.push('/workspace')
              return
            } else {
              console.error('⭐ User data error:', userError)
              throw userError
            }
          }

          console.log('⭐ User data found:', userData)

          // Add a small delay to ensure the session is fully committed before redirecting
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Redirect based on role and workspace status
          if (userData?.role === 'admin') {
            console.log('⭐ Redirecting admin to /admin')
            router.push('/admin')
          } else if (userData?.workspace_id) {
            console.log('⭐ Redirecting to /dashboard')
            router.push('/dashboard')
          } else {
            // If no workspace_id, redirect to workspace creation even for existing users
            console.log('⭐ No workspace found, redirecting to /workspace')
            router.push('/workspace')
          }
          
          // Force refresh the router to update the UI
          router.refresh()
        } catch (dbError) {
          console.error('⭐ Error during database operations:', dbError)
          // If all else fails, just redirect to workspace page
          console.log('⭐ Redirecting to workspace page as fallback')
          router.push('/workspace')
        }
      } catch (err) {
        console.error('⭐ Login error:', err)
        setErrors(prev => ({
          ...prev,
          loginEmail: err instanceof Error ? err.message : 'An error occurred during login'
        }))
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Card className="w-full max-w-md p-0 overflow-hidden">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-none">
          <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-background">Login</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-none data-[state=active]:bg-background">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="m-0">
          <form onSubmit={handleLogin} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="loginEmail">Email</Label>
              <Input
                id="loginEmail"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="m@example.com"
                value={loginForm.email}
                onChange={handleLoginChange}
                className={errors.loginEmail ? "ring-2 ring-red-500" : ""}
              />
              {errors.loginEmail && (
                <div className="flex items-center gap-x-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.loginEmail}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <Input
                id="loginPassword"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={handleLoginChange}
                className={errors.loginPassword ? "ring-2 ring-red-500" : ""}
              />
              {errors.loginPassword && (
                <div className="flex items-center gap-x-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.loginPassword}</p>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mx-auto" /> : "Login"}
            </Button>
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-800 underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="signup" className="m-0">
          <form onSubmit={handleSignup} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="signupEmail">Email</Label>
              <Input
                id="signupEmail"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="m@example.com"
                value={signupForm.email}
                onChange={handleSignupChange}
                className={errors.signupEmail ? "ring-2 ring-red-500" : ""}
              />
              {errors.signupEmail && (
                <div className="flex items-center gap-x-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.signupEmail}</p>
                </div>
              )}
              {errors.signupSuccess && (
                <div className="flex items-center gap-x-2 text-sm text-green-500 mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <p>{errors.signupSuccess}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="signupPassword">Password</Label>
              <Input
                id="signupPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                value={signupForm.password}
                onChange={handleSignupChange}
                className={errors.signupPassword ? "ring-2 ring-red-500" : ""}
              />
              {errors.signupPassword && (
                <div className="flex items-center gap-x-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.signupPassword}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={signupForm.confirmPassword}
                onChange={handleSignupChange}
                className={errors.signupConfirmPassword ? "ring-2 ring-red-500" : ""}
              />
              {errors.signupConfirmPassword && (
                <div className="flex items-center gap-x-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <p>{errors.signupConfirmPassword}</p>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mx-auto" /> : "Create Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 