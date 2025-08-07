"use client"

import type React from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ImageViewerProps {
  imageUrl: string
  alt: string
  onClose: () => void
  storeColor?: string
}

export default function ImageViewer({ imageUrl, alt, onClose, storeColor = "#8B5CF6" }: ImageViewerProps) {
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
      {/* Botão de fechar - posicionamento responsivo */}
      <button
        onClick={handleCloseButtonClick}
        className="absolute top-4 right-4 sm:top-4 sm:right-4 max-sm:top-auto max-sm:bottom-8 max-sm:right-4 p-2 rounded-full text-white shadow-sm transition-all duration-200 z-10"
        style={{
          background: `linear-gradient(to right, ${storeColor}, ${storeColor}dd)`,
          filter: 'brightness(0.9)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(0.9)'
        }}
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
    </div>
  )
}
