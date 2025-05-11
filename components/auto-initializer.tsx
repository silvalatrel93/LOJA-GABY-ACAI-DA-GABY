"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function AutoInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar conexão com Supabase
        const supabase = createSupabaseClient()
        const { data, error } = await supabase.from("categories").select("count")

        if (error) {
          console.error("Erro ao conectar com Supabase:", error)
        } else {
          console.log("Conexão com Supabase estabelecida com sucesso")
        }

        setInitialized(true)
      } catch (error) {
        console.error("Erro ao inicializar aplicação:", error)
      }
    }

    initializeApp()
  }, [])

  return null // Este componente não renderiza nada visualmente
}
