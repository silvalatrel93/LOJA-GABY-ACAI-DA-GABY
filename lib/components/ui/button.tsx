"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "success" | "outline" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  icon?: ReactNode
  iconPosition?: "left" | "right"
  title?: string
  "aria-label"?: string
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className,
  icon,
  iconPosition = "left"
}: ButtonProps) {
  const baseStyles = "font-medium transition-all rounded-md flex items-center justify-center"
  
  const variantStyles = {
    primary: "bg-gradient-to-r from-purple-600 to-purple-900 text-white hover:from-purple-700 hover:to-purple-950",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-300 text-gray-800 hover:from-gray-200 hover:to-gray-400",
    success: "bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800",
    outline: "border border-purple-500 text-purple-700 hover:bg-purple-50",
    ghost: "text-purple-700 hover:bg-purple-50"
  }
  
  const sizeStyles = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-2 px-3",
    lg: "text-base py-3 px-4"
  }
  
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
  
  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  )
}
