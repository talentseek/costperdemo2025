import AuthForm from '@/components/AuthForm'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

/**
 * SignupPage component renders the signup form
 * Uses AuthForm component with signup tab pre-selected
 */
export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[hsl(var(--background))]">
      <div className="w-full max-w-[500px] space-y-6">
        {/* Header with logo and tagline */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            CostPerDemo
          </h1>
          <p className="text-sm text-muted-foreground">
            Grow your B2B SaaS with targeted demos.
          </p>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 text-sm">
            <h2 className="text-md font-semibold mb-2">How to sign up:</h2>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Fill in your email and create a strong password</li>
              <li>Check your email for a verification link</li>
              <li>Click the link to verify your account</li>
              <li>Create your workspace and start using CostPerDemo</li>
            </ol>
            <p className="mt-3 text-muted-foreground">
              Already have an account? <Link href="/login" className="underline">Log in here</Link>
            </p>
          </CardContent>
        </Card>

        <AuthForm defaultTab="signup" />
      </div>
    </main>
  )
} 