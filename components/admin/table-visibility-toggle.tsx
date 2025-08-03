"use client"

import { useState } from "react"
import { Users, UserX } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase-client"

interface TableVisibilityToggleProps {
  productId: number
  initialHiddenFromTable?: boolean
  onToggle?: (newHiddenFromTable: boolean) => void
}

export function TableVisibilityToggle({ 
  productId, 
  initialHiddenFromTable = false,
  onToggle 
}: TableVisibilityToggleProps) {
  const [isHiddenFromTable, setIsHiddenFromTable] = useState(initialHiddenFromTable)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleToggleTableVisibility = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      
      // Alternar o estado de visibilidade no sistema de mesa
      const newHiddenFromTableState = !isHiddenFromTable
      const { error } = await supabase
        .from("products")
        .update({ active: !newHiddenFromTableState })
        .eq("id", productId)
      
      if (error) {
        console.error(`Erro ao atualizar visibilidade em mesa do produto ${productId}:`, error)
        alert("Erro ao alterar visibilidade do produto na mesa")
        return
      }
      
      setIsHiddenFromTable(newHiddenFromTableState)
      if (onToggle) onToggle(newHiddenFromTableState)
    } catch (error) {
      console.error("Erro ao alternar visibilidade em mesa:", error)
      alert("Erro ao alterar visibilidade do produto na mesa")
    } finally {
      setIsLoading(false)
    }
  }

  // Texto responsivo baseado no tamanho da tela
  const getButtonText = () => {
    if (isLoading) return "..."
    if (isHiddenFromTable) {
      return (
        <>
          <span className="hidden xs:inline">Mesa: Oculto</span>
          <span className="xs:hidden">Mesa: ✗</span>
        </>
      )
    } else {
      return (
        <>
          <span className="hidden xs:inline">Mesa: Visível</span>
          <span className="xs:hidden">Mesa: ✓</span>
        </>
      )
    }
  }
  
  return (
    <button
      onClick={handleToggleTableVisibility}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] xs:text-xs font-medium transition-all duration-200
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${isHiddenFromTable
          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
        }
        touch-manipulation min-w-0 flex-shrink-0
      `}
      title={isHiddenFromTable ? "Produto oculto da mesa - Clique para mostrar" : "Produto visível na mesa - Clique para ocultar"}
    >
      {isLoading ? (
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : isHiddenFromTable ? (
        <UserX className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
      ) : (
        <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
      )}
      <span className="whitespace-nowrap truncate min-w-0">
        {getButtonText()}
      </span>
    </button>
  )
}