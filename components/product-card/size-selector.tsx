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

  return (
    <div className="mt-3 sm:mt-4">
      <h4 className="font-medium sm:font-semibold text-gray-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Escolha o tamanho:</h4>
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
