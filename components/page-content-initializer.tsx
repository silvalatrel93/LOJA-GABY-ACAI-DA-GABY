"use client"

import { useEffect, useState } from "react"
import { initializeDefaultPageContent } from "@/lib/db"

export default function PageContentInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function initialize() {
      try {
        await initializeDefaultPageContent()
        setInitialized(true)
      } catch (error) {
        console.error("Erro ao inicializar conteúdo das páginas:", error)
      }
    }

    initialize()
  }, [])

  return null
}
