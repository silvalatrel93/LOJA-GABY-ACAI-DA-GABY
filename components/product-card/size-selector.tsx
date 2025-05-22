"use client"

import { formatCurrency, cleanSizeDisplay } from "@/lib/utils"
import type { ProductSize } from "@/lib/types"

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
    <div className="mt-4">
      <h4 className="font-semibold text-gray-700 mb-2">Escolha o tamanho:</h4>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
        {sizes.map((sizeOption) => (
          <button
            key={sizeOption.size}
            type="button"
            onClick={() => handleSizeClick(sizeOption.size)}
            className={`border rounded-md flex flex-col items-center justify-center p-2 sm:p-3 transition-colors ${
              selectedSize === sizeOption.size
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
            data-component-name="SizeSelector"
            aria-pressed={selectedSize === sizeOption.size}
          >
            <div className="font-medium text-sm sm:text-base">{cleanSizeDisplay(sizeOption.size)}</div>
            <div className="text-xs sm:text-sm bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold" data-component-name="SizeSelector">
              {formatCurrency(sizeOption.price)}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
