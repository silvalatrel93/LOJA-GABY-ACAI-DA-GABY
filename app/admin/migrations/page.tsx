"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { addSelectionLimitToAdditionalCategories } from "@/lib/migrations/add-selection-limit"
import { createAdminSettingsTable } from "@/lib/migrations/create-admin-settings"

export default function MigrationsPage() {
  const [migrationStatus, setMigrationStatus] = useState<{
    running: boolean;
    success?: boolean;
    message?: string;
  }>({ running: false })
  
  const [adminSettingsStatus, setAdminSettingsStatus] = useState<{
    running: boolean;
    success?: boolean;
    message?: string;
  }>({ running: false })

  const runAddSelectionLimitMigration = async () => {
    try {
      setMigrationStatus({ running: true })
      
      const success = await addSelectionLimitToAdditionalCategories()
      
      if (success) {
        setMigrationStatus({
          running: false,
          success: true,
          message: "Migração concluída com sucesso! A coluna selection_limit foi adicionada à tabela additional_categories."
        })
      } else {
        setMigrationStatus({
          running: false,
          success: false,
          message: "Erro ao executar a migração. Verifique o console para mais detalhes."
        })
      }
    } catch (error) {
      console.error("Erro ao executar migração:", error)
      setMigrationStatus({
        running: false,
        success: false,
        message: `Erro ao executar a migração: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }
  
  const runCreateAdminSettingsTable = async () => {
    try {
      setAdminSettingsStatus({ running: true })
      
      const success = await createAdminSettingsTable()
      
      if (success) {
        setAdminSettingsStatus({
          running: false,
          success: true,
          message: "Migração concluída com sucesso! A tabela admin_settings foi criada."
        })
      } else {
        setAdminSettingsStatus({
          running: false,
          success: false,
          message: "Erro ao executar a migração. Verifique o console para mais detalhes."
        })
      }
    } catch (error) {
      console.error("Erro ao executar migração admin_settings:", error)
      setAdminSettingsStatus({
        running: false,
        success: false,
        message: `Erro ao executar a migração: ${error instanceof Error ? error.message : String(error)}`
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center">
          <Link href="/admin" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Migrações do Banco de Dados</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Migrações Disponíveis</h2>
          <p className="text-sm text-gray-600 mb-4">
            Execute migrações para atualizar a estrutura do banco de dados conforme necessário.
          </p>

          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium text-purple-800 mb-2">Adicionar Limite de Seleção às Categorias de Adicionais</h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta migração adiciona a coluna <code className="bg-gray-100 px-1 py-0.5 rounded">selection_limit</code> à tabela 
              <code className="bg-gray-100 px-1 py-0.5 rounded">additional_categories</code> para permitir definir limites 
              de seleção por categoria.
            </p>
            
            <button
              onClick={runAddSelectionLimitMigration}
              disabled={migrationStatus.running}
              className={`px-4 py-2 rounded-md font-medium ${
                migrationStatus.running
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-700 text-white hover:bg-purple-800"
              }`}
            >
              {migrationStatus.running ? "Executando..." : "Executar Migração"}
            </button>
            
            {migrationStatus.message && (
              <div className={`mt-4 p-3 rounded-md ${
                migrationStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {migrationStatus.message}
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium text-purple-800 mb-2">Criar Tabela Admin Settings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Esta migração cria a tabela <code className="bg-gray-100 px-1 py-0.5 rounded">admin_settings</code> 
              necessária para armazenar configurações administrativas do sistema.
            </p>
            
            <button
              onClick={runCreateAdminSettingsTable}
              disabled={adminSettingsStatus.running}
              className={`px-4 py-2 rounded-md font-medium ${
                adminSettingsStatus.running
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-700 text-white hover:bg-purple-800"
              }`}
            >
              {adminSettingsStatus.running ? "Executando..." : "Executar Migração"}
            </button>
            
            {adminSettingsStatus.message && (
              <div className={`mt-4 p-3 rounded-md ${
                adminSettingsStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {adminSettingsStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
