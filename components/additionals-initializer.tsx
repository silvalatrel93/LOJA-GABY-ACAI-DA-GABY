"use client"

import { useEffect, useState } from "react"
import { initializeDefaultAdditionals } from "@/lib/db"

export default function AdditionalsInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultAdditionals()
        setInitialized(true)
        localStorage.setItem("additionals_initialized", "true")
      } catch (error) {
        console.error("Erro ao inicializar adicionais:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("additionals_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Adicionais já foram inicializados anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
