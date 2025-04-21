"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/utils/supabase"

interface UserDropdownProps {
  user?: {
    name?: string
    email?: string
    image?: string
  }
}

export function UserDropdown({ user: propUser }: UserDropdownProps) {
  const router = useRouter()
  const [user, setUser] = useState(propUser || { 
    name: "Loading...", 
    email: "", 
    image: "" 
  })
  const [isLoading, setIsLoading] = useState(!propUser)

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClientComponentClient()
        
        // Get the user from auth
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Try to get user data from database
          const { data: userData } = await supabase
            .from('users')
            .select('email, role')
            .eq('id', authUser.id)
            .single()
          
          // Use userData if available, otherwise fallback to auth data
          const email = userData?.email || authUser.email || ''
          const displayName = email.split('@')[0] || 'User'
          
          console.log('Client-side user data loaded:', displayName)
          
          setUser({
            name: displayName,
            email: email,
            image: authUser.user_metadata?.avatar_url || '',
          })
        }
      } catch (error) {
        console.error('Error loading user data in dropdown:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only load data if we don't have user info from props
    if (!propUser?.email) {
      loadUserData()
    }
  }, [propUser])
  
  const initials = (user.name || 'U')
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        router.push(data.redirectTo || "/auth?tab=login")
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {isLoading ? (
            <User className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{isLoading ? "Loading..." : user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full cursor-pointer items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 