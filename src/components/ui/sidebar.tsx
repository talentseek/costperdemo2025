"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  isMobile: boolean
}>({
  expanded: true,
  setExpanded: () => {},
  isMobile: false,
})

export function SidebarProvider({
  children,
  defaultExpanded = true,
}: {
  children: React.ReactNode
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setExpanded(false)
      }
    }
    
    // Initial check
    checkMobile()
    
    // Add event listener
    window.addEventListener("resize", checkMobile)
    
    // Clean up
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded, isMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { expanded, setExpanded } = useSidebar()
  
  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

export function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { expanded } = useSidebar()
  
  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 border-r bg-card text-card-foreground shadow-sm transition-all duration-300",
        expanded ? "w-64" : "w-0 -translate-x-full md:w-16 md:translate-x-0",
        className
      )}
      {...props}
    />
  )
}

export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-border p-2 flex items-center h-16", className)}
      {...props}
    />
  )
}

export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-2", className)} {...props} />
}

export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-t border-border p-2 mt-auto", className)}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

interface SidebarMenuButtonProps {
  isActive?: boolean
  asChild?: boolean
  className?: string
  children?: React.ReactNode
  [key: string]: any
}

export function SidebarMenuButton({
  className,
  isActive,
  asChild = false,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const { expanded } = useSidebar()
  const Comp = asChild ? "div" : "button"
  
  return (
    <Comp
      className={cn(
        "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium",
        "transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground" : "transparent",
        !expanded && "justify-center px-0",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function SidebarRail() {
  const { expanded, setExpanded, isMobile } = useSidebar()
  
  // Don't show the rail on mobile
  if (isMobile) return null
  
  return (
    <div
      className="absolute right-0 top-0 h-full w-1 -translate-x-1/2 cursor-ew-resize bg-transparent hover:bg-border"
      onMouseDown={(e) => {
        e.preventDefault()
        
        const startX = e.clientX
        const sidebarWidth = expanded ? 256 : 64
        
        const onMouseMove = (mouseMoveEvent: MouseEvent) => {
          mouseMoveEvent.preventDefault()
          const newWidth = sidebarWidth + (mouseMoveEvent.clientX - startX)
          setExpanded(newWidth > 128)
        }
        
        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove)
          document.removeEventListener("mouseup", onMouseUp)
        }
        
        document.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseup", onMouseUp)
      }}
    />
  )
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar()
  
  return (
    <div
      className={cn(
        "min-h-screen transition-[margin] duration-300",
        expanded ? "md:ml-64" : "ml-0 md:ml-16"
      )}
    >
      {children}
    </div>
  )
} 