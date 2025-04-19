'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, UseFormReturn, SubmitHandler, Path, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { onboardingSchema, type OnboardingFormData, stepValidation } from '@/lib/schemas/onboarding'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import type { Database } from '@/lib/database.types'
import { useToast } from "@/hooks/use-toast"
import { ProgressBar } from './ProgressBar'

// Helper components
export function FieldTooltip({ content }: { content: React.ReactNode }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground inline-block cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Step Components
interface StepProps {
  form: UseFormReturn<OnboardingFormData>
}

function Step1({ form }: StepProps) {
  return (
    <>
      <CardTitle>Personal Details</CardTitle>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value ?? ''}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}

function Step2({ form }: StepProps) {
  return (
    <>
      <CardTitle>Company Details</CardTitle>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="https://example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sales_development_representative">
            Sales Development Representative
            <FieldTooltip content="The person responsible for outbound sales activities" />
          </Label>
          <FormField
            control={form.control}
            name="sales_development_representative"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Jane Smith"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}

function Step3({ form }: StepProps) {
  return (
    <>
      <CardTitle>Product Overview</CardTitle>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product_description_short">
            Short Description
            <FieldTooltip content="A brief overview of your product (50 words max)" />
          </Label>
          <FormField
            control={form.control}
            name="product_description_short"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Describe your product in a few sentences..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product_description_indepth">
            In-Depth Description
            <FieldTooltip content="A detailed explanation of your product's features and benefits" />
          </Label>
          <FormField
            control={form.control}
            name="product_description_indepth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Provide more details about your product..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}

function Step4({ form }: StepProps) {
  return (
    <>
      <CardTitle>Unique Selling Proposition</CardTitle>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="usp">
            Unique Selling Proposition
            <FieldTooltip content="What makes your product unique in the market?" />
          </Label>
          <FormField
            control={form.control}
            name="usp"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="What sets your product apart from competitors?"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="competitors">
            Competitors
            <FieldTooltip content="List your main competitors" />
          </Label>
          <FormField
            control={form.control}
            name="competitors"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Who are your main competitors?"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  )
}

function FormFieldWrapper({ 
  name, 
  label, 
  control, 
  render 
}: { 
  name: Path<OnboardingFormData>; 
  label: string; 
  control: Control<OnboardingFormData>;
  render: (props: { field: any }) => React.ReactElement;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={render}
    />
  );
}

function Step5({ form }: StepProps) {
  return (
    <Form {...form}>
      <CardTitle>Target Audience</CardTitle>
      <div className="space-y-4">
        <FormFieldWrapper
          name="icp_persona"
          label="Ideal Customer Profile (ICP) Persona"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Ideal Customer Profile (ICP) Persona
                <FieldTooltip content="Describe your ideal customer profile" />
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="Describe your ideal customer..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="icp_geography"
          label="Target Geography"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Geography</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || undefined}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target geography" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="EU">European Union</SelectItem>
                  <SelectItem value="Global">Global</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="icp_industry"
          label="Target Industry"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Industry</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value ?? ''}
                  placeholder="e.g., SaaS, Healthcare, Finance" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="icp_job_titles"
          label="Target Job Titles"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Job Titles</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value ?? ''}
                  placeholder="e.g., CTO, VP of Sales, Marketing Director" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="icp_company_size"
          label="Target Company Size"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Company Size</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || undefined}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-5000">201-5000 employees</SelectItem>
                  <SelectItem value="5001+">5001+ employees</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

function Step6({ form }: StepProps) {
  return (
    <Form {...form}>
      <CardTitle>Customer Insights</CardTitle>
      <div className="space-y-4">
        <FormFieldWrapper
          name="icp_pains_needs"
          label="Customer Pains and Needs"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Customer Pains and Needs
                <FieldTooltip content="What problems does your product solve?" />
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="Describe the main pain points..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="competitors"
          label="Competitors"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competitors</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="List your main competitors..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldWrapper
          name="common_objections"
          label="Common Objections"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Common Objections</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="List common sales objections..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reasons_to_believe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reasons to Believe</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="Why should customers trust you?" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

function Step7({ form }: StepProps) {
  return (
    <Form {...form}>
      <CardTitle>Lead Generation</CardTitle>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="lead_magnet_ideas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Lead Magnet Ideas
                <FieldTooltip content="What valuable content can you offer to attract leads?" />
              </FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value ?? ''} 
                  placeholder="Describe your lead magnet ideas..." 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_presentation_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Presentation URL</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  value={field.value ?? ''}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="video_presentation_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Presentation URL</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  value={field.value ?? ''}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="useful_information"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Information</FormLabel>
              <FormControl>
                <Textarea 
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Any other information that might be useful..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

function Step8({ form }: StepProps) {
  return (
    <Form {...form}>
      <CardTitle>Integrations & Submit</CardTitle>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="calendar_integration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Calendar Integration
                </FormLabel>
                <FormDescription>
                  Enable calendar integration for scheduling demos
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('calendar_integration') && (
          <FormField
            control={form.control}
            name="cal_com_api_key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cal.com API Key</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    value={field.value ?? ''}
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </Form>
  )
}

// Main component
type DatabaseOnboardingStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected'

type FormData = OnboardingFormData

interface OnboardingFormProps {
  workspaceId: string;
  initialStep?: number;
}

export function OnboardingForm({ workspaceId, initialStep = 1 }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      workspace_id: workspaceId,
      first_name: '',
      last_name: '',
      email: '',
      company_name: '',
      product_description_short: '',
      product_description_indepth: '',
      usp: '',
      icp_persona: '',
      icp_pains_needs: '',
      icp_geography: 'Global' as const,
      icp_industry: '',
      icp_job_titles: '',
      competitors: '',
      common_objections: '',
      reasons_to_believe: '',
      lead_magnet_ideas: '',
      calendar_integration: false,
      website: '',
      sales_development_representative: '',
      product_presentation_url: '',
      video_presentation_url: '',
      cal_com_api_key: '',
      useful_information: ''
    }
  })

  // Load existing onboarding data
  useEffect(() => {
    async function loadOnboardingData() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('workspace_onboarding')
          .select('*')
          .eq('workspace_id', workspaceId)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 means no data found, which is fine for new users
          console.error('Error loading onboarding data:', error)
          return
        }

        if (data) {
          console.log('Loaded existing onboarding data:', data)
          // Reset form with existing data
          form.reset(data)
        }
      } catch (error) {
        console.error('Failed to load onboarding data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOnboardingData()
  }, [workspaceId, form, supabase])

  const handleNext = async () => {
    try {
      // Only validate fields for the current step
      const currentStepFields = stepValidation[currentStep as keyof typeof stepValidation]
      const isValid = await form.trigger(currentStepFields)
      
      console.log('Step validation result:', { currentStep, isValid, fields: currentStepFields })
      
      if (isValid && currentStep < 8) {
        // Save progress to database before proceeding
        try {
          // Get form values
          const formData = form.getValues()
          
          // Create a properly typed object for Supabase
          const dataToSave = {
            workspace_id: workspaceId,
            first_name: formData.first_name || '',
            last_name: formData.last_name || '',
            email: formData.email || '',
            company_name: formData.company_name || '',
            website: formData.website || null,
            sales_development_representative: formData.sales_development_representative || null,
            product_description_short: formData.product_description_short || '',
            product_description_indepth: formData.product_description_indepth || null,
            usp: formData.usp || '',
            icp_persona: formData.icp_persona || '',
            icp_pains_needs: formData.icp_pains_needs || '',
            icp_geography: (formData.icp_geography || 'Global') as 'US' | 'EU' | 'Global' | 'Other',
            icp_industry: formData.icp_industry || '',
            icp_job_titles: formData.icp_job_titles || '',
            icp_company_size: formData.icp_company_size as "1-10" | "11-50" | "51-200" | "201-5000" | "5001+" | null,
            competitors: formData.competitors || '',
            common_objections: formData.common_objections || '',
            reasons_to_believe: formData.reasons_to_believe || '',
            lead_magnet_ideas: formData.lead_magnet_ideas || '',
            product_presentation_url: formData.product_presentation_url || null,
            video_presentation_url: formData.video_presentation_url || null,
            calendar_integration: Boolean(formData.calendar_integration),
            cal_com_api_key: formData.cal_com_api_key || null,
            useful_information: formData.useful_information || null,
            status: 'in_progress'
          }
          
          console.log('Saving progress with data:', dataToSave)
          
          // First check if a record exists
          const { data: existingRecord, error: selectError } = await supabase
            .from('workspace_onboarding')
            .select('id')
            .eq('workspace_id', workspaceId)
            .single()
            
          console.log('Check existing record:', { existingRecord, selectError })
          
          let saveError = null
          
          if (existingRecord) {
            // Update existing record
            const { error, data } = await supabase
              .from('workspace_onboarding')
              .update(dataToSave)
              .eq('workspace_id', workspaceId)
              
            console.log('Update response:', { error, data })
            saveError = error
          } else {
            // Insert new record
            const { error, data } = await supabase
              .from('workspace_onboarding')
              .insert([dataToSave])
              
            console.log('Insert response:', { error, data })
            saveError = error
          }
            
          if (saveError) {
            console.error('Error saving progress:', saveError)
            console.error('Error code:', saveError.code)
            console.error('Error message:', saveError.message)
            console.error('Error details:', saveError.details)
            toast({
              title: 'Warning',
              description: `Progress not saved: ${saveError.message}`,
              variant: 'destructive'
            })
          } else {
            toast({
              title: 'Progress Saved',
              description: 'Your progress has been saved',
              variant: 'default'
            })
          }
        } catch (error: any) {
          console.error('Error saving progress:', error)
          console.error('Error type:', typeof error)
          console.error('Error stack:', error?.stack)
          console.error('Error details:', JSON.stringify(error, null, 2))
          toast({
            title: 'Warning',
            description: `Error: ${error?.message || 'Unknown error occurred'}`,
            variant: 'destructive'
          })
        }
        
        // Continue to next step regardless of save result
        setCurrentStep(prev => prev + 1)
      } else if (!isValid) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields for this step',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Error in handleNext:', error)
      console.error('Error type:', typeof error)
      console.error('Error stack:', error?.stack)
      console.error('Error details:', JSON.stringify(error, null, 2))
    }
  }
  
  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true)
      
      // Create a properly typed object for submission
      const formData = {
        workspace_id: workspaceId,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        company_name: data.company_name || '',
        website: data.website || null,
        sales_development_representative: data.sales_development_representative || null,
        product_description_short: data.product_description_short || '',
        product_description_indepth: data.product_description_indepth || null,
        usp: data.usp || '',
        icp_persona: data.icp_persona || '',
        icp_pains_needs: data.icp_pains_needs || '',
        icp_geography: (data.icp_geography || 'Global') as 'US' | 'EU' | 'Global' | 'Other',
        icp_industry: data.icp_industry || '',
        icp_job_titles: data.icp_job_titles || '',
        icp_company_size: data.icp_company_size as "1-10" | "11-50" | "51-200" | "201-5000" | "5001+" | null,
        competitors: data.competitors || '',
        common_objections: data.common_objections || '',
        reasons_to_believe: data.reasons_to_believe || '',
        lead_magnet_ideas: data.lead_magnet_ideas || '',
        product_presentation_url: data.product_presentation_url || null,
        video_presentation_url: data.video_presentation_url || null,
        calendar_integration: Boolean(data.calendar_integration),
        cal_com_api_key: data.cal_com_api_key || null,
        useful_information: data.useful_information || null,
        status: 'submitted'
      }
      
      console.log('Submitting data:', formData)
      
      // Use fetch API to call the backend endpoint
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: Failed to submit onboarding data`);
      }

      const result = await response.json();
      
      toast({
        title: 'Success!',
        description: result.message || 'Your onboarding information has been saved.',
      })
      
      // Redirect to confirmation page instead of dashboard
      router.push('/onboarding/confirmation')
    } catch (error: any) {
      console.error('Error submitting form:', error)
      console.error('Error type:', typeof error)
      console.error('Error stack:', error?.stack)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast({
        title: 'Error',
        description: `Failed to save: ${error?.message || 'Unknown error occurred'}`,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 form={form} />
      case 2:
        return <Step2 form={form} />
      case 3:
        return <Step3 form={form} />
      case 4:
        return <Step4 form={form} />
      case 5:
        return <Step5 form={form} />
      case 6:
        return <Step6 form={form} />
      case 7:
        return <Step7 form={form} />
      case 8:
        return <Step8 form={form} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pt-6">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          <div className="mb-8 mt-4">
            <h2 className="text-xl font-semibold mb-3">Step {currentStep} of 8</h2>
            <ProgressBar currentStep={currentStep} totalSteps={8} />
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {renderStep()}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 || isSubmitting}
                >
                  Back
                </Button>
                
                {currentStep < 8 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Complete'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </>
      )}
    </div>
  )
} 