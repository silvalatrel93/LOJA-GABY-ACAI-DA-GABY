"use client"

import { useEffect, useState } from "react"
import { verifySupabaseTables, createSupabaseTables } from "@/lib/supabase-schema"
import { isSupabaseAvailable } from "@/lib/supabase-client"

export default function SupabaseSchemaInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Verificar se o Supabase está disponível
        const available = await isSupabaseAvailable()

        if (!available) {
          console.log("Supabase não está disponível, pulando inicialização de esquema")
          return
        }

        // Verificar se as tabelas existem
        const tablesExist = await verifySupabaseTables()

        if (!tablesExist) {
          console.log("Tabelas não existem no Supabase, criando...")
          const created = await createSupabaseTables()

          if (created) {
            console.log("Tabelas criadas com sucesso no Supabase")
            setInitialized(true)
          } else {
            console.error("Falha ao criar tabelas no Supabase")
            setError("Falha ao criar tabelas no Supabase")
          }
        } else {
          console.log("Tabelas já existem no Supabase")
          setInitialized(true)
        }
      } catch (error) {
        console.error("Erro ao inicializar esquema do Supabase:", error)
        setError(error instanceof Error ? error.message : String(error))
      }
    }

    initialize()
  }, [])

  // Este componente não renderiza nada visualmente
  return null
}
