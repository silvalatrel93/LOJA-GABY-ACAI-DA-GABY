"use client"

import { useEffect, useState } from "react"
import { getPersistenceMode } from "@/lib/persistence-manager"
import { createSupabaseClient } from "@/lib/supabase-client"
import {
  initializeDefaultCategories,
  initializeDefaultProducts,
  initializeDefaultCarouselSlides,
  initializeDefaultPhrases,
  initializeDefaultAdditionals,
} from "@/lib/db"

export default function AutoInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar se estamos usando o Supabase
        const mode = getPersistenceMode()
        if (mode !== "supabase") {
          return
        }

        // Verificar se já existem dados no Supabase
        const supabase = createSupabaseClient()
        const { data: categories } = await supabase.from("categories").select("id")

        // Se não existirem categorias, inicializar os dados padrão
        if (!categories || categories.length === 0) {
          console.log("Inicializando dados padrão no Supabase...")

          // Inicializar dados padrão
          await initializeDefaultCategories()
          await initializeDefaultProducts([])
          await initializeDefaultCarouselSlides()
          await initializeDefaultPhrases()
          await initializeDefaultAdditionals()

          console.log("Dados padrão inicializados com sucesso no Supabase!")
        }

        setInitialized(true)
      } catch (error) {
        console.error("Erro ao inicializar dados no Supabase:", error)
      }
    }

    initialize()
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
