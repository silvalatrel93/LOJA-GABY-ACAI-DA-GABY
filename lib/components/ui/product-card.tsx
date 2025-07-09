"use client"

import { ReactNode } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PriceDisplay } from "./price-display"
import { Button } from "./button"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  title: string
  description?: string
  price: number
  image?: string
  badges?: string[]
  onClick?: () => void
  onAddToCart?: () => void
  className?: string
  children?: ReactNode
  disabled?: boolean
  showAddToCartButton?: boolean
  showPrice?: boolean
  pricePrefix?: string
  showPricePrefix?: boolean
}

export function ProductCard({
  title,
  description,
  price,
  image,
  badges = [],
  onClick,
  onAddToCart,
  className,
  children,
  disabled = false,
  showAddToCartButton = true,
  showPrice = true,
  pricePrefix,
  showPricePrefix = false
}: ProductCardProps) {
  return (
    <div 
      className={cn(
        "border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Imagem do produto */}
      {image && (
        <div className="relative h-40 w-full bg-gray-100">
          <Image 
            src={image} 
            alt={title}
            fill
            className="object-cover"
          />
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {badges.map((badge, index) => (
                <span 
                  key={index}
                  className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Conteúdo do cartão */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          {/* Preço */}
          {showPrice && (
            <PriceDisplay 
              price={price} 
              showPrefix={showPricePrefix}
              prefixText={pricePrefix}
            />
          )}
          
          {/* Botão de adicionar ao carrinho */}
          {showAddToCartButton && onAddToCart && (
            <Button
              variant="primary"
              size="sm"
              icon={<ShoppingCart size={16} />}
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart()
              }}
              disabled={disabled}
            >
              <span className="sr-only">Adicionar ao carrinho</span>
            </Button>
          )}
        </div>
        
        {/* Conteúdo adicional */}
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
