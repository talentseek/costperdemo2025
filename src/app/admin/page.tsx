'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminPanel from '@/components/AdminPanel'
import { Spinner } from '@/components/ui/spinner'
import { createClientComponentClient } from '@/utils/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Create a Supabase client to check auth status
        const supabase = createClientComponentClient()
        
        // Check if we have a user and if they're an admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Auth error:', userError)
          router.push('/auth?tab=login')
          return
        }
        
        // Get user role from the database
        const { data: userData, error: dbError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (dbError) {
          console.error('Database error:', dbError)
          router.push('/auth?tab=login')
          return
        }
        
        // Check if the user is an admin
        if (userData?.role !== 'admin') {
          console.log('User is not an admin:', userData?.role)
          router.push('/dashboard')
          return
        }
        
        // If we get here, the user is authenticated as an admin
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
        <p>Loading Admin Panel...</p>
      </div>
    )
  }
  
  if (!authenticated) {
    return null // Will be redirected
  }
  
  return <AdminPanel />
} 