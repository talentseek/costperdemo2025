'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { OnboardingStep, type OnboardingStatus } from './OnboardingStep'
import { createBrowserClient } from '@/utils/supabase'
import { Spinner } from './ui/spinner'
import { Badge } from '@/components/ui/badge'

type WorkspaceData = {
  id: string
  name: string
  owner_id: string
  subdomain: string | null
  created_at: string
}

type UserData = {
  id: string
  email: string
  role: string
  workspace_id: string
  created_at: string
}

type DatabaseOnboardingStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected'

type DatabaseOnboardingData = {
  id: string
  workspace_id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  website: string | null
  sales_development_representative: string | null
  calendar_integration: boolean | null
  cal_com_api_key: string | null
  product_description_short: string | null
  product_description_indepth: string | null
  icp_persona: string | null
  icp_geography: string | null
  icp_industry: string | null
  icp_job_titles: string | null
  icp_company_size: string | null
  competitors: string | null
  usp: string | null
  icp_pains_needs: string | null
  common_objections: string | null
  reasons_to_believe: string | null
  lead_magnet_ideas: string | null
  product_presentation_url: string | null
  video_presentation_url: string | null
  useful_information: string | null
  status: string | null
  admin_notes: string | null
  created_at: string
}

type OnboardingData = DatabaseOnboardingData | null

type DashboardError = {
  message: string
  code?: string
}

// Helper function to convert database status to component status
function mapOnboardingStatus(status: DatabaseOnboardingStatus): OnboardingStatus {
  const statusMap: Record<DatabaseOnboardingStatus, OnboardingStatus> = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'submitted': 'Submitted',
    'approved': 'Completed',
    'rejected': 'Pending'
  }
  return statusMap[status]
}

// Helper function to determine onboarding status
function determineOnboardingStatus(data: OnboardingData): OnboardingStatus {
  if (!data) return 'Pending'
  
  // Group steps as they appear in the OnboardingForm
  // Step 1-2: Personal Details & Company Details
  const step1Complete = Boolean(
    data.first_name && 
    data.last_name && 
    data.email && 
    data.company_name
  )
  
  // Step 3-4: Product Overview & USP
  const step2Complete = Boolean(
    data.product_description_short &&
    data.product_description_indepth &&
    data.usp
  )
  
  // Step 5-6: Target Audience & Customer Insights
  const step3Complete = Boolean(
    data.icp_persona &&
    data.icp_pains_needs &&
    data.icp_geography &&
    data.icp_industry &&
    data.icp_job_titles
  )
  
  // Step 7-8: Lead Generation & Integrations
  const step4Complete = Boolean(
    data.lead_magnet_ideas
  )

  // Determine overall status
  if (!step1Complete) return 'Pending'
  if (!step2Complete) return 'In Progress'
  if (!step3Complete) return 'In Progress'
  if (!step4Complete) return 'Submitted'
  return 'Completed'
}

