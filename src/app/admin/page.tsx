'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'
import { Spinner } from '@/components/ui/spinner'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        
        if (!data.authenticated || data.user?.role !== 'admin') {
          router.push('/auth?tab=login')
          return
        }
        
        setAuthenticated(true)
      } catch (error) {
        console.error('Error checking authentication:', error)
        router.push('/auth?tab=login')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner className="mr-2 h-8 w-8" />
        <p>Loading...</p>
      </div>
    )
  }
  
  if (!authenticated) {
    return null // Will be redirected
  }
  
  return <AdminPanel />
} 