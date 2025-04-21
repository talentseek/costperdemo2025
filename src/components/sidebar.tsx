"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building, FileText, Home, BarChart3, PieChart } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  disabled?: boolean
  blurred?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Onboarding",
    href: "/onboarding",
    icon: FileText,
  },
  {
    title: "Workspace",
    href: "/workspace",
    icon: Building,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: BarChart3,
    disabled: true,
    blurred: true,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: PieChart,
    disabled: true,
    blurred: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { expanded } = useSidebar()

  return (
    <Sidebar className="overflow-hidden">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-lg font-bold text-primary-foreground">C</span>
          </div>
          {expanded && <span className="text-lg font-semibold">CostPerDemo</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className={cn(item.blurred && "blur-sm opacity-50 pointer-events-none")}
                disabled={item.disabled}
              >
                <Link href={item.disabled ? "#" : item.href} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {expanded && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>{/* Logout moved to user dropdown */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
} 