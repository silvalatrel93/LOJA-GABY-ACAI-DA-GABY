"use client"

import { useState, useEffect } from "react"
import type { Phrase } from "@/lib/services/phrase-service"

interface TextCarouselProps {
  phrases: Phrase[]
}

export default function TextCarousel({ phrases }: TextCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Avançar para o próximo slide automaticamente
  useEffect(() => {
    if (!isAutoPlaying || phrases.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, phrases.length])

  // Pausar a reprodução automática quando o usuário interage
  const handleManualNavigation = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)

    // Retomar a reprodução automática após 10 segundos de inatividade
    setTimeout(() => {
      setIsAutoPlaying(true)
    }, 10000)
  }

  if (!phrases || phrases.length === 0) {
    return null
  }

  return (
    <div className="relative overflow-hidden bg-purple-900 text-white py-2 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-center h-full">
        <div className="w-full overflow-hidden">
          <div
            className="transition-transform duration-500 ease-in-out flex"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {phrases.map((phrase, index) => (
              <div
                key={phrase.id}
                className="min-w-full flex items-center justify-center text-center text-white text-sm md:text-base font-medium px-4"
              >
                {phrase.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
