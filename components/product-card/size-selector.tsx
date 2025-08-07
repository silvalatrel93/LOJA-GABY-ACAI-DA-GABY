"use client"

import { cleanSizeDisplay } from "@/lib/utils"
import type { ProductSize } from "@/lib/types"
import { Card } from "@/lib/components/ui/card"
import { PriceDisplay } from "@/lib/components/ui/price-display"

interface SizeSelectorProps {
  sizes: ProductSize[]
  selectedSize: string
  onSizeSelect: (size: string) => void
}

export function SizeSelector({ sizes, selectedSize, onSizeSelect }: SizeSelectorProps) {
  // Função para lidar com o clique no botão de tamanho
  const handleSizeClick = (size: string) => {
    // Se o tamanho clicado já estiver selecionado, desseleciona (passa string vazia)
    // Caso contrário, seleciona o tamanho clicado
    onSizeSelect(selectedSize === size ? '' : size)
  }

  // Se não há tamanhos, mostra uma mensagem informativa
  if (sizes.length === 0) {
    return (
      <div className="mt-3 sm:mt-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Este produto não possui variações de tamanho.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 sm:mt-4">
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
        {sizes.map((sizeOption) => (
          <Card
            key={sizeOption.size}
            onClick={() => handleSizeClick(sizeOption.size)}
            selected={selectedSize === sizeOption.size}
            className="flex flex-col items-center justify-center p-1.5 sm:p-3"
          >
            <div className="font-medium text-xs sm:text-base">{cleanSizeDisplay(sizeOption.size)}</div>
            <PriceDisplay 
              price={sizeOption.price} 
              variant="small" 
              className="text-xs sm:text-sm" 
              data-component-name="SizeSelector"
            />
          </Card>
        ))}
      </div>
    </div>
  )
}
