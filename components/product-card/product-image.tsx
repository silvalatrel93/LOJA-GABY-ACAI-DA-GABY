"use client"

import Image from "next/image"
import { Maximize2 } from "lucide-react"
import type { MouseEvent } from "react"

interface ProductImageProps {
  image: string
  alt: string
  onOpenViewer: (e: MouseEvent) => void
  size?: "small" | "large"
}

export function ProductImage({ image, alt, onOpenViewer, size = "small" }: ProductImageProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    onOpenViewer(e)
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
      <div className="absolute inset-1 sm:inset-2 overflow-hidden rounded-lg">
        <Image 
          src={image || "/placeholder.svg"} 
          alt={alt} 
          fill 
          className="object-cover transition-transform duration-300 md:hover:scale-105" 
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          onClick={(e) => {
            // Em dispositivos móveis, o clique na imagem não faz nada (o contêiner já cuida disso)
            if (window.innerWidth >= 640) {
              handleClick(e)
            }
          }}
        />
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
        <Maximize2 size={18} className={size === "large" ? "text-purple-700" : "text-gray-800"} />
      </button>
    </div>
  )
}
