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
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={handleBackgroundClick}
    >
      {/* Botão de fechar */}
      <button
        onClick={handleCloseButtonClick}
        className="absolute top-4 right-4 bg-white bg-opacity-20 p-2 rounded-full text-white hover:bg-opacity-30 transition-colors z-10"
        aria-label="Fechar"
      >
        <X size={24} />
      </button>

      {/* Imagem ampliada */}
      <div className="relative max-w-[90%] max-h-[90%]">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain"
          onClick={(e) => e.stopPropagation()} // Impedir que cliques na imagem fechem o visualizador
        />
      </div>
    </div>
  )
}
