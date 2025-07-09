"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Plus, ShoppingCart, Check } from "lucide-react"
import type { Additional } from "@/lib/services/additional-service"
import type { AdditionalCategory } from "@/lib/services/additional-category-service"
import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"
import type { Product } from "@/lib/services/product-service"

// Componentes reutilizáveis
import { Card } from "@/lib/components/ui/card"
import { PriceDisplay } from "@/lib/components/ui/price-display"
import { ToggleButton } from "@/lib/components/ui/toggle-button"

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
  
  // Função para gerar o título do botão de toggle
  const getToggleButtonTitle = (additional: Additional, isSelected: boolean): string => {
    if (isSelected) return "Remover"
    
    if (hasFreeAdditionals && reachedFreeAdditionalsLimit) {
      return `Limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis atingido`
    }
    
    if (reachedMaxAdditionalsLimit) {
      return `Limite de ${maxAdditionalsPerSize} adicionais atingido para este tamanho`
    }
    
    if (reachedCategoryLimit(additional.categoryId)) {
      const categoryLimit = additionalsByCategory.find(
        item => item.category.id === additional.categoryId
      )?.category.selectionLimit
      
      return `Limite de ${categoryLimit} adicionais desta categoria atingido`
    }
    
    return "Adicionar"
  }
  
  if (!isDataLoaded || additionalsByCategory.length === 0) {
    return null
  }
  
  return (
    <div className="mt-3 sm:mt-4">
      <div className="flex items-center justify-between w-full text-left mb-2">
        <h4 className="font-medium text-gray-700 text-xs sm:text-sm">Adicionais Complementos:</h4>
      </div>
      
      {/* Renderizar adicionais agrupados por categoria */}
      {additionalsByCategory.map(({ category, additionals }) => (
        <div key={category.id} className="mb-3 sm:mb-4" data-component-name="AdditionalCategoryGroup">
          {/* Nome da categoria e informações de limite */}
          <div className="flex flex-col mb-1 sm:mb-1.5 pb-0.5 border-b border-purple-200">
            <div className="flex justify-between items-center">
              <h5 className="font-medium text-purple-700 text-[10px] sm:text-xs">
                {category.name}
              </h5>
              {category.selectionLimit && (
                <div className="text-[9px] sm:text-xs text-gray-600">
                  <span className={`font-medium ${reachedCategoryLimit(category.id) ? 'text-red-500' : 'text-green-600'}`}>
                    {selectedAdditionalsByCategory[category.id] || 0}
                  </span>
                  <span> / {category.selectionLimit}</span>
                </div>
              )}
            </div>
            
            {/* Mensagem informativa quando o limite da categoria for atingido */}
            {category.selectionLimit && reachedCategoryLimit(category.id) && (
              <div className="text-[9px] sm:text-xs text-red-500 mt-0.5 animate-pulse text-center">
                Limite de {category.selectionLimit} itens desta categoria atingido
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-1 sm:gap-1.5" data-component-name="AdditionalSelector">
            {additionals.map((additional: Additional) => {
              // Verificar se este adicional já foi selecionado
              const isSelected = isAdditionalSelected(additional.id);
              // Verificar se o botão deve ser desabilitado
              const isButtonDisabled = isDisabled(additional, isSelected);
              
              return (
                <Card
                  key={additional.id}
                  className="flex items-center justify-between p-1 sm:p-1.5"
                  hoverable={false}
                  data-component-name="AdditionalSelector"
                >
                  <div className="flex items-center flex-1 pr-1 min-w-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative mr-1 sm:mr-1.5 bg-purple-100 rounded-md overflow-hidden flex-shrink-0">
                      {additional.image ? (
                        <Image
                          src={additional.image || "/placeholder.svg"}
                          alt={additional.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-purple-300">
                          <Plus size={10} className="sm:w-3 sm:h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium text-[10px] sm:text-xs bg-gradient-to-r from-gray-700 to-black text-transparent bg-clip-text text-clamp-2 leading-tight" data-component-name="AdditionalSelector">
                        {additional.name}
                      </p>
                      <PriceDisplay 
                        price={additional.price} 
                        variant="small" 
                        showPrefix={false}
                        className="text-[9px] sm:text-xs mt-0.5"
                        freeText="Grátis"
                      />
                    </div>
                  </div>
                  
                  <ToggleButton
                    onClick={() => toggleAdditional(additional)}
                    disabled={isButtonDisabled}
                    selected={isSelected}
                    variant="primary"
                    selectedVariant="success"
                    title={getToggleButtonTitle(additional, isSelected)}
                    icon={<ShoppingCart size={12} className="sm:w-4 sm:h-4" />}
                    selectedIcon={<Check size={12} className="sm:w-4 sm:h-4 text-white" />}
                    data-component-name="AdditionalSelector"
                    className="ml-1 flex-shrink-0"
                  >
                    <span className="sr-only">
                      {isSelected ? "Remover" : "Adicionar"}
                    </span>
                  </ToggleButton>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
