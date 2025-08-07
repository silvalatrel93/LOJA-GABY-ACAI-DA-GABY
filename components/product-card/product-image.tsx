"use client"

import Image from "next/image"
import { Maximize2 } from "lucide-react"
import { useState } from "react"
import type { MouseEvent } from "react"

interface ProductImageProps {
  image: string
  alt: string
  onOpenViewer: (e: MouseEvent) => void
  size?: "small" | "large"
  priority?: boolean
  loading?: "eager" | "lazy"
  storeColor?: string
}

export function ProductImage({ 
  image, 
  alt, 
  onOpenViewer, 
  size = "small", 
  priority = false,
  loading = "lazy",
  storeColor = "#8B5CF6"
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onOpenViewer(e)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Configuração otimizada de sizes baseada no tamanho do componente
  const getSizes = () => {
    if (size === "large") {
      return "(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw"
    }
    // Para tamanho small (cards dos produtos)
    return "(max-width: 475px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
  }

  return (
    <div 
      className={`relative ${size === "small" ? "h-36" : "h-48"} ${
        size === "large" 
          ? "rounded-lg overflow-hidden mb-4 mx-2 sm:mx-4 md:mx-6 lg:mx-8" 
          : "mx-1 sm:mx-2"
      } group transition-all duration-300 hover:shadow-lg`}
      data-testid="product-image-container"
      onClick={(e) => {
        // Em dispositivos móveis, o próprio contêiner pode disparar o visualizador
        if (window.innerWidth < 640) {
          handleClick(e)
        }
      }}
    >
      <div className="absolute inset-1 sm:inset-2 overflow-hidden rounded-lg bg-gray-100">
        {/* Skeleton loading durante carregamento */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg" />
        )}
        
        <Image 
          src={image || "/placeholder.svg"} 
          alt={alt} 
          fill 
          className={`object-cover transition-all duration-300 md:hover:scale-105 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          sizes={getSizes()}
          priority={priority}
          loading={loading}
          quality={85} // Balanceio entre qualidade e performance
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={(e) => {
            // Em dispositivos móveis, o clique na imagem não faz nada (o contêiner já cuida disso)
            if (window.innerWidth >= 640) {
              handleClick(e)
            }
          }}
        />
        
        {/* Fallback para erro de imagem */}
        {hasError && !image && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-gray-300"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <circle cx="9" cy="9" r="2"></circle>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
            </svg>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleClick} 
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center ${
          size === "small" 
            ? "bg-white bg-opacity-70 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
            : "bg-white bg-opacity-60 p-2 rounded-full shadow-md hover:bg-opacity-80 transition-all"
        }`}
        data-component-name="ProductImage"
        aria-label="Ampliar imagem"
      >
        <Maximize2 
          size={18} 
          className={size === "large" ? "" : "text-gray-800"}
          style={size === "large" ? { color: storeColor } : {}}
        />
      </button>
    </div>
  )
}
