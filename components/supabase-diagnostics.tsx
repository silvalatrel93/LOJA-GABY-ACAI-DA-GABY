"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { checkTablesExist, createTables } from "@/lib/supabase-schema"

export default function SupabaseDiagnostics() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [tablesStatus, setTablesStatus] = useState<"loading" | "exists" | "missing" | "created" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCreatingTables, setIsCreatingTables] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.from("categories").select("count")

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao conectar com Supabase:", error)
        setConnectionStatus("error")
        setErrorMessage(error.message)
        return
      }

      setConnectionStatus("connected")
      checkTables()
    } catch (error) {
      console.error("Erro ao conectar com Supabase:", error)
      setConnectionStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const checkTables = async () => {
    try {
      setTablesStatus("loading")
      const tablesExist = await checkTablesExist()

      if (tablesExist) {
        setTablesStatus("exists")
      } else {
        setTablesStatus("missing")
      }
    } catch (error) {
      console.error("Erro ao verificar tabelas:", error)
      setTablesStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const handleCreateTables = async () => {
    try {
      setIsCreatingTables(true)
      await createTables()
      setTablesStatus("created")
    } catch (error) {
      console.error("Erro ao criar tabelas:", error)
      setTablesStatus("error")
      setErrorMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setIsCreatingTables(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Diagnóstico do Supabase</h2>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Status da Conexão</h3>
        {connectionStatus === "loading" && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded">Verificando conexão...</div>
        )}

        {connectionStatus === "connected" && (
          <div className="bg-green-100 text-green-800 p-2 rounded">Conectado ao Supabase com sucesso!</div>
        )}

        {connectionStatus === "error" && (
          <div className="bg-red-100 text-red-800 p-2 rounded">
            <p className="font-bold">Erro ao conectar:</p>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Status das Tabelas</h3>
        {tablesStatus === "loading" && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded">Verificando tabelas...</div>
        )}

        {tablesStatus === "exists" && (
          <div className="bg-green-100 text-green-800 p-2 rounded">Tabelas existem no banco de dados.</div>
        )}

        {tablesStatus === "missing" && (
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded">
            <p>Tabelas não encontradas no banco de dados.</p>
            <button
              onClick={handleCreateTables}
              disabled={isCreatingTables}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isCreatingTables ? "Criando tabelas..." : "Criar Tabelas"}
            </button>
          </div>
        )}

        {tablesStatus === "created" && (
          <div className="bg-green-100 text-green-800 p-2 rounded">Tabelas criadas com sucesso!</div>
        )}

        {tablesStatus === "error" && (
          <div className="bg-red-100 text-red-800 p-2 rounded">
            <p className="font-bold">Erro ao verificar/criar tabelas:</p>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <p>Nota: Para criar tabelas, você precisa ter permissões de administrador no banco de dados Supabase.</p>
      </div>
    </div>
  )
}
