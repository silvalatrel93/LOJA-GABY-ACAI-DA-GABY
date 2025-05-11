"use client"

import { useEffect, useState } from "react"
import { initializeDefaultCarouselSlides, saveCarouselSlide } from "@/lib/db"

export default function CarouselInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultCarouselSlides()

        // Adicionar a imagem de exemplo do açaí tradicional
        const acaiTradicionalSlide = {
          id: 4,
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_20250509_173410_Chrome.jpg-ulZwC1mLmGtvBm71VyrWH3N9rxghyk.jpeg",
          title: "AÇAÍ TRADICIONAL",
          subtitle: "Experimente nosso açaí tradicional com frutas frescas",
          order: 4,
          active: true,
        }

        await saveCarouselSlide(acaiTradicionalSlide)

        setInitialized(true)
        localStorage.setItem("carousel_initialized", "true")
      } catch (error) {
        console.error("Erro ao inicializar slides do carrossel:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("carousel_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Carrossel já foi inicializado anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
