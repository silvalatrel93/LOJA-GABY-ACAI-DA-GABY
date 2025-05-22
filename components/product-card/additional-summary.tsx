"use client"

import { formatCurrency } from "@/lib/utils"
import type { Additional } from "@/lib/services/additional-service"
import { useAdditionalsLogic } from "@/lib/hooks/use-additionals-logic"

// Interface vazia pois agora usamos o contexto
interface AdditionalSummaryProps {}

export function AdditionalSummary(_props: AdditionalSummaryProps) {
  // Usar o hook personalizado para acessar o contexto
  const {
    additionalsBySize,
    SIZES_WITH_FREE_ADDITIONALS,
    FREE_ADDITIONALS_LIMIT,
    MAX_ADDITIONALS_PER_SIZE,
    selectedSize,
    removeAdditional,
    groupedAdditionals
  } = useAdditionalsLogic()
  if (Object.keys(additionalsBySize).length === 0) {
    return null
  }

  return (
    <div className="mt-4 p-3 bg-purple-50 rounded-md">
      <h5 className="font-medium text-lg text-purple-900 mb-3">
        Resumo dos complementos premium selecionados
      </h5>
      
      {Object.keys(additionalsBySize).map(size => {
        const sizeAdditionals = additionalsBySize[size] || {};
        const additionalCount = Object.keys(sizeAdditionals).length;
        
        // Pular tamanhos sem complementos premium
        if (additionalCount === 0) return null;
        
        const isFreeSize = SIZES_WITH_FREE_ADDITIONALS.includes(size);
        const reachedLimit = isFreeSize && additionalCount >= FREE_ADDITIONALS_LIMIT;
        
        return (
          <div key={size} className="mb-4">
            <h6 className="font-medium text-sm text-purple-900 border-b pb-1 mb-2 flex justify-between">
              <span>Tamanho: {size}</span>
              <span className="text-xs text-purple-700">
                {isFreeSize 
                  ? `(${additionalCount}/${FREE_ADDITIONALS_LIMIT} grátis)` 
                  : `(${additionalCount}/${MAX_ADDITIONALS_PER_SIZE} máx)`
                }
              </span>
            </h6>
            
            <ul className="space-y-1" data-component-name="AdditionalSummary">
              {/* Usar os adicionais agrupados do contexto */}
              {(() => {
                // Agrupar complementos premium por categoria
                const groupedByCategory: Record<string, { additional: Additional; quantity: number }[]> = {};
                
                // Converter os adicionais do objeto para um array tipado
                const additionalItems = Object.entries(sizeAdditionals).map(([id, data]) => {
                  return { id: Number(id), ...data };
                });
                
                // Agrupar por categoria
                additionalItems.forEach(({ additional, quantity }) => {
                  const categoryName = additional.categoryName || "Outros";
                  if (!groupedByCategory[categoryName]) {
                    groupedByCategory[categoryName] = [];
                  }
                  groupedByCategory[categoryName].push({ additional, quantity });
                });
                
                // Renderizar os grupos de categorias
                return Object.entries(groupedByCategory).map(([categoryName, items]) => (
                  <div key={`${size}-${categoryName}`} className="mb-2">
                    <div className="text-xs font-medium text-purple-700 mb-1">{categoryName}</div>
                    {items.map(({ additional, quantity }) => (
                      <li key={`${size}-${additional.id}`} className="flex justify-between text-sm">
                        <span>
                          {quantity}x {additional.name}
                        </span>
                        <span>{additional.price === 0 ? "Grátis" : formatCurrency(additional.price * quantity)}</span>
                      </li>
                    ))}
                  </div>
                ));
              })()}
            </ul>
            
            {(isFreeSize && reachedLimit) || (additionalCount >= MAX_ADDITIONALS_PER_SIZE) ? (
              <p className="text-xs text-purple-700 mt-1 font-medium">
                {additionalCount >= MAX_ADDITIONALS_PER_SIZE 
                  ? `Você atingiu o limite de ${MAX_ADDITIONALS_PER_SIZE} adicionais para este tamanho.`
                  : `Você atingiu o limite de ${FREE_ADDITIONALS_LIMIT} complementos premium grátis para este tamanho.`
                }
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  )
}
