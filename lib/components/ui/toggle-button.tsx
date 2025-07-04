"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ToggleButtonVariant = "primary" | "success" | "danger" | "warning" | "info"

interface ToggleButtonProps {
  children: ReactNode
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  title?: string
  variant?: ToggleButtonVariant
  selectedVariant?: ToggleButtonVariant
  icon?: ReactNode
  selectedIcon?: ReactNode
}

export function ToggleButton({
  children,
  selected = false,
  disabled = false,
  onClick,
  className,
  title,
  variant = "primary",
  selectedVariant = "success",
  icon,
  selectedIcon
}: ToggleButtonProps) {
  const baseStyles = "p-1.5 sm:p-2 rounded-md flex items-center justify-center transition-colors shadow-sm"
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800",
    success: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700",
    warning: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
  }
  
  const disabledStyles = "bg-gray-100 text-gray-400 cursor-not-allowed"
  
  const currentVariant = selected ? selectedVariant : variant
  const currentIcon = selected ? selectedIcon || icon : icon
  
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        disabled ? disabledStyles : variantStyles[currentVariant],
        className
      )}
      title={title}
    >
      {currentIcon || children}
    </button>
  )
}
