"use client"

import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type PriceDisplayVariant = "default" | "large" | "small"

interface PriceDisplayProps {
  price: number
  variant?: PriceDisplayVariant
  showPrefix?: boolean
  prefixText?: string
  className?: string
  freeText?: string
  storeColor?: string
}

export function PriceDisplay({
  price,
  variant = "default",
  showPrefix = false,
  prefixText = "A PARTIR DE",
  className,
  freeText = "Grátis",
  storeColor = "#8B5CF6"
}: PriceDisplayProps) {
  const variantStyles = {
    default: "bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold",
    large: "bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold text-lg sm:text-xl",
    small: "bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold text-xs"
  }

  return (
    <div className={cn("font-medium", className)}>
      {showPrefix && (
        <span 
          className="text-xs text-transparent bg-clip-text font-bold block"
          style={{
            backgroundImage: `linear-gradient(to right, ${storeColor}, ${storeColor}dd)`
          }}
        >
          {prefixText}
        </span>
      )}
      <span className={variantStyles[variant]}>
        {price > 0 ? formatCurrency(price) : freeText}
      </span>
    </div>
  )
}
