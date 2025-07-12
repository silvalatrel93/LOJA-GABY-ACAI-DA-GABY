"use client"

import { useEffect } from "react"

interface ImagePreloaderProps {
  imageUrls: string[]
  maxPreload?: number
}

export function ImagePreloader({ imageUrls, maxPreload = 6 }: ImagePreloaderProps) {
  useEffect(() => {
    // Precarregar apenas as primeiras imagens (mais importantes)
    const urlsToPreload = imageUrls.slice(0, maxPreload).filter(Boolean)
    
    urlsToPreload.forEach((url) => {
      if (url && url !== "/placeholder.svg") {
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "image"
        link.href = url
        link.crossOrigin = "anonymous"
        document.head.appendChild(link)
        
        // Limpeza após 30 segundos para não sobrecarregar a memória
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link)
          }
        }, 30000)
      }
    })
  }, [imageUrls, maxPreload])

  return null // Componente não renderiza nada visualmente
} 