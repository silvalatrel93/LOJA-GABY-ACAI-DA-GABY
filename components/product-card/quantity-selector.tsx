"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface QuantitySelectorProps {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
  min?: number
  max?: number
  className?: string
}

export function QuantitySelector({ 
  quantity, 
  onIncrement, 
  onDecrement, 
  min = 1, 
  max = 100,
  className = ""
}: QuantitySelectorProps) {
  const canDecrement = quantity > min
  const canIncrement = quantity < max

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onDecrement}
        disabled={!canDecrement}
        className="h-8 w-8 rounded-full p-0"
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <span className="w-8 text-center font-medium">{quantity}</span>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onIncrement}
        disabled={!canIncrement}
        className="h-8 w-8 rounded-full p-0"
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
