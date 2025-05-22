"use client"

import { ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/lib/services/product-service"

interface ProductInfoProps {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div className="p-3">
      <h3 
        className="font-bold text-base xs:text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-purple-600 to-purple-900 text-transparent bg-clip-text leading-tight" 
        data-component-name="ProductInfo"
        style={{
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </h3>
      <p className="text-xs xs:text-sm sm:text-base bg-gradient-to-r from-gray-700 to-gray-900 text-transparent bg-clip-text font-medium mt-1 line-clamp-2 sm:line-clamp-3" data-component-name="ProductInfo">
        {product.description}
      </p>
      <div className="mt-2 flex justify-between items-center">
        <div className="font-medium" data-component-name="ProductInfo">
          <span className="text-xs bg-gradient-to-r from-purple-600 to-purple-900 text-transparent bg-clip-text font-bold block">A PARTIR DE</span>
          <span className="bg-gradient-to-r from-green-500 to-green-700 text-transparent bg-clip-text font-bold">
            {formatCurrency(product.sizes[0]?.price || 0)}
          </span>
        </div>
        <button className="text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 flex items-center p-1.5 rounded-full shadow-md transition-colors" data-component-name="ProductInfo">
          <ShoppingCart size={18} />
        </button>
      </div>
    </div>
  )
}
