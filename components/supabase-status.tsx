"use client"

import { useEffect, useState } from "react"
import { getPersistenceMode } from "@/lib/persistence-manager"
import { isSupabaseAvailable } from "@/lib/supabase-client"

export default function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "available" | "unavailable">("checking")
  const [persistenceMode, setPersistenceMode] = useState<"supabase" | "indexeddb" | "unknown">("unknown")

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Verificar se o Supabase está disponível
        const available = await isSupabaseAvailable()
        setStatus(available ? "available" : "unavailable")

        // Obter o modo de persistência atual
        const mode = getPersistenceMode()
        setPersistenceMode(mode)
      } catch (error) {
        console.error("Erro ao verificar status do Supabase:", error)
        setStatus("unavailable")
      }
    }

    checkStatus()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-lg font-semibold text-purple-900 mb-2">Status do Banco de Dados</h2>

      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium mr-2">Supabase:</span>
          {status === "checking" ? (
            <span className="text-gray-500">Verificando...</span>
          ) : status === "available" ? (
            <span className="text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Disponível
            </span>
          ) : (
            <span className="text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Indisponível
            </span>
          )}
        </div>

        <div className="flex items-center">
          <span className="font-medium mr-2">Modo de Persistência:</span>
          {persistenceMode === "supabase" ? (
            <span className="text-green-600">PostgreSQL (Supabase)</span>
          ) : persistenceMode === "indexeddb" ? (
            <span className="text-orange-600">IndexedDB (Local)</span>
          ) : (
            <span className="text-gray-500">Desconhecido</span>
          )}
        </div>
      </div>
    </div>
  )
}
