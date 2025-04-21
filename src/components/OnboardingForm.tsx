'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, SubmitHandler } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProgressBar } from "@/components/ProgressBar"
import { OnboardingStep } from "@/components/OnboardingStep"
import { OnboardingConfirmation } from "@/components/OnboardingConfirmation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

// Define the schema for onboarding data
const onboardingSchema = z.object({
  workspace_id: z.string().uuid(),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  product_description_short: z.string().min(10, "Please provide a more detailed description").max(500, "Product description must be less than 500 characters"),
  usp: z.string().min(10, "Please provide a more detailed unique selling proposition").max(300, "Unique selling proposition must be less than 300 characters"),
  icp_persona: z.string().min(10, "Please describe your ideal customer persona").max(500, "Ideal customer persona must be less than 500 characters"),
  icp_pains_needs: z.string().min(10, "Please describe your customer's pain points").max(500, "Customer pains & needs must be less than 500 characters"),
  lead_magnet_ideas: z.string().min(10, "Please provide some lead magnet ideas").max(500, "Lead magnet ideas must be less than 500 characters"),
  status: z.enum(["not_started", "in_progress", "completed", "submitted"]).default("not_started"),
})

// Derive TypeScript type from the schema
export type OnboardingData = z.infer<typeof onboardingSchema>

// Define the steps in the onboarding process
const onboardingSteps = [
  {
    id: "basics",
    title: "Basic Information",
    description: "Let's start with some basic information about you and your company.",
    fields: ["first_name", "last_name", "email", "company_name"],
  },
  {
    id: "product",
    title: "Product Details",
    description: "Tell us about your product or service and what makes it unique.",
    fields: ["product_description_short", "usp"],
  },
  {
    id: "audience",
    title: "Target Audience",
    description: "Describe your ideal customer and their needs.",
    fields: ["icp_persona", "icp_pains_needs"],
  },
  {
    id: "strategy",
    title: "Lead Generation",
    description: "What kind of content would attract your ideal customers?",
    fields: ["lead_magnet_ideas"],
  },
]

// Define textarea styling for consistency 
const textareaBaseClass = "min-h-[150px] resize-none bg-white dark:bg-slate-900 border-2 shadow-sm"

