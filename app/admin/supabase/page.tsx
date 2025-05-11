"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import DataMigration from "@/components/data-migration"

export default function SupabasePage() {
  const [tablesStatus, setTablesStatus] = useState<"checking" | "exists" | "not_exists" | "error">("checking")
  const [errorMessage, setErrorMessage] = useState("")
  const [isCreatingTables, setIsCreatingTables] = useState(false)
  const [createTablesMessage, setCreateTablesMessage] = useState("")

  useEffect(() => {
    checkTables()
  }, [])

  async function checkTables() {
    try {
      setTablesStatus("checking")
      const supabase = createSupabaseClient()

      // Verificar se a tabela categories existe
      const { data, error } = await supabase.from("categories").select("count(*)", { count: "exact", head: true })

      if (error) {
        if (error.code === "42P01") {
          // Código para "relation does not exist"
          setTablesStatus("not_exists")
        } else {
          setTablesStatus("error")
          setErrorMessage(`Erro ao verificar tabelas: ${error.message}`)
        }
      } else {
        setTablesStatus("exists")
      }
    } catch (error) {
      setTablesStatus("error")
      setErrorMessage(`Erro ao verificar tabelas: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function handleCreateTables() {
    try {
      setIsCreatingTables(true)
      setCreateTablesMessage("Criando tabelas...")

      const supabase = createSupabaseClient()
      const { error } = await supabase.rpc("create_tables")

      if (error) {
        setCreateTablesMessage(`Erro ao criar tabelas: ${error.message}`)
      } else {
        setCreateTablesMessage("Tabelas criadas com sucesso!")
        // Verificar novamente após criar as tabelas
        await checkTables()
      }
    } catch (error) {
      setCreateTablesMessage(`Erro ao criar tabelas: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCreatingTables(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-purple-900 mb-6">Integração com Supabase</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Status das Tabelas</h2>

        {tablesStatus === "checking" ? (
          <p className="text-gray-600">Verificando tabelas no Supabase...</p>
        ) : tablesStatus === "exists" ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p className="text-green-700">As tabelas necessárias já existem no Supabase.</p>
          </div>
        ) : tablesStatus === "not_exists" ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md mb-4">
            <p className="text-yellow-700 mb-3">
              As tabelas necessárias não existem no Supabase. Você precisa criá-las antes de migrar os dados.
            </p>
            <button
              onClick={handleCreateTables}
              disabled={isCreatingTables}
              className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isCreatingTables ? "Criando Tabelas..." : "Criar Tabelas"}
            </button>
            {createTablesMessage && <p className="mt-2 text-sm">{createTablesMessage}</p>}
          </div>
        ) : (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700">{errorMessage}</p>
            <button
              onClick={checkTables}
              className="mt-3 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-medium"
            >
              Verificar Novamente
            </button>
          </div>
        )}
      </div>

      {tablesStatus === "exists" && <DataMigration />}
    </div>
  )
}
