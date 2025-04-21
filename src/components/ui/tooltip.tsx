"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: "top" | "right" | "bottom" | "left"
  delay?: number
  className?: string
  contentClassName?: string
}

export const Tooltip = ({
  children,
  content,
  position = "top",
  delay = 300,
  className,
  contentClassName,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const timer = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleMouseEnter = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setIsVisible(true), delay)
  }

  const handleMouseLeave = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setIsVisible(false), 100)
  }

  if (!isMounted) return children

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-center text-white bg-gray-900 rounded-md shadow-sm max-w-xs",
            positionClasses[position],
            contentClassName
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn("absolute w-2 h-2 bg-gray-900 rotate-45", {
              "left-1/2 -translate-x-1/2 top-full -mt-1": position === "bottom",
              "left-1/2 -translate-x-1/2 bottom-full -mb-1": position === "top",
              "top-1/2 -translate-y-1/2 right-full -mr-1": position === "left",
              "top-1/2 -translate-y-1/2 left-full -ml-1": position === "right",
            })}
          />
        </div>
      )}
    </div>
  )
} 