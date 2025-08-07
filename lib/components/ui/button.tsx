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
  storeColor?: string
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className,
  icon,
  iconPosition = "left",
  storeColor = "#8B5CF6"
}: ButtonProps) {
  const baseStyles = "font-medium transition-all rounded-md flex items-center justify-center"
  
  const variantStyles = {
    primary: "text-white transition-all duration-200",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-300 text-gray-800 hover:from-gray-200 hover:to-gray-400",
    success: "bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800",
    outline: "border text-opacity-80 transition-all duration-200",
    ghost: "text-opacity-80 hover:bg-opacity-10 transition-all duration-200"
  }
  
  const sizeStyles = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-2 px-3",
    lg: "text-base py-3 px-4"
  }
  
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(to right, ${storeColor}, ${storeColor}dd)`,
          color: 'white'
        }
      case 'outline':
        return {
          borderColor: storeColor,
          color: storeColor
        }
      case 'ghost':
        return {
          color: storeColor
        }
      default:
        return {}
    }
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabledStyles,
        className
      )}
      style={getVariantStyles()}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !disabled) {
          e.currentTarget.style.background = `linear-gradient(to right, ${storeColor}dd, ${storeColor}bb)`
        } else if (variant === 'outline' && !disabled) {
          e.currentTarget.style.backgroundColor = `${storeColor}10`
        } else if (variant === 'ghost' && !disabled) {
          e.currentTarget.style.backgroundColor = `${storeColor}10`
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary' && !disabled) {
          e.currentTarget.style.background = `linear-gradient(to right, ${storeColor}, ${storeColor}dd)`
        } else if ((variant === 'outline' || variant === 'ghost') && !disabled) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  )
}
