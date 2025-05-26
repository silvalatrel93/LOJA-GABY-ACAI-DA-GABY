"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import type { ProductSize } from "@/lib/types"

// Constantes padrão
const DEFAULT_MAX_ADDITIONALS_PER_SIZE = 5
const FREE_ADDITIONALS_LIMIT = 5
const SIZES_WITH_FREE_ADDITIONALS = ["1 Litro", "2 Litros", "2 Litro"]

// Tipos
type AdditionalsContextType = {
  // Estado
  additionals: Additional[]
  additionalsByCategory: {category: AdditionalCategory, additionals: Additional[]}[]
  additionalsBySize: {
    [size: string]: {
      [additionalId: number]: { additional: Additional; quantity: number }
    }
  }
  selectedSize: string
  selectedCategoryId: number | null
  selectedAdditionals: Record<number, { additional: Additional; quantity: number }>
  isDataLoaded: boolean
  
  // Constantes
  maxAdditionalsPerSize: number // Limite dinâmico baseado no tamanho selecionado
  FREE_ADDITIONALS_LIMIT: number
  SIZES_WITH_FREE_ADDITIONALS: string[]
  
  // Valores calculados
  hasFreeAdditionals: boolean
  selectedAdditionalsCount: number
  reachedFreeAdditionalsLimit: boolean
  reachedMaxAdditionalsLimit: boolean
  
  // Métodos
  setAdditionals: (additionals: Additional[]) => void
  setAdditionalsByCategory: (additionalsByCategory: {category: AdditionalCategory, additionals: Additional[]}[]) => void
  setSelectedSize: (size: string) => void
  setSelectedCategoryId: (categoryId: number | null) => void
  toggleAdditional: (additional: Additional) => void
  removeAdditional: (additionalId: number) => void
  setIsDataLoaded: (isLoaded: boolean) => void
  resetAdditionalsBySize: () => void
  setMaxAdditionalsPerSize: (limit: number) => void
  updateSizeLimits: (sizes: ProductSize[]) => void // Novo método para atualizar limites por tamanho
}

// Valor padrão do contexto
const defaultContext: AdditionalsContextType = {
  additionals: [],
  additionalsByCategory: [],
  additionalsBySize: {},
  selectedSize: "",
  selectedCategoryId: null,
  selectedAdditionals: {},
  isDataLoaded: false,
  
  maxAdditionalsPerSize: DEFAULT_MAX_ADDITIONALS_PER_SIZE,
  FREE_ADDITIONALS_LIMIT,
  SIZES_WITH_FREE_ADDITIONALS,
  
  hasFreeAdditionals: false,
  selectedAdditionalsCount: 0,
  reachedFreeAdditionalsLimit: false,
  reachedMaxAdditionalsLimit: false,
  
  setAdditionals: () => {},
  setAdditionalsByCategory: () => {},
  setSelectedSize: () => {},
  setSelectedCategoryId: () => {},
  toggleAdditional: () => {},
  removeAdditional: () => {},
  setIsDataLoaded: () => {},
  resetAdditionalsBySize: () => {},
  setMaxAdditionalsPerSize: () => {},
  updateSizeLimits: () => {}
}

// Criação do contexto
const AdditionalsContext = createContext<AdditionalsContextType>(defaultContext)

// Hook para usar o contexto
export const useAdditionals = () => useContext(AdditionalsContext)

// Provedor do contexto
export function AdditionalsProvider({ 
  children,
  initialSize = "",
  maxAdditionalsLimit = DEFAULT_MAX_ADDITIONALS_PER_SIZE,
  productSizes = []
}: { 
  children: ReactNode,
  initialSize?: string,
  maxAdditionalsLimit?: number,
  productSizes?: ProductSize[]
}) {
  // Estados
  const [additionals, setAdditionals] = useState<Additional[]>([])
  const [additionalsByCategory, setAdditionalsByCategory] = useState<{category: AdditionalCategory, additionals: Additional[]}[]>([])
  const [additionalsBySize, setAdditionalsBySize] = useState<{
    [size: string]: {
      [additionalId: number]: { additional: Additional; quantity: number }
    }
  }>({})
  const [selectedSize, setSelectedSize] = useState(initialSize)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [maxAdditionalsPerSize, setMaxAdditionalsPerSize] = useState(maxAdditionalsLimit)
  const [sizeLimits, setSizeLimits] = useState<ProductSize[]>(productSizes)
  
  // Função para obter o limite específico do tamanho selecionado
  const getCurrentSizeLimit = () => {
    const currentSizeInfo = sizeLimits.find(size => size.size === selectedSize)
    const limit = currentSizeInfo?.additionalsLimit ?? 999
    
    // Debug logs
    console.log('🔍 DEBUG - getCurrentSizeLimit:', {
      selectedSize,
      sizeLimits,
      currentSizeInfo,
      limit
    })
    
    // APENAS usar o limite específico do tamanho se estiver definido
    // Se não estiver definido, usar um limite alto (sem limite efetivo)
    return limit // 999 = sem limite prático
  }
  
  // Valores calculados
  const selectedAdditionals = additionalsBySize[selectedSize] || {}
  const selectedAdditionalsCount = Object.keys(selectedAdditionals).length
  const hasFreeAdditionals = SIZES_WITH_FREE_ADDITIONALS.includes(selectedSize)
  const reachedFreeAdditionalsLimit = hasFreeAdditionals && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT
  const currentLimit = getCurrentSizeLimit()
  const reachedMaxAdditionalsLimit = selectedAdditionalsCount >= currentLimit
  
  // Métodos
  const toggleAdditional = (additional: Additional) => {
    // Verificar se este adicional já está selecionado para o tamanho atual
    const isSelected = !!selectedAdditionals[additional.id]
    
    // Debug logs
    console.log('🔍 DEBUG - toggleAdditional:', {
      additionalName: additional.name,
      selectedSize,
      isSelected,
      selectedAdditionalsCount,
      currentLimit,
      reachedMaxAdditionalsLimit,
      sizeLimits
    })
    
    // Se estiver selecionado, remover
    if (isSelected) {
      console.log('➖ Removendo adicional:', additional.name)
      setAdditionalsBySize(prev => {
        const newState = { ...prev }
        const newSizeAdditionals = { ...newState[selectedSize] }
        delete newSizeAdditionals[additional.id]
        
        // Se não houver mais complementos premium para este tamanho, remover o tamanho
        if (Object.keys(newSizeAdditionals).length === 0) {
          delete newState[selectedSize]
        } else {
          newState[selectedSize] = newSizeAdditionals
        }
        
        return newState
      })
    } 
    // Se não estiver selecionado e não atingiu o limite máximo de adicionais, adicionar
    else if (!reachedMaxAdditionalsLimit) {
      console.log('➕ Adicionando adicional:', additional.name)
      setAdditionalsBySize(prev => {
        const newState = { ...prev }
        if (!newState[selectedSize]) {
          newState[selectedSize] = {}
        }
        
        newState[selectedSize][additional.id] = { 
          additional, 
          quantity: 1 
        }
        
        return newState
      })
    } else {
      console.log('🚫 Limite atingido! Não é possível adicionar:', additional.name)
    }
  }
  
  const removeAdditional = (additionalId: number) => {
    setAdditionalsBySize(prev => {
      const newState = { ...prev }
      const newSizeAdditionals = { ...newState[selectedSize] }
      delete newSizeAdditionals[additionalId]
      
      // Se não houver mais complementos premium para este tamanho, remover o tamanho
      if (Object.keys(newSizeAdditionals).length === 0) {
        delete newState[selectedSize]
      } else {
        newState[selectedSize] = newSizeAdditionals
      }
      
      return newState
    })
  }
  
  const resetAdditionalsBySize = () => {
    setAdditionalsBySize({})
  }
  
  const updateSizeLimits = (sizes: ProductSize[]) => {
    setSizeLimits(sizes)
  }
  
  // Valor do contexto
  const contextValue: AdditionalsContextType = {
    additionals,
    additionalsByCategory,
    additionalsBySize,
    selectedSize,
    selectedCategoryId,
    selectedAdditionals,
    isDataLoaded,
    
    maxAdditionalsPerSize: currentLimit, // Retorna o limite atual baseado no tamanho
    FREE_ADDITIONALS_LIMIT,
    SIZES_WITH_FREE_ADDITIONALS,
    
    hasFreeAdditionals,
    selectedAdditionalsCount,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    
    setAdditionals,
    setAdditionalsByCategory,
    setSelectedSize,
    setSelectedCategoryId,
    toggleAdditional,
    removeAdditional,
    setIsDataLoaded,
    resetAdditionalsBySize,
    setMaxAdditionalsPerSize,
    updateSizeLimits
  }
  
  return (
    <AdditionalsContext.Provider value={contextValue}>
      {children}
    </AdditionalsContext.Provider>
  )
}
