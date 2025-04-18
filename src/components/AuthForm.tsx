'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: signupForm.email,
          password: signupForm.password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify`,
          }
        })

        if (signUpError) throw signUpError

        // Check if email confirmation was sent
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please log in instead.')
        }

        // Redirect to verify page with user ID
        router.push(`/verify?email=${encodeURIComponent(signupForm.email)}&id=${data.user?.id}`)
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
        console.log('Attempting login with:', loginForm.email)
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginForm.email,
          password: loginForm.password,
        })

        if (signInError) {
          console.error('Sign in error:', signInError)
          throw signInError
        }

        console.log('Login successful:', authData)

        // Check if user has a workspace
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('workspace_id, role')
          .eq('id', authData.user.id)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          console.error('User data error:', userError)
          throw userError
        }

        console.log('User data:', userData)

        // Redirect based on role and workspace status
        if (userData?.role === 'admin') {
          console.log('Redirecting admin to /admin')
          router.push('/admin')
        } else if (userData?.workspace_id) {
          console.log('Redirecting to /dashboard')
          router.push('/dashboard')
        } else {
          console.log('Redirecting to /workspace')
          router.push('/workspace')
        }

        // Force a router refresh to update the navigation
        router.refresh()
      } catch (err) {
        console.error('Login error:', err)
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
              {isLoading ? "Loading..." : "Login"}
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
              {isLoading ? "Loading..." : "Create Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 