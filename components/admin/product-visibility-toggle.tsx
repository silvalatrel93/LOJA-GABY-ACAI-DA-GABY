"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase-client"

interface ProductVisibilityToggleProps {
  productId: number
  initialHidden?: boolean
  onToggle?: (newHidden: boolean) => void
}

export function ProductVisibilityToggle({ 
  productId, 
  initialHidden = false,
  onToggle 
}: ProductVisibilityToggleProps) {
  const [isHidden, setIsHidden] = useState(initialHidden)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleToggleVisibility = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      
      // Alternar o estado de visibilidade
      const { error } = await supabase
        .from("products")
        .update({ hidden: !isHidden })
        .eq("id", productId)
      
      if (error) {
        console.error(`Erro ao atualizar visibilidade do produto ${productId}:`, error)
        return
      }
      
      const newHiddenState = !isHidden
      setIsHidden(newHiddenState)
      if (onToggle) onToggle(newHiddenState)
    } catch (error) {
      console.error("Erro ao alternar visibilidade:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      onClick={handleToggleVisibility}
      disabled={isLoading}
      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      title={isHidden ? "Mostrar produto" : "Ocultar produto"}
    >
      {isHidden ? (
        <EyeOff className="w-5 h-5 text-gray-500" />
      ) : (
        <Eye className="w-5 h-5 text-blue-500" />
      )}
    </button>
  )
}
