"use client"

import { useState, useEffect } from "react"
import { getStoreStatus } from "@/lib/store-utils"
import { getStoreConfig, saveStoreConfig } from "@/lib/services/store-config-service"
import { Clock, CheckCircle, XCircle } from "lucide-react"

export default function StoreStatusTester() {
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean
    statusText: string
    statusClass: string
  } | null>(null)
  const [storeConfig, setStoreConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; message: string }>>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const status = await getStoreStatus()
        const config = await getStoreConfig()
        setStoreStatus(status)
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const runTests = async () => {
    const results = []

    // Teste 1: Verificar se o status da loja está sendo carregado corretamente
    results.push({
      name: "Carregamento do Status",
      passed: storeStatus !== null,
      message: storeStatus !== null ? "Status da loja carregado com sucesso" : "Falha ao carregar o status da loja",
    })

    // Teste 2: Verificar se a configuração da loja está sendo carregada corretamente
    results.push({
      name: "Carregamento da Configuração",
      passed: storeConfig !== null,
      message:
        storeConfig !== null
          ? "Configuração da loja carregada com sucesso"
          : "Falha ao carregar a configuração da loja",
    })

    // Teste 3: Testar alteração de status (abrir loja)
    try {
      if (storeConfig) {
        const originalStatus = storeConfig.isOpen

        // Alterar para o status oposto
        const updatedConfig = { ...storeConfig, isOpen: !originalStatus }
        await saveStoreConfig(updatedConfig)

        // Verificar se o status foi alterado
        const newConfig = await getStoreConfig()
        const statusChanged = newConfig?.isOpen !== originalStatus

        // Restaurar status original
        await saveStoreConfig({ ...storeConfig, isOpen: originalStatus })

        results.push({
          name: "Alteração de Status",
          passed: statusChanged,
          message: statusChanged ? "Status da loja alterado com sucesso" : "Falha ao alterar o status da loja",
        })
      }
    } catch (error) {
      console.error("Erro ao testar alteração de status:", error)
      results.push({
        name: "Alteração de Status",
        passed: false,
        message: "Erro ao testar alteração de status",
      })
    }

    setTestResults(results)
  }

  const toggleStoreStatus = async () => {
    if (!storeConfig) return

    try {
      const updatedConfig = { ...storeConfig, isOpen: !storeConfig.isOpen }
      await saveStoreConfig(updatedConfig)

      // Recarregar dados
      const status = await getStoreStatus()
      const config = await getStoreConfig()
      setStoreStatus(status)
      setStoreConfig(config)
    } catch (error) {
      console.error("Erro ao alterar status da loja:", error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-purple-900 mb-4">Teste de Status da Loja</h2>

      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="font-medium mb-2">Status Atual</h3>
        {storeStatus && (
          <div className="flex items-center">
            <Clock size={20} className={storeStatus.isOpen ? "text-green-600" : "text-red-600"} />
            <span className={`ml-2 ${storeStatus.statusClass}`}>{storeStatus.statusText}</span>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={toggleStoreStatus}
            className={`px-4 py-2 rounded-md text-white ${
              storeConfig?.isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {storeConfig?.isOpen ? "Fechar Loja" : "Abrir Loja"}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <button onClick={runTests} className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800">
          Executar Testes
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Resultados dos Testes</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start">
                {result.passed ? (
                  <CheckCircle size={20} className="text-green-600 mr-2 mt-0.5" />
                ) : (
                  <XCircle size={20} className="text-red-600 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${result.passed ? "text-green-600" : "text-red-600"}`}>{result.name}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
