"use client"

import { useState } from "react"
import { exportAllData } from "@/lib/db"
import { migrateDataToSupabase } from "@/lib/supabase-migration"
import { migrateToSupabase } from "@/lib/persistence-manager"

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "migrating" | "success" | "error">("idle")
  const [migrationMessage, setMigrationMessage] = useState("")
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationLog, setMigrationLog] = useState<string[]>([])

  const handleMigration = async () => {
    if (isMigrating) return

    if (
      !confirm("Tem certeza que deseja migrar todos os dados para o Supabase? Este processo pode levar alguns minutos.")
    ) {
      return
    }

    try {
      setIsMigrating(true)
      setMigrationStatus("migrating")
      setMigrationMessage("Exportando dados do IndexedDB...")
      setMigrationProgress(10)
      setMigrationLog(["Iniciando migração...", "Exportando dados do IndexedDB..."])

      // Exportar dados do IndexedDB
      const data = await exportAllData()

      // Registrar quantos itens serão migrados
      const logItems = [
        `Produtos: ${data.products?.length || 0}`,
        `Categorias: ${data.categories?.length || 0}`,
        `Adicionais: ${data.additionals?.length || 0}`,
        `Slides do carrossel: ${data.carousel?.length || 0}`,
        `Frases: ${data.phrases?.length || 0}`,
        `Pedidos: ${data.orders?.length || 0}`,
      ]

      setMigrationLog((prev) => [
        ...prev,
        "Dados exportados com sucesso:",
        ...logItems,
        "Iniciando migração para o Supabase...",
      ])
      setMigrationProgress(30)
      setMigrationMessage("Dados exportados com sucesso. Iniciando migração para o Supabase...")

      // Migrar dados para o Supabase
      await migrateDataToSupabase(data, (progress, message) => {
        setMigrationProgress(30 + Math.floor(progress * 0.7))
        setMigrationMessage(message)
        setMigrationLog((prev) => [...prev, message])
      })

      // Definir o modo de persistência como Supabase
      migrateToSupabase()

      setMigrationProgress(100)
      setMigrationMessage("Migração concluída com sucesso!")
      setMigrationStatus("success")
      setMigrationLog((prev) => [...prev, "Migração concluída com sucesso!"])
    } catch (error) {
      console.error("Erro durante a migração:", error)
      setMigrationStatus("error")
      setMigrationMessage(`Erro durante a migração: ${error instanceof Error ? error.message : String(error)}`)
      setMigrationLog((prev) => [...prev, `ERRO: ${error instanceof Error ? error.message : String(error)}`])
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-purple-900 mb-4">Migração de Dados para Supabase</h2>
      <p className="text-gray-600 mb-4">
        Esta ferramenta irá migrar todos os seus dados do armazenamento local (IndexedDB) para o banco de dados Supabase
        na nuvem. Isso permitirá que você acesse seus dados de qualquer dispositivo e evite perda de dados.
      </p>

      {migrationStatus === "idle" ? (
        <button
          onClick={handleMigration}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-medium"
        >
          Iniciar Migração
        </button>
      ) : migrationStatus === "migrating" ? (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${migrationProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600">{migrationMessage}</p>

          <div className="mt-4 border rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">Log de migração:</h3>
            <ul className="text-xs space-y-1">
              {migrationLog.map((log, index) => (
                <li key={index} className={log.startsWith("ERRO") ? "text-red-600" : ""}>
                  {log}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : migrationStatus === "success" ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
          <p className="text-green-700">{migrationMessage}</p>
          <p className="text-sm text-green-600 mt-2">
            Agora você pode acessar seus dados de qualquer dispositivo. O sistema usará automaticamente o Supabase para
            armazenar e recuperar dados.
          </p>

          <div className="mt-4 border rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">Log de migração:</h3>
            <ul className="text-xs space-y-1">
              {migrationLog.map((log, index) => (
                <li key={index} className={log.startsWith("ERRO") ? "text-red-600" : ""}>
                  {log}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{migrationMessage}</p>

          <div className="mt-4 border rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">Log de migração:</h3>
            <ul className="text-xs space-y-1">
              {migrationLog.map((log, index) => (
                <li key={index} className={log.startsWith("ERRO") ? "text-red-600" : ""}>
                  {log}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleMigration}
            className="mt-3 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}
