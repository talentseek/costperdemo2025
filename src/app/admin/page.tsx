import { Metadata } from 'next'
import { Suspense } from 'react'
import AdminPanel from '@/components/AdminPanel'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Admin Dashboard - CostPerDemo',
  description: 'Manage workspaces and users in the CostPerDemo admin dashboard',
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminPanel />
    </Suspense>
  )
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="container p-4 mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 