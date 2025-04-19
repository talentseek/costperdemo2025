"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close the menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleMenu = () => setIsOpen(!isOpen)

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 z-50 rounded-md shadow-lg bg-card border border-border overflow-hidden">
          <div className="py-1">
            <button
              className="text-left w-full px-4 py-2 text-sm hover:bg-muted"
              onClick={() => changeTheme("light")}
            >
              Light
            </button>
            <button
              className="text-left w-full px-4 py-2 text-sm hover:bg-muted"
              onClick={() => changeTheme("dark")}
            >
              Dark
            </button>
            <button
              className="text-left w-full px-4 py-2 text-sm hover:bg-muted"
              onClick={() => changeTheme("system")}
            >
              System
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 