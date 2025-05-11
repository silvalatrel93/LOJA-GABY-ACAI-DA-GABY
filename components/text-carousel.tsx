"use client"

import { useState, useEffect } from "react"
import { getActivePhrases } from "@/lib/db"

interface TextCarouselProps {
  phrases?: string[] // Opcional agora, pois vamos buscar do banco de dados
}

export default function TextCarousel({ phrases: defaultPhrases }: TextCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [phrases, setPhrases] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar frases do banco de dados
  useEffect(() => {
    const loadPhrases = async () => {
      try {
        setIsLoading(true)
        const activePhrases = await getActivePhrases()

        if (activePhrases.length > 0) {
          // Usar frases do banco de dados
          setPhrases(activePhrases.map((phrase) => phrase.text))
        } else if (defaultPhrases && defaultPhrases.length > 0) {
          // Fallback para frases padrão passadas como prop
          setPhrases(defaultPhrases)
        } else {
          // Fallback para frases padrão hardcoded
          setPhrases([
            "O melhor açaí da cidade! 🍇",
            "Experimente nossos adicionais exclusivos! ✨",
            "Entrega rápida para toda a região! 🚚",
          ])
        }
      } catch (error) {
        console.error("Erro ao carregar frases:", error)
        // Fallback para frases padrão em caso de erro
        if (defaultPhrases && defaultPhrases.length > 0) {
          setPhrases(defaultPhrases)
        } else {
          setPhrases([
            "O melhor açaí da cidade! 🍇",
            "Experimente nossos adicionais exclusivos! ✨",
            "Entrega rápida para toda a região! 🚚",
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPhrases()
  }, [defaultPhrases])

  // Alternar frases automaticamente a cada 4 segundos
  useEffect(() => {
    if (phrases.length <= 1) return // Não alternar se houver apenas uma frase

    const interval = setInterval(() => {
      setIsTransitioning(true)

      // Aguardar a animação de fade-out antes de mudar a frase
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex === phrases.length - 1 ? 0 : prevIndex + 1))

        // Iniciar a animação de fade-in
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50)
      }, 500) // Tempo da animação de fade-out
    }, 4000)

    return () => clearInterval(interval)
  }, [phrases.length])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <div className="h-6 md:h-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (phrases.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4">
      <div className="relative h-6 md:h-8 overflow-hidden">
        <div
          className={`absolute inset-0 flex items-center justify-center text-center transition-opacity duration-500 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-medium text-xs md:text-sm">{phrases[currentIndex]}</p>
        </div>
      </div>
    </div>
  )
}
