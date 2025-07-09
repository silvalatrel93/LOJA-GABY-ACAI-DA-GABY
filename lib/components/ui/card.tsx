"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  hoverable?: boolean
}

export function Card({
  children,
  className,
  onClick,
  selected = false,
  disabled = false,
  hoverable = true
}: CardProps) {
  const baseStyles = "border rounded-md transition-colors"
  
  const selectedStyles = selected
    ? "border-purple-500 bg-purple-50 ring-1 sm:ring-2 ring-purple-200"
    : "border-gray-300 text-gray-700"
  
  const hoverStyles = hoverable && !disabled && !selected
    ? "hover:bg-gray-50"
    : ""
  
  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer"
  
  return (
    <div
      className={cn(
        baseStyles,
        selectedStyles,
        hoverStyles,
        disabledStyles,
        className
      )}
      onClick={disabled ? undefined : onClick}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      {children}
    </div>
  )
}
