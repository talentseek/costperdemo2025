import { Metadata } from 'next'
import { ClientDashboard } from '@/components/ClientDashboard'

export const metadata: Metadata = {
  title: 'Dashboard | CostPerDemo',
  description: 'View your campaign progress and onboarding status.',
}

/**
 * Dashboard page component
 * Protected route for authenticated clients
 * Displays the ClientDashboard component
 */
export default function DashboardPage() {
  return <ClientDashboard />
} 