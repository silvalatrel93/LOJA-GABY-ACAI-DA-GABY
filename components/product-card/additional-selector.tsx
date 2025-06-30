"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Plus, ShoppingCart, Check } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"

import type { Product } from "@/lib/services/product-service"

interface AdditionalSelectorProps {
  product: Product
}

export function AdditionalSelector({ product }: AdditionalSelectorProps) {
  // Usar o hook personalizado para acessar o contexto
  const {
    additionals,
    additionalsByCategory,
    selectedAdditionals,
    toggleAdditional,
    hasFreeAdditionals,
    reachedFreeAdditionalsLimit,
    reachedMaxAdditionalsLimit,
    FREE_ADDITIONALS_LIMIT,
    maxAdditionalsPerSize,
    isAdditionalSelected,
    loadAdditionalsData,
    isDataLoaded,
    selectedAdditionalsByCategory,
    reachedCategoryLimit
  } = useAdditionalsLogic(product)
  
  // Carregar adicionais quando o componente for montado
  useEffect(() => {
    if (product && !isDataLoaded) {
      loadAdditionalsData()
    }
  }, [product, isDataLoaded, loadAdditionalsData])
  
  // Função para verificar se um botão de adicional deve ser desabilitado
  const isDisabled = (additional: Additional, isSelected: boolean): boolean => {
    // Se o adicional já está selecionado, nunca deve ser desabilitado
    if (isSelected) return false
    
    // Se atingiu o limite máximo de adicionais ou o limite da categoria e este não está selecionado, desabilitar
    return reachedMaxAdditionalsLimit || reachedCategoryLimit(additional.categoryId)
  }
  
  if (!isDataLoaded || additionalsByCategory.length === 0) {
    return null
  }
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between w-full text-left mb-3">
        <h4 className="font-semibold text-gray-700">Adicionais Complementos:</h4>
      </div>
      
      {/* Renderizar adicionais agrupados por categoria */}
      {additionalsByCategory.map(({ category, additionals }) => (
        <div key={category.id} className="mb-6" data-component-name="AdditionalCategoryGroup">
          {/* Nome da categoria e informações de limite */}
          <div className="flex flex-col mb-2 pb-1 border-b border-purple-200">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-purple-700">
                {category.name}
              </h5>
              {category.selectionLimit && (
                <div className="text-xs text-gray-600">
                  <span className={`font-medium ${reachedCategoryLimit(category.id) ? 'text-red-500' : 'text-green-600'}`}>
                    {selectedAdditionalsByCategory[category.id] || 0}
                  </span>
                  <span> / {category.selectionLimit}</span>
                </div>
              )}
            </div>
            
            {/* Mensagem informativa quando o limite da categoria for atingido */}
            {category.selectionLimit && reachedCategoryLimit(category.id) && (
              <div className="text-xs text-red-500 mt-1 animate-pulse text-center">
                Limite de {category.selectionLimit} itens desta categoria atingido
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-component-name="AdditionalSelector">
            {additionals.map((additional: Additional) => {
              // Verificar se este adicional já foi selecionado
              const isSelected = isAdditionalSelected(additional.id);
              // Verificar se o botão deve ser desabilitado
              const isButtonDisabled = isDisabled(additional, isSelected);
              
              return (
                <div key={additional.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50" data-component-name="AdditionalSelector">
                  <div className="flex items-center flex-1 pr-2">
                    <div className="w-8 h-8 relative mr-2 bg-purple-100 rounded-md overflow-hidden flex-shrink-0">
                      {additional.image ? (
                        <Image
                          src={additional.image || "/placeholder.svg"}
                          alt={additional.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-purple-300">
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm bg-gradient-to-r from-gray-700 to-black text-transparent bg-clip-text" data-component-name="AdditionalSelector">{additional.name}</p>
                      <p className="text-xs bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="AdditionalSelector">
                        {additional.price > 0 ? formatCurrency(additional.price) : "Grátis"}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAdditional(additional)}
                    disabled={isDisabled(additional, isSelected)}
                    className={`p-2 rounded-md flex items-center justify-center transition-colors shadow-sm ${isSelected 
                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700' 
                      : isDisabled(additional, isSelected)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-400 to-purple-700 text-white hover:from-purple-500 hover:to-purple-800'}`}
                    title={hasFreeAdditionals && reachedFreeAdditionalsLimit && !isSelected ? 
                      `Limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis atingido` : 
                          reachedMaxAdditionalsLimit && !isSelected ?
                          `Limite de ${maxAdditionalsPerSize} adicionais atingido para este tamanho` :
                          reachedCategoryLimit(additional.categoryId) && !isSelected ?
                          `Limite de ${additionalsByCategory.find(item => item.category.id === additional.categoryId)?.category.selectionLimit} adicionais desta categoria atingido` :
                      isSelected ? "Remover" : "Adicionar"}
                    data-component-name="AdditionalSelector"
                  >
                    {isSelected ? (
                      <Check size={18} className="text-white" />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