export function ClientDashboard() {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(null)
  const [error, setError] = useState<DashboardError | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get the current user's session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session data:', {
          userId: session?.user?.id,
          email: session?.user?.email,
          sessionError
        })

        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!session) {
          console.log('No session found, redirecting to login')
          router.push('/auth?tab=login')
          return
        }

        // Get the user's workspace ID directly from the database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select()
          .eq('id', session.user.id)
          .single()

        console.log('Full user data:', userData)

        if (userError) {
          console.error('User query error:', userError)
          throw userError
        }

        if (!userData?.workspace_id) {
          console.log('No workspace_id found, redirecting to workspace creation')
          router.push('/workspace')
          return
        }

        // Get the workspace data using the workspace_id
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .select()
          .eq('id', userData.workspace_id)
          .single()

        if (workspaceError) {
          console.error('Workspace query error:', workspaceError)
          throw workspaceError
        }

        setWorkspaceData(workspaceData)

        // Try to get existing onboarding data
        let { data: onboardingData, error: onboardingError } = await supabase
          .from('workspace_onboarding')
          .select()
          .eq('workspace_id', workspaceData.id)
          .single()

        // If no record exists, create one
        if (onboardingError?.code === 'PGRST116') {
          console.log('No onboarding record found, creating initial record')
          
          const { data: newOnboardingData, error: createError } = await supabase
            .from('workspace_onboarding')
            .insert([
              {
                workspace_id: workspaceData.id,
                first_name: '',
                last_name: '',
                email: session.user.email || '',
                company_name: workspaceData.name,
                status: 'pending'
              }
            ])
            .select()
            .single()

          if (createError) {
            console.error('Error creating onboarding record:', createError)
            setOnboardingData(null)
          } else {
            console.log('Created new onboarding record:', newOnboardingData)
            setOnboardingData(newOnboardingData as DatabaseOnboardingData)
          }
        } else if (onboardingError) {
          console.error('Error fetching onboarding data:', onboardingError)
          setOnboardingData(null)
        } else {
          console.log('Found existing onboarding record:', onboardingData)
          setOnboardingData(onboardingData as DatabaseOnboardingData)
        }

      } catch (error: any) {
        console.error('Dashboard loading error:', error)
        setError({
          message: 'Failed to load dashboard data',
          code: error.code
        })
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth?tab=login')
    } catch (error: any) {
      console.error('Logout error:', error)
      setError({
        message: 'Failed to log out',
        code: error.code
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-600 mb-4">{error.message}</div>
        <button
          onClick={() => router.push('/auth?tab=login')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    )
  }

  const currentStatus = determineOnboardingStatus(onboardingData)
  const isAwaitingApproval = onboardingData?.status === 'submitted' && 
    Boolean(onboardingData?.first_name) && 
    Boolean(onboardingData?.product_description_short) && 
    Boolean(onboardingData?.icp_persona) && 
    Boolean(onboardingData?.lead_magnet_ideas)

  const onboardingSteps: Array<{
    id: number
    title: string
    description: string
    status: OnboardingStatus
    action: {
      text: string
      href: string
      disabled: boolean
    }
  }> = [
    {
      id: 1,
      title: 'Company Information',
      description: 'Tell us about your company and product',
      status: currentStatus === 'Pending' ? 'In Progress' : 'Completed',
      action: {
        text: 'Complete Profile',
        href: '/onboarding?step=1',
        disabled: false
      }
    },
    {
      id: 2,
      title: 'Product Overview',
      description: 'Describe your product and its features',
      status: currentStatus === 'Pending' ? 'Locked' : 
              (currentStatus === 'In Progress' && !Boolean(onboardingData?.product_description_short)) ? 'In Progress' : 
              'Completed',
      action: {
        text: 'Describe Product',
        href: '/onboarding?step=3',
        disabled: currentStatus === 'Pending'
      }
    },
    {
      id: 3,
      title: 'Target Audience',
      description: 'Define your ideal customer profile',
      status: currentStatus === 'Pending' || (currentStatus === 'In Progress' && !Boolean(onboardingData?.usp)) ? 'Locked' : 
              (currentStatus === 'In Progress' && !Boolean(onboardingData?.icp_persona)) ? 'In Progress' : 
              'Completed',
      action: {
        text: 'Define ICP',
        href: '/onboarding?step=5',
        disabled: currentStatus === 'Pending' || (currentStatus === 'In Progress' && !Boolean(onboardingData?.usp))
      }
    },
    {
      id: 4,
      title: 'Lead Generation',
      description: 'Upload your presentations and materials',
      status: currentStatus === 'Pending' || (currentStatus === 'In Progress' && !Boolean(onboardingData?.icp_persona)) ? 'Locked' :
              (currentStatus === 'In Progress' || currentStatus === 'Submitted') && !Boolean(onboardingData?.lead_magnet_ideas) ? 'In Progress' :
              'Completed',
      action: {
        text: 'Add Materials',
        href: '/onboarding?step=7',
        disabled: currentStatus === 'Pending' || (currentStatus === 'In Progress' && !Boolean(onboardingData?.icp_persona))
      }
    }
  ]

  const completedSteps = onboardingSteps.filter(step => step.status === 'Completed').length
  const progress = (completedSteps / onboardingSteps.length) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {workspaceData ? `Welcome to ${workspaceData.name}` : <Spinner size="sm" />}
          </h1>
          <p className="text-gray-600">Let's get your campaign ready</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Logout
        </button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Onboarding Progress</CardTitle>
          <CardDescription>Complete all steps to launch your campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-sm text-gray-600">{completedSteps} of {onboardingSteps.length} steps completed</p>
        </CardContent>
      </Card>

      {isAwaitingApproval && (
        <div className="mb-6 text-center">
          <Badge className="bg-amber-500 text-white py-1 px-3">Onboarding Awaiting Approval</Badge>
          <p className="mt-2 text-sm text-gray-600">Thank you for completing all steps. Our team is reviewing your information.</p>
        </div>
      )}

      <div className={`grid gap-6 md:grid-cols-2 ${isAwaitingApproval ? 'opacity-50' : ''}`}>
        {onboardingSteps.map((step) => (
          <OnboardingStep
            key={step.id}
            {...step}
          />
        ))}
      </div>
    </div>
  )
} 