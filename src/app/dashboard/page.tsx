import { Metadata } from 'next'
import DashboardContent from '@/components/DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard | CostPerDemo',
  description: 'Manage your campaigns and analytics'
}

export default function DashboardPage() {
  return <DashboardContent />
} 