"use client"

import type React from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ImageViewerProps {
  imageUrl: string
  alt: string
  onClose: () => void
}

export default function ImageViewer({ imageUrl, alt, onClose }: ImageViewerProps) {
  // Impedir o scroll da página enquanto o visualizador está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  // Fechar o visualizador ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Função para fechar o visualizador quando clicar fora da imagem
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Função para fechar o visualizador quando clicar no botão X
  const handleCloseButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Impedir a propagação do evento para evitar conflitos
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center touch-none"
      onClick={handleBackgroundClick}
    >
      {/* Botão de fechar */}
      <button
        onClick={handleCloseButtonClick}
        className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-800 hover:from-purple-600 hover:to-purple-900 p-2 rounded-full text-white shadow-sm transition-all duration-200 z-10"
        aria-label="Fechar"
      >
        <X size={24} />
      </button>

      {/* Imagem ampliada */}
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className="relative w-full h-full max-w-full max-h-[90%] flex items-center justify-center">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={alt}
            className="max-w-full max-h-full object-contain touch-manipulation transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()} // Impedir que cliques na imagem fechem o visualizador
            style={{
              // Melhora o redimensionamento em dispositivos móveis
              transformOrigin: 'center',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            // Atributos para melhorar a experiência em dispositivos móveis
            draggable={false}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            loading="eager" // Carregamento imediato para o visualizador
          />
        </div>
      </div>
      
      {/* Indicador de toque para dispositivos móveis */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-white text-sm opacity-70">
        Toque fora da imagem para fechar
      </div>
    </div>
  )
}
