"use client"

import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"
import { Card } from "@/lib/components/ui/card"
import { PriceDisplay } from "@/lib/components/ui/price-display"
import { cn } from "@/lib/utils"

// Interface vazia pois agora usamos o contexto
interface AdditionalSummaryProps {}


export function AdditionalSummary(_props: AdditionalSummaryProps) {
  // Usar o hook personalizado para acessar o contexto
  const {
    selectedAdditionals,
    selectedSize,
    SIZES_WITH_FREE_ADDITIONALS,
    FREE_ADDITIONALS_LIMIT,
    maxAdditionalsPerSize,
    selectedAdditionalsCount,
    additionalsByCategory,
    selectedAdditionalsByCategory,
    reachedCategoryLimit
  } = useAdditionalsLogic()
  
  if (Object.keys(selectedAdditionals).length === 0) {
    return null
  }

  const isFreeSize = SIZES_WITH_FREE_ADDITIONALS.includes(selectedSize);
  const reachedLimit = isFreeSize && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT;

  return (
    <Card 
      className="mt-3 sm:mt-4 bg-purple-50 p-2 sm:p-3"
    >
      <h5 className="font-medium text-sm sm:text-base text-purple-900 mb-2 sm:mb-3">
        Resumo dos complementos premium selecionados
      </h5>
      
      <div className="mb-3 sm:mb-4">
        <h6 className="font-medium text-xs sm:text-sm text-purple-900 border-b pb-1 mb-1.5 sm:mb-2 flex justify-between">
          <span>Tamanho: {selectedSize}</span>
          <span className="text-[10px] sm:text-xs text-purple-700">
            {isFreeSize 
              ? `(${selectedAdditionalsCount}/${FREE_ADDITIONALS_LIMIT} grátis)` 
              : `(${selectedAdditionalsCount}/${maxAdditionalsPerSize} máx)`
            }
          </span>
        </h6>
        
        <ul className="space-y-0.5 sm:space-y-1" data-component-name="AdditionalSummary">
          {Object.values(selectedAdditionals).map(({ additional, quantity }) => (
            <li key={`${selectedSize}-${additional.id}`} className="flex justify-between text-[10px] sm:text-xs">
              <span className="truncate pr-2">
                {quantity}x {additional.name}
              </span>
              <PriceDisplay 
                price={additional.price * quantity} 
                freeText="Grátis"
                className="text-[10px] sm:text-xs flex-shrink-0"
              />
            </li>
          ))}
        </ul>
        
        {(isFreeSize && reachedLimit) || (selectedAdditionalsCount >= maxAdditionalsPerSize) ? (
          <p className="text-[9px] sm:text-xs text-purple-700 mt-1 font-medium">
            {selectedAdditionalsCount >= maxAdditionalsPerSize 
              ? `Você atingiu o limite de ${maxAdditionalsPerSize} adicionais para este tamanho.`
              : `Você atingiu o limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis para este tamanho.`
            }
          </p>
        ) : null}
        
        {/* Limites por categoria */}
        {additionalsByCategory.some(({category}) => category.selectionLimit) && (
          <div className="mt-2 sm:mt-3">
            <h6 className="text-[9px] sm:text-xs font-medium text-purple-900 border-b pb-0.5 sm:pb-1 mb-1">
              Limites por categoria:
            </h6>
            <p className="text-[9px] sm:text-xs text-gray-600 mb-1 sm:mb-2">
              Algumas categorias possuem limites específicos de seleção, independente do limite geral de adicionais.
            </p>
            <ul className="space-y-0.5 sm:space-y-1">
              {additionalsByCategory
                .filter(({category}) => category.selectionLimit)
                .map(({category}) => {
                  const count = selectedAdditionalsByCategory[category.id] || 0;
                  const limit = category.selectionLimit || 0;
                  const isLimitReached = reachedCategoryLimit(category.id);
                  
                  return (
                    <li key={`limit-${category.id}`} className="flex justify-between text-[9px] sm:text-xs">
                      <span className="truncate pr-2">{category.name}</span>
                      <span className={cn(
                        "flex-shrink-0",
                        isLimitReached ? 'text-red-500 font-medium' : 'text-green-600'
                      )}>
                        {count}/{limit}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}
