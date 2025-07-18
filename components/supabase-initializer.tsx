"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function SupabaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const supabase = createSupabaseClient()

        // Apenas verificar se o Supabase está disponível - NÃO inicializar dados mockup
        try {
          const { data, error } = await supabase.from("categories").select("count")
          if (error) throw error
          console.log("✅ Conexão com Supabase estabelecida")
        } catch (err) {
          console.error("Erro ao conectar com Supabase:", err)
          setError("Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.")
          return
        }

        setInitialized(true)
      } catch (err) {
        console.error("Erro durante a verificação de conexão:", err)
        setError(`Erro durante a verificação de conexão: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    initializeConnection()
  }, [])

  // Renderizar mensagem de erro, se houver
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro de Conexão</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-600">Verifique as variáveis de ambiente e a conexão com o Supabase.</p>
        </div>
      </div>
    )
  }

  // Componente não renderiza nada visualmente quando não há erro
  return null
}
