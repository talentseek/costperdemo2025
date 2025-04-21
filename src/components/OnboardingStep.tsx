'use client'

import Link from "next/link"
import { CheckCircle, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type OnboardingStatus = "Pending" | "In Progress" | "Submitted" | "Approved" | "Locked" | "Completed"

export interface OnboardingStepProps {
  id?: number
  step?: number
  title: string
  description: string
  status: OnboardingStatus
  action?: {
    text: string
    href: string
    disabled: boolean
  }
  children?: React.ReactNode
}

/**
 * OnboardingStep component displays a single step in the onboarding process
 * Includes step number/checkmark, title, description, status badge, and action button
 */
export function OnboardingStep({ 
  id, 
  step, 
  title, 
  description, 
  status, 
  action, 
  children 
}: OnboardingStepProps) {
  // Use step if provided, otherwise use id
  const displayNumber = step || id || 1;
  
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-gray-200 rounded-full"
              aria-label={`Step ${displayNumber}`}
            >
              {status === "Approved" || status === "Completed" ? (
                <CheckCircle className="w-5 h-5 text-green-500" aria-label="Completed" />
              ) : (
                displayNumber
              )}
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <StepStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600">{description}</p>
        {children}
      </CardContent>
      {action && (
        <CardFooter className="pt-0">
          {status === "Locked" ? (
            <div className="flex items-center text-sm text-gray-500">
              <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
              {action.text}
            </div>
          ) : (
            <Button
              variant={status === "Approved" || status === "Completed" ? "outline" : "default"}
              size="sm"
              className="w-full sm:w-auto"
              disabled={action.disabled}
              asChild
            >
              <Link href={action.href}>
                {action.text}
                {status !== "Approved" && status !== "Completed" && <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />}
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

function StepStatusBadge({ status }: { status: OnboardingStatus }) {
  const getBadgeProps = () => {
    switch (status) {
      case "Approved":
      case "Completed":
        return { className: "bg-green-500 hover:bg-green-600" }
      case "Submitted":
        return { className: "bg-blue-500 hover:bg-blue-600" }
      case "In Progress":
        return { className: "bg-yellow-500 hover:bg-yellow-600" }
      case "Pending":
        return { variant: "outline" as const }
      case "Locked":
        return { variant: "secondary" as const }
    }
  }

  return <Badge {...getBadgeProps()}>{status}</Badge>
} 