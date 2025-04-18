import AuthForm from '../../components/AuthForm'

/**
 * SignupPage component renders the signup form
 * Uses AuthForm component with signup tab pre-selected
 */
export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-[hsl(var(--background))]">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header with logo and tagline */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            CostPerDemo
          </h1>
          <p className="text-sm text-muted-foreground">
            Grow your B2B SaaS with targeted demos.
          </p>
        </div>

        <AuthForm defaultTab="signup" />
      </div>
    </main>
  )
} 