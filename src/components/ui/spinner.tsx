import React from 'react'
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }
  
  return (
    <div className="flex justify-center p-4">
      <div 
        className={cn(`${sizeClasses[size]} border-t-primary border-b-primary rounded-full animate-spin`, className)}
      />
    </div>
  )
} 