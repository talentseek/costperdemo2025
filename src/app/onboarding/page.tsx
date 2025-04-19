import { OnboardingForm } from '@/components/OnboardingForm'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Onboarding - CostPerDemo',
  description: 'Complete your onboarding to get started with CostPerDemo'
}

export default async function OnboardingPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Extract step from URL parameter
  const step = searchParams.step ? parseInt(searchParams.step as string, 10) : 1
  
  // Get the user's workspace ID
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  // Get the user's workspace ID
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', session.user.id)
    .single()
    
  if (!workspace) {
    redirect('/workspace')
  }

  return <OnboardingForm workspaceId={workspace.id} initialStep={step} />
}