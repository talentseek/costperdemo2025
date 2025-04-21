'use client'

import { Calendar, Check, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface OnboardingConfirmationProps {
  calendarUrl?: string
  dashboardUrl?: string
}

/**
 * Confirmation component shown after a user completes onboarding
 * Provides options to book a call or return to dashboard
 */
export function OnboardingConfirmation({
  calendarUrl = "https://cal.com/costperdemo/strategy-call",
  dashboardUrl = "/dashboard"
}: OnboardingConfirmationProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="flex flex-col items-center justify-center pt-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100" aria-hidden="true">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Submission Received!</h1>
        </CardHeader>
        <CardContent className="px-6 text-center sm:px-8">
          <p className="text-muted-foreground">
            Thank you for submitting your onboarding information! Our team will review your details and reach out soon.
            Want to discuss your campaign strategy? Book a call with us!
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 px-6 pb-8 sm:flex-row sm:justify-center sm:px-8">
          <Button asChild className="w-full sm:w-auto">
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-2 h-4 w-4" />
              Book a Call
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={dashboardUrl}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 