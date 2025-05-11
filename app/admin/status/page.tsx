"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function StatusPage() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [envVars, setEnvVars] = useState<{ [key: string]: string | undefined }>({})

  useEffect(() => {
    // Verificar variáveis de ambiente
    setEnvVars({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5) + "...", // Mostrar apenas os primeiros 5 caracteres por segurança
    })

    const checkConnection = async () => {
      try {
        const supabase = createSupabaseClient()

        // Verificar conexão
        const { data, error } = await supabase.from("categories").select("count")

        if (error) {
          console.error("Erro ao conectar com Supabase:", error)
          setStatus("error")
          setErrorMessage(error.message)
          return
        }

        // Listar tabelas usando uma consulta direta à tabela pg_tables
        const { data: tablesData, error: tablesError } = await supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")

        if (tablesError) {
          console.error("Erro ao listar tabelas:", tablesError)
          // Não falhar completamente se não conseguir listar as tabelas
        } else if (tablesData) {
          setTables(tablesData.map((row: any) => row.tablename))
        }

        setStatus("connected")
      } catch (error) {
        console.error("Erro ao conectar com Supabase:", error)
        setStatus("error")
        setErrorMessage(error instanceof Error ? error.message : String(error))
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Status do Supabase</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Conexão</h2>
        {status === "loading" && (
          <div className="bg-yellow-100 text-yellow-800 p-3 rounded">Conectando ao Supabase...</div>
        )}

        {status === "connected" && (
          <div className="bg-green-100 text-green-800 p-3 rounded">Conectado ao Supabase com sucesso!</div>
        )}

        {status === "error" && (
          <div className="bg-red-100 text-red-800 p-3 rounded">
            <p className="font-bold">Erro ao conectar:</p>
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Variáveis de Ambiente</h2>
        <div className="bg-gray-100 p-3 rounded">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="mb-1">
              <span className="font-mono">{key}:</span>{" "}
              {value ? (
                <span className="text-green-600">Definido</span>
              ) : (
                <span className="text-red-600">Não definido</span>
              )}
              {value && <span className="ml-2 font-mono text-sm">{value}</span>}
            </div>
          ))}
        </div>
      </div>

      {tables.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Tabelas Disponíveis</h2>
          <ul className="bg-gray-100 p-3 rounded">
            {tables.map((table) => (
              <li key={table} className="mb-1 font-mono">
                {table}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Próximos Passos</h2>
        <ul className="list-disc pl-5">
          <li className="mb-1">Verifique se as variáveis de ambiente estão configuradas corretamente</li>
          <li className="mb-1">Verifique se o banco de dados Supabase está acessível</li>
          <li className="mb-1">Verifique se as tabelas necessárias foram criadas</li>
          <li className="mb-1">Verifique os logs do console para mais detalhes sobre erros</li>
        </ul>
      </div>
    </div>
  )
}
