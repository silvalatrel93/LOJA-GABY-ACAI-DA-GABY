"use client"

import { ShoppingCart } from "lucide-react"
import type { Product } from "@/lib/services/product-service"
import { Button } from "@/lib/components/ui/button"
import { PriceDisplay } from "@/lib/components/ui/price-display"

interface ProductInfoProps {
  product: Product
  storeColor?: string
}

export function ProductInfo({ product, storeColor = "#8B5CF6" }: ProductInfoProps) {
  return (
    <div className="p-3">
      <h3 
        className="font-bold text-base xs:text-lg sm:text-xl md:text-2xl text-transparent bg-clip-text leading-tight" 
        data-component-name="ProductInfo"
        style={{
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          backgroundImage: `linear-gradient(to right, ${storeColor}, ${storeColor}dd)`
        }}
      >
        {product.name}
      </h3>
      <p className="text-xs xs:text-sm sm:text-base bg-gradient-to-r from-gray-700 to-gray-900 text-transparent bg-clip-text font-medium mt-1 line-clamp-3 sm:line-clamp-4 leading-relaxed break-words whitespace-pre-line" data-component-name="ProductInfo">
        {product.description}
      </p>
      <div className="mt-2 flex justify-between items-center">
        <PriceDisplay 
          price={product.sizes[0]?.price || 0} 
          showPrefix={true} 
          prefixText="A PARTIR DE" 
          storeColor={storeColor}
          data-component-name="ProductInfo"
        />
        <Button 
          variant="primary" 
          size="sm" 
          className="p-1.5 rounded-full" 
          icon={<ShoppingCart size={18} />}
          storeColor={storeColor}
          data-component-name="ProductInfo"
        >
          {/* O Button precisa de children, mesmo que vazio */}
          <span className="sr-only">Ver produto</span>
        </Button>
      </div>
    </div>
  )
}
