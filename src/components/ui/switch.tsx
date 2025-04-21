"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <label className="flex items-start cursor-pointer">
        <div className="relative mr-3">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              "block h-6 w-11 rounded-full transition-colors",
              props.checked ? "bg-primary" : "bg-muted",
              props.disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          <div
            className={cn(
              "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform",
              props.checked && "translate-x-5"
            )}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium">{label}</span>}
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        )}
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch } 