import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - CostPerDemo',
  description: 'Manage workspaces and users in the CostPerDemo admin dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {children}
    </div>
  )
} 