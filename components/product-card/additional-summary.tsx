"use client"

import { formatCurrency } from "@/lib/utils"
import type { Additional } from "@/lib/services/additional-service"
import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"

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
    selectedAdditionalsCount
  } = useAdditionalsLogic()
  
  if (Object.keys(selectedAdditionals).length === 0) {
    return null
  }

  const isFreeSize = SIZES_WITH_FREE_ADDITIONALS.includes(selectedSize);
  const reachedLimit = isFreeSize && selectedAdditionalsCount >= FREE_ADDITIONALS_LIMIT;

  return (
    <div className="mt-4 p-3 bg-purple-50 rounded-md">
      <h5 className="font-medium text-lg text-purple-900 mb-3">
        Resumo dos complementos premium selecionados
      </h5>
      
      <div className="mb-4">
        <h6 className="font-medium text-sm text-purple-900 border-b pb-1 mb-2 flex justify-between">
          <span>Tamanho: {selectedSize}</span>
          <span className="text-xs text-purple-700">
            {isFreeSize 
              ? `(${selectedAdditionalsCount}/${FREE_ADDITIONALS_LIMIT} grátis)` 
              : `(${selectedAdditionalsCount}/${maxAdditionalsPerSize} máx)`
            }
          </span>
        </h6>
        
        <ul className="space-y-1" data-component-name="AdditionalSummary">
          {Object.values(selectedAdditionals).map(({ additional, quantity }) => (
            <li key={`${selectedSize}-${additional.id}`} className="flex justify-between text-sm">
              <span>
                {quantity}x {additional.name}
              </span>
              <span>{additional.price === 0 ? "Grátis" : formatCurrency(additional.price * quantity)}</span>
            </li>
          ))}
        </ul>
        
        {(isFreeSize && reachedLimit) || (selectedAdditionalsCount >= maxAdditionalsPerSize) ? (
          <p className="text-xs text-purple-700 mt-1 font-medium">
            {selectedAdditionalsCount >= maxAdditionalsPerSize 
              ? `Você atingiu o limite de ${maxAdditionalsPerSize} adicionais para este tamanho.`
              : `Você atingiu o limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis para este tamanho.`
            }
          </p>
        ) : null}
      </div>
    </div>
  )
}
