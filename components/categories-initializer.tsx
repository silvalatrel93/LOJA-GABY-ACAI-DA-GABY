"use client"

import { useEffect, useState } from "react"
import { initializeDefaultCategories } from "@/lib/db"

export default function CategoriesInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultCategories()
        setInitialized(true)
        localStorage.setItem("categories_initialized", "true")
      } catch (error) {
        console.error("Erro ao inicializar categorias:", error)
      }
    }

    // Verificar se já foi inicializado antes
    const wasInitialized = localStorage.getItem("categories_initialized") === "true"

    if (!wasInitialized) {
      initialize()
    } else {
      console.log("Categorias já foram inicializadas anteriormente, pulando inicialização")
      setInitialized(true)
    }
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
