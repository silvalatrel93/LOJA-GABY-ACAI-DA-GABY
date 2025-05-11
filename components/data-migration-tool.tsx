"use client"

import { useState } from "react"
import {
  migrateAllData,
  isMigrationCompleted,
  getLastMigrationDate,
  type MigrationResult,
} from "@/lib/services/migration-service"
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function DataMigrationTool() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const migrationCompleted = isMigrationCompleted()
  const lastMigrationDate = getLastMigrationDate()

  const handleStartMigration = async () => {
    if (isMigrating) return

    const confirmMigration = confirm(
      "Tem certeza que deseja iniciar a migração de dados do IndexedDB para o Supabase? " +
        "Este processo pode levar alguns minutos e não deve ser interrompido.",
    )

    if (!confirmMigration) return

    try {
      setIsMigrating(true)
      const result = await migrateAllData()
      setMigrationResult(result)
    } catch (error) {
      console.error("Erro ao iniciar migração:", error)
      setMigrationResult({
        success: false,
        message: `Erro ao iniciar migração: ${error}`,
        errors: [`${error}`],
      })
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
        <Database size={20} className="mr-2" />
        Migração de Dados para Supabase
      </h2>

      <div className="mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <h3 className="font-medium text-blue-800 mb-2">Status da Migração</h3>
          <div className="flex items-center">
            {migrationCompleted ? (
              <>
                <CheckCircle size={20} className="text-green-600 mr-2" />
                <div>
                  <p className="font-medium text-green-600">Migração já realizada</p>
                  {lastMigrationDate && (
                    <p className="text-sm text-gray-600">Última migração: {lastMigrationDate.toLocaleString()}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-yellow-600 mr-2" />
                <p className="font-medium text-yellow-600">Migração pendente</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleStartMigration}
          disabled={isMigrating}
          className={`w-full px-4 py-3 rounded-md text-white font-medium flex items-center justify-center ${
            isMigrating ? "bg-gray-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"
          }`}
        >
          {isMigrating ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              Migrando Dados...
            </>
          ) : (
            <>
              <RefreshCw size={18} className="mr-2" />
              {migrationCompleted ? "Executar Nova Migração" : "Iniciar Migração para Supabase"}
            </>
          )}
        </button>
      </div>

      {migrationResult && (
        <div
          className={`p-4 border rounded-lg ${
            migrationResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start">
            {migrationResult.success ? (
              <CheckCircle size={20} className="text-green-600 mr-2 mt-0.5" />
            ) : (
              <XCircle size={20} className="text-red-600 mr-2 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${migrationResult.success ? "text-green-600" : "text-red-600"}`}>
                {migrationResult.message}
              </h3>

              {migrationResult.details && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
                  </button>

                  {showDetails && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Itens migrados:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Categorias: {migrationResult.details.categories || 0}</li>
                        <li>Produtos: {migrationResult.details.products || 0}</li>
                        <li>Adicionais: {migrationResult.details.additionals || 0}</li>
                        <li>Slides do Carrossel: {migrationResult.details.carouselSlides || 0}</li>
                        <li>Frases: {migrationResult.details.phrases || 0}</li>
                        <li>Pedidos: {migrationResult.details.orders || 0}</li>
                        <li>Notificações: {migrationResult.details.notifications || 0}</li>
                        <li>Conteúdo de Páginas: {migrationResult.details.pageContents || 0}</li>
                        <li>Configurações da Loja: {migrationResult.details.storeConfig ? "Sim" : "Não"}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {migrationResult.errors && migrationResult.errors.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showDetails ? "Ocultar erros" : "Mostrar erros"}
                  </button>

                  {showDetails && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>Erros encontrados:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {migrationResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium text-gray-700 mb-1">Sobre a Migração</h3>
        <p className="mb-2">
          Esta ferramenta migra todos os dados do IndexedDB local para o banco de dados Supabase na nuvem. Isso permite
          que seus dados sejam acessíveis de qualquer dispositivo e estejam protegidos contra perda.
        </p>
        <p>
          A migração inclui: produtos, categorias, adicionais, slides do carrossel, frases, pedidos, configurações da
          loja, notificações e conteúdo das páginas.
        </p>
      </div>
    </div>
  )
}
