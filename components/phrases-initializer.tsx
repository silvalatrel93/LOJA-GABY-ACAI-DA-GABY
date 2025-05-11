"use client"

import { useEffect, useState } from "react"
import { initializeDefaultPhrases } from "@/lib/db"

export default function PhrasesInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultPhrases()
        setInitialized(true)
        localStorage.setItem("phrases_initialized", "true")
      } catch (error) {
        console.error("Erro ao inicializar frases:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("phrases_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Frases já foram inicializadas anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
