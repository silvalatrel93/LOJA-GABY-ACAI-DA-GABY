"use client"

import { useEffect, useRef } from "react"

interface ImagePreloaderProps {
  imageUrls: string[]
  maxPreload?: number
  delay?: number // Delay antes de iniciar o preload
}

export function ImagePreloader({ imageUrls, maxPreload = 6, delay = 1000 }: ImagePreloaderProps) {
  const preloadedUrls = useRef(new Set<string>())
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    // Limpar timeout anterior se houver
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Aguardar um delay antes de iniciar o preload para evitar warnings
    timeoutRef.current = setTimeout(() => {
      // Precarregar apenas as primeiras imagens (mais importantes)
      const urlsToPreload = imageUrls
        .slice(0, maxPreload)
        .filter(Boolean)
        .filter(url => url !== "/placeholder.svg" && !preloadedUrls.current.has(url))

      urlsToPreload.forEach((url, index) => {
        // Adicionar um pequeno delay entre cada preload para distribuir a carga
        setTimeout(() => {
          if (url && !preloadedUrls.current.has(url)) {
            // Usar Image() ao invés de link preload para evitar warnings
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src = url

            // Marcar como precarregado
            preloadedUrls.current.add(url)

            // Opcional: remover da memória após um tempo
            setTimeout(() => {
              preloadedUrls.current.delete(url)
            }, 60000) // 1 minuto
          }
        }, index * 100) // 100ms de delay entre cada imagem
      })
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [imageUrls, maxPreload, delay])

  return null // Componente não renderiza nada visualmente
}