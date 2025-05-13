"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Save } from "lucide-react"
import { useStore } from "@/lib/store-context"
import { getStoreConfig, saveStoreConfig } from "@/lib/services/store-config-service"
import type { StoreConfig } from "@/lib/types"

export default function StoreConfigPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { store } = useStore()
  const storeId = store?.id

  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      if (!storeId) return

      try {
        setIsLoading(true)
        const config = await getStoreConfig(storeId)
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (storeId) {
      loadStoreConfig()
    }
  }, [storeId])

  const handleSaveConfig = async () => {
    if (!storeConfig || !storeId) return

    try {
      setIsSaving(true)

      // Garantir que a configuração tenha o storeId correto
      const configToSave = {
        ...storeConfig,
        storeId,
      }

      await saveStoreConfig(configToSave, storeId)

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar configurações da loja:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações da Loja</h1>
        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md text-white flex items-center ${
            isSaving
              ? "bg-gray-400"
              : saveStatus === "success"
                ? "bg-green-600"
                : saveStatus === "error"
                  ? "bg-red-600"
                  : "bg-purple-700 hover:bg-purple-800"
          }`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              Salvando...
            </>
          ) : saveStatus === "success" ? (
            "Salvo com Sucesso!"
          ) : saveStatus === "error" ? (
            "Erro ao Salvar"
          ) : (
            <>
              <Save size={18} className="mr-1" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {storeConfig && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
              <input
                type="text"
                value={storeConfig.name}
                onChange={(e) => setStoreConfig({ ...storeConfig, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nome da sua loja"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo</label>
              <input
                type="text"
                value={storeConfig.logoUrl}
                onChange={(e) => setStoreConfig({ ...storeConfig, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="URL da imagem do logo"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recomendamos usar uma imagem quadrada com fundo transparente (PNG) para melhores resultados.
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Taxa de Entrega</label>
                <div className="ml-auto">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="freeDelivery"
                      checked={storeConfig?.deliveryFee === 0}
                      onChange={(e) => {
                        setStoreConfig({
                          ...storeConfig!,
                          deliveryFee: e.target.checked ? 0 : 5.0,
                        })
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="freeDelivery" className="ml-2 block text-sm text-gray-700">
                      Entrega gratuita
                    </label>
                  </div>
                </div>
              </div>

              {storeConfig?.deliveryFee !== 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Taxa (R$)</label>
                  <input
                    type="number"
                    value={storeConfig?.deliveryFee || 5.0}
                    onChange={(e) =>
                      setStoreConfig({
                        ...storeConfig!,
                        deliveryFee: Number.parseFloat(e.target.value) || 5.0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Taxa de entrega"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 mt-1">
                {storeConfig?.deliveryFee === 0
                  ? "A entrega será gratuita para todos os pedidos."
                  : "Este valor será aplicado a todos os pedidos como taxa de entrega."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prévia</label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-center">
                  <div className="relative w-12 h-12 mr-3">
                    <Image
                      src={storeConfig.logoUrl || "/placeholder.svg?key=logo&text=Açaí+Delícia"}
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-purple-900">{storeConfig.name}</h1>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Última atualização: {new Date(storeConfig.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
