'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClientComponentClient } from '@/utils/supabase'
import { Card } from "@/components/ui/card"

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
}

interface AuthFormProps {
  defaultTab?: "login" | "signup"
}

/**
 * Common error messages for authentication
 */
const ERROR_MESSAGES: Record<string, string> = {
  'auth_error': 'Authentication failed. Please login again.',
  'session_error': 'Your session has expired. Please login again.',
  'db_error': 'Database error occurred. Please try again.',
  'middleware_error': 'An error occurred. Please try again.',
  'user_creation_failed': 'Failed to create user. Please try again.',
  'callback_error': 'Error during authentication. Please try again.'
}

/**
 * AuthForm component handles user authentication with email/password
 * Supports both signup (with email verification) and login flows
 * Uses Supabase Auth and follows mobile-first design principles
 */
export default function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const params = useSearchParams()
  const router = useRouter()
  const [_formTab, setActiveTab] = useState(defaultTab)
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

  const supabase = createClientComponentClient()
  
  // Use searchParams to get the active tab
  const _activeTab = params?.get('tab') || 'login'

  // Handle URL parameters for errors and redirects
  useEffect(() => {
    const errorParam = params.get('error')
    if (errorParam) {
      // Set the form tab to login when error is in URL
      setActiveTab('login')
      
      // Set the error message
      setErrors(prev => ({
        ...prev,
        loginEmail: ERROR_MESSAGES[errorParam] || 'An error occurred. Please try again.'
      }))
    }
    
    // Store redirect parameter if present
    const redirectTo = params.get('redirectTo')
    if (redirectTo) {
      sessionStorage.setItem('redirectTo', redirectTo)
    }
  }, [params])

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  // Handle form input changes with error clearing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, formType: 'login' | 'signup') => {
    const { name, value } = e.target
    
    if (formType === 'signup') {
      setSignupForm(prev => ({ ...prev, [name]: value }))
    } else {
      setLoginForm(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear error for the field being edited
    const errorField = formType === 'signup' 
      ? `signup${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof FormErrors
      : `login${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof FormErrors;
      
    setErrors(prev => ({ ...prev, [errorField]: '' }))
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
        // Create the full redirect URL
        const redirectUrl = new URL('/api/auth/callback', window.location.origin)
        redirectUrl.searchParams.set('redirectTo', '/verify/success')
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: signupForm.email,
          password: signupForm.password,
          options: {
            emailRedirectTo: redirectUrl.toString(),
          }
        })

        if (signUpError) throw signUpError

        // Check if email confirmation was sent
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please log in instead.')
        }

        // Redirect to verify page with user's email to allow resending verification
        router.push(`/verify?email=${encodeURIComponent(signupForm.email)}`)
      } catch (err) {
        setErrors(prev => ({
          ...prev,
          signupEmail: err instanceof Error ? err.message : 'An error occurred during signup'
        }))
      } finally {
        setIsLoading(false)
      }
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
        // Use the API route for login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm),
          credentials: 'include', // Important to include cookies
        })
        
        // Check if the response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Non-JSON response:', text)
          throw new Error('Server returned an invalid response')
        }
        
        const data = await response.json()
        
        if (!response.ok) {
          // Format user-friendly error message
          let errorMsg = data.error || 'Login failed'
          
          if (errorMsg.includes('Invalid login credentials') || 
              errorMsg.includes('email or password')) {
            errorMsg = 'The email or password you entered is incorrect.'
          } else if (errorMsg.includes('verify your email')) {
            errorMsg = 'Please check your email and click the verification link before logging in.'
          }
          
          setErrors(prev => ({ ...prev, loginEmail: errorMsg }))
          return
        }
        
        // Use the data from the API response
        const userData = data.user
        
        // Determine redirect based on user role & workspace
        let redirectPath = '/workspace'
        
        if (userData?.workspace_id) {
          // Check for stored redirect path or use dashboard
          redirectPath = sessionStorage.getItem('redirectTo') || '/dashboard'
          sessionStorage.removeItem('redirectTo') // Clear after use
        } else if (userData?.role === 'admin') {
          redirectPath = '/admin'
        }
        
        // Force reload to ensure we have the correct session
        window.location.href = redirectPath
      } catch (err) {
        console.error('Login error:', err)
        setErrors(prev => ({
          ...prev,
          loginEmail: err instanceof Error 
            ? err.message 
            : 'Could not connect to the server. Please check your internet connection.'
        }))
        
        // Clear any existing partial session data
        sessionStorage.removeItem('redirectTo')
        supabase.auth.signOut()
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Error display component to reduce duplication
  const ErrorMessage = ({ message }: { message: string }) => (
    message ? (
      <div className="flex items-center gap-x-2 text-sm text-red-500">
        <AlertCircle className="h-4 w-4" />
        <p>{message}</p>
      </div>
    ) : null
  )

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
                onChange={(e) => handleInputChange(e, 'login')}
                className={errors.loginEmail ? "ring-2 ring-red-500" : ""}
                disabled={isLoading}
              />
              <ErrorMessage message={errors.loginEmail} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginPassword">Password</Label>
              <Input
                id="loginPassword"
                name="password"
                type="password"
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) => handleInputChange(e, 'login')}
                className={errors.loginPassword ? "ring-2 ring-red-500" : ""}
                disabled={isLoading}
              />
              <ErrorMessage message={errors.loginPassword} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
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
                onChange={(e) => handleInputChange(e, 'signup')}
                className={errors.signupEmail ? "ring-2 ring-red-500" : ""}
                disabled={isLoading}
              />
              <ErrorMessage message={errors.signupEmail} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signupPassword">Password</Label>
              <Input
                id="signupPassword"
                name="password"
                type="password"
                autoComplete="new-password"
                value={signupForm.password}
                onChange={(e) => handleInputChange(e, 'signup')}
                className={errors.signupPassword ? "ring-2 ring-red-500" : ""}
                disabled={isLoading}
              />
              <ErrorMessage message={errors.signupPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={signupForm.confirmPassword}
                onChange={(e) => handleInputChange(e, 'signup')}
                className={errors.signupConfirmPassword ? "ring-2 ring-red-500" : ""}
                disabled={isLoading}
              />
              <ErrorMessage message={errors.signupConfirmPassword} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 