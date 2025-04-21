"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronRight } from "lucide-react"
import Link from "next/link"

interface OnboardingPromptProps {
  workspace: {
    id: string
    name: string
  }
}

export function OnboardingPrompt({ workspace }: OnboardingPromptProps) {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Onboarding Required</AlertTitle>
        <AlertDescription>
          Please complete the onboarding process to access all features.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Complete Your Onboarding</CardTitle>
          <CardDescription>
            Welcome to {workspace.name}. Please complete your onboarding to unlock all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              Completing your onboarding will help us customize your CostPerDemo experience and
              ensure your campaigns are set up for success.
            </p>
            <p>
              The onboarding process takes approximately 10-15 minutes to complete. You'll need to provide
              information about your company, target audience, and demo requirements.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/onboarding">
              Continue to Onboarding
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-64 blur-sm opacity-50">
          <CardHeader>
            <CardTitle>Recent Demos</CardTitle>
            <CardDescription>Complete onboarding to access</CardDescription>
          </CardHeader>
        </Card>

        <Card className="h-64 blur-sm opacity-50">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Complete onboarding to access</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
} 