"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import type { CarouselSlide } from "@/lib/services/carousel-service"
import { createSafeKey } from "@/lib/key-utils"

interface HeroCarouselProps {
  slides: CarouselSlide[]
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Função para ir para o próximo slide
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length)
  }

  // Função para ir para o slide anterior
  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length)
  }

  // Função para ir para um slide específico
  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    resetAutoPlayTimer()
  }

  // Resetar o timer de reprodução automática
  const resetAutoPlayTimer = () => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }

    // Pausar a reprodução automática temporariamente
    setIsAutoPlaying(false)

    // Retomar a reprodução automática após 5 segundos de inatividade
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 5000)
  }

  // Configurar a reprodução automática
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return

    autoPlayTimeoutRef.current = setTimeout(() => {
      goToNext()
    }, 5000)

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
    }
  }, [currentIndex, isAutoPlaying, slides.length])

  // Se não houver slides, não renderizar nada
  if (slides.length === 0) {
    return null
  }

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        marginTop: "0", 
        marginBottom: "0",
      }}
    >
      {/* Container do carrossel com altura responsiva */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96">
        {/* Slides com efeito de fade */}
        {slides.map((slide, index) => (
          <div
            key={createSafeKey(slide.id, 'hero-slide', index)}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: currentIndex === index ? 1 : 0 }}
          >
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.title || "Banner promocional"}
              fill
              className="object-contain"
              priority={currentIndex === index}
            />
            {(slide.title || slide.subtitle) && (
              <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                {slide.title && <h2 className="text-xl font-bold">{slide.title}</h2>}
                {slide.subtitle && <p className="text-sm">{slide.subtitle}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
