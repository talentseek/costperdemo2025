"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const onboardingSteps = [
  { id: "step-1", title: "Company Information" },
  { id: "step-2", title: "Product & Market" },
  { id: "step-3", title: "Sales & Marketing" },
  { id: "step-4", title: "Review" },
]

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState("step-1")
  const [completedSections, setCompletedSections] = useState<string[]>([])

  const handleCompleteSection = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections([...completedSections, sectionId])
    }
  }

  const handleNextStep = () => {
    const currentIndex = onboardingSteps.findIndex((step) => step.id === activeStep)
    if (currentIndex < onboardingSteps.length - 1) {
      setActiveStep(onboardingSteps[currentIndex + 1].id)
    }
  }

  const handlePreviousStep = () => {
    const currentIndex = onboardingSteps.findIndex((step) => step.id === activeStep)
    if (currentIndex > 0) {
      setActiveStep(onboardingSteps[currentIndex - 1].id)
    }
  }

  const currentStepIndex = onboardingSteps.findIndex((step) => step.id === activeStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === onboardingSteps.length - 1

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
      <p className="text-muted-foreground">Complete the following steps to set up your CostPerDemo campaign.</p>

      <Tabs defaultValue="step-1" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {onboardingSteps.map((step) => (
            <TabsTrigger key={step.id} value={step.id}>
              {step.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {onboardingSteps.map((step) => (
          <TabsContent key={step.id} value={step.id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>Complete this section to proceed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-md border border-dashed flex items-center justify-center">
                  <p className="text-muted-foreground">Onboarding form will go here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
} 