"use client"

import { useEffect, useState } from "react"
import { initializePersistenceManager } from "@/lib/persistence-manager"
import { isSupabaseAvailable } from "@/lib/supabase-client"

export default function SupabaseInitializer() {
  const [status, setStatus] = useState<"checking" | "supabase" | "indexeddb" | "error">("checking")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Inicializando verificação do Supabase...")

        // Verificar se o Supabase está disponível
        const available = await isSupabaseAvailable()

        if (!available) {
          console.warn("Supabase não está disponível. Usando IndexedDB como fallback.")
          setStatus("indexeddb")
          return
        }

        console.log("Supabase está disponível, inicializando gerenciador de persistência...")

        // Inicializar o gerenciador de persistência
        const mode = await initializePersistenceManager()
        setStatus(mode)

        console.log(`Modo de persistência inicializado: ${mode}`)
      } catch (error) {
        console.error("Erro ao inicializar Supabase:", error)
        setError(error instanceof Error ? error.message : String(error))
        setStatus("error")
      }
    }

    initialize()
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