export function OnboardingForm({
  workspaceId,
  initialStep = 1
}: {
  workspaceId: string
  initialStep?: number
}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isLoading, setIsLoading] = useState(false)
  const [existingData, setExistingData] = useState<OnboardingData | null>(null)
  const router = useRouter()

  // Initialize form with default values
  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      workspace_id: workspaceId,
      first_name: "",
      last_name: "",
      email: "",
      company_name: "",
      product_description_short: "",
      usp: "",
      icp_persona: "",
      icp_pains_needs: "",
      lead_magnet_ideas: "",
      status: "in_progress" as const,
    },
  })

  // Fetch existing onboarding data if available
  useEffect(() => {
    async function fetchOnboardingData() {
      try {
        const response = await fetch(`/api/onboarding?workspace_id=${workspaceId}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data) {
            // Reset form with existing data
            form.reset(data)
            setExistingData(data)
            
            // If user has already submitted, redirect to confirmation
            if (data.status === "submitted") {
              router.push('/onboarding/confirmation')
            }
          }
        }
      } catch (error) {
        console.error("Error fetching onboarding data:", error)
      }
    }

    fetchOnboardingData()
  }, [workspaceId, form, router])

  // Function to determine if a field is valid
  const isStepComplete = (stepIndex: number) => {
    const stepFields = onboardingSteps[stepIndex].fields
    if (stepFields.length === 0) return true

    return stepFields.every(field => {
      // Get the field value
      const fieldValue = form.getValues(field as keyof OnboardingData)
      // Check if the field has a value
      return fieldValue && fieldValue.length > 0
    })
  }

  // Function to determine if form is complete for submission
  const isFormComplete = () => {
    return onboardingSteps.slice(0, -1).every((_, index) => isStepComplete(index))
  }

  // Handle form submission
  const onSubmit: SubmitHandler<OnboardingData> = async (data) => {
    if (currentStep < onboardingSteps.length - 1) {
      // Just go to next step if not on the final step
      setCurrentStep(currentStep + 1)
      return
    }

    // On the final step, we would normally submit the data
    try {
      setIsLoading(true)
      
      // Set status to submitted
      data.status = "submitted"
      
      // Log the data but don't actually submit to the database
      console.log('Would submit onboarding data:', data)
      
      // Show success message
      toast({
        title: "Onboarding Submitted",
        description: "Your onboarding information has been submitted successfully!",
      })

      // Redirect to confirmation page
      router.push('/onboarding/confirmation')
    } catch (error) {
      console.error('Error submitting onboarding:', error)
      toast({
        title: "Submission Failed",
        description: "There was a problem submitting your information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle auto-save as user progresses
  const handleSaveProgress = async () => {
    try {
      const data = form.getValues();
      data.status = "in_progress";
      
      // Just log the data without actually saving to database
      console.log('Would save progress:', data);
      
      // Return success without making the API call
      toast({
        title: "Progress Saved",
        description: "Your progress has been saved.",
      });
      
      return true; // Return success to allow navigation to continue
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Save Failed",
        description: "There was a problem saving your progress.",
        variant: "destructive",
      });
      
      return false; // Return failure
    }
  }

  // Update URL when changing steps
  useEffect(() => {
    // Only update if the current step differs from URL
    if (currentStep !== initialStep) {
      // Update URL without full page reload
      router.push(`/onboarding?step=${currentStep}`, { scroll: false });
    }
  }, [currentStep, initialStep, router]);

  // Current step data
  const currentStepData = onboardingSteps[currentStep - 1]

  // Render review form in the final step
  function renderReview() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">First Name</p>
                <p>{form.getValues("first_name")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Name</p>
                <p>{form.getValues("last_name")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Email</p>
                <p>{form.getValues("email")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Company Information</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Company Name</p>
                <p>{form.getValues("company_name")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Product Information</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Product Description</p>
                <p>{form.getValues("product_description_short")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unique Selling Proposition</p>
                <p>{form.getValues("usp")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Customer Information</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Ideal Customer Profile</p>
                <p>{form.getValues("icp_persona")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer Pains & Needs</p>
                <p>{form.getValues("icp_pains_needs")}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Lead Generation</h3>
            <div className="grid gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Lead Magnet Ideas</p>
                <p>{form.getValues("lead_magnet_ideas")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <Card className="flex flex-col overflow-hidden max-h-[90vh]">
        <CardHeader className="flex-none">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
              <CardDescription className="mt-1">{currentStepData.description}</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium">
              Step {currentStep} of {onboardingSteps.length}
            </div>
          </div>
          
          <div className="flex w-full h-2 bg-muted mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-primary transition-all duration-300" 
              style={{ width: `${(currentStep / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <CardContent className="overflow-y-auto flex-1 pb-6">
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 mb-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  Please fill in all fields below. The highlighted boxes are where you should enter your information.
                </p>
              </div>
              {currentStep < onboardingSteps.length ? (
                <div className="space-y-6 mb-8">
                  {currentStepData.fields.includes("first_name") && (
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("last_name") && (
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("email") && (
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email address" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("company_name") && (
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("product_description_short") && (
                    <FormField
                      control={form.control}
                      name="product_description_short"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your product or service in detail"
                              className={textareaBaseClass}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic mt-1 text-muted-foreground">
                            What does your product or service do? What problems does it solve?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("usp") && (
                    <FormField
                      control={form.control}
                      name="usp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unique Selling Proposition</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What makes your product unique compared to competitors?"
                              className={textareaBaseClass}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic mt-1 text-muted-foreground">
                            What makes your product stand out from the competition?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("icp_persona") && (
                    <FormField
                      control={form.control}
                      name="icp_persona"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Customer Profile</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your ideal customer in detail"
                              className={textareaBaseClass}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic mt-1 text-muted-foreground">
                            Who is your ideal customer? Include demographics, job titles, industry, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("icp_pains_needs") && (
                    <FormField
                      control={form.control}
                      name="icp_pains_needs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Pains & Needs</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What problems does your ideal customer face?"
                              className={textareaBaseClass}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic mt-1 text-muted-foreground">
                            What challenges does your ideal customer face that your product solves?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {currentStepData.fields.includes("lead_magnet_ideas") && (
                    <FormField
                      control={form.control}
                      name="lead_magnet_ideas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Magnet Ideas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What valuable content could you offer potential customers?"
                              className={textareaBaseClass}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs italic mt-1 text-muted-foreground">
                            What free resources or tools could you offer to attract leads?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ) : (
                // Final review step
                renderReview()
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 bg-muted/20 border-t p-4 flex-none">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
              )}
              <div className="flex-1" />
              
              {currentStep < onboardingSteps.length ? (
                <Button 
                  type="button"
                  onClick={() => {
                    // Check if form fields for this step are valid
                    if (isStepComplete(currentStep - 1)) {
                      // Log that we would save progress
                      console.log('Would save progress:', form.getValues());
                      
                      // Show success toast
                      toast({
                        title: "Progress Saved",
                        description: "Your progress has been saved.",
                      });
                      
                      // Go to next step
                      setCurrentStep(currentStep + 1);
                    } else {
                      // Show validation error toast
                      toast({
                        title: "Validation Error",
                        description: "Please complete all fields in this step before proceeding.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={!isFormComplete() || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? <Spinner className="mr-2" /> : null}
                  Submit
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 