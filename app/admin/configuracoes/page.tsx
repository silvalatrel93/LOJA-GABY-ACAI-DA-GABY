"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save } from "lucide-react"
import { getStoreConfig, saveStoreConfig, backupData, type StoreConfig } from "@/lib/db"

export default function StoreConfigPage() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        setIsLoading(true)
        const config = await getStoreConfig()
        
        // Preparar os dados para exibição na interface
        // Criamos uma cópia modificada do objeto para não alterar os tipos originais
        if (config) {
          const displayConfig = {
            ...config,
            // Usamos um truque para exibir campos vazios quando o valor é zero
            // Convertemos para string vazia na exibição, mas mantemos o tipo number no objeto
            _deliveryFee: config.deliveryFee === 0 ? "" : config.deliveryFee,
            _maringaDeliveryFee: config.maringaDeliveryFee === 0 ? "" : config.maringaDeliveryFee
          };
          
          setStoreConfig(displayConfig as any);
          return; // Retornamos aqui para evitar o setStoreConfig abaixo
        }
        
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoreConfig()
  }, [])

  const handleSaveConfig = async () => {
    if (!storeConfig) return

    try {
      setIsSaving(true)
      await saveStoreConfig(storeConfig)

      // Fazer backup após salvar
      await backupData()

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
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center">
                <Link href="/admin" className="mr-2 sm:mr-4">
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
                <h1 className="text-lg sm:text-xl font-bold">Configurações da Loja</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link 
                href="/admin" 
                className="p-1.5 rounded-full hover:bg-purple-700 transition-colors duration-200 flex-shrink-0"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap">
                Configurações da Loja
              </h1>
            </div>
            
            <div className="w-full sm:w-auto">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                  isSaving
                    ? 'bg-gray-500 cursor-not-allowed'
                    : saveStatus === 'success'
                    ? 'bg-green-600 hover:bg-green-700 shadow-lg transform hover:scale-105'
                    : saveStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-700 shadow-lg transform hover:scale-105'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-lg transform hover:scale-105'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Salvando...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvo!
                  </span>
                ) : saveStatus === 'error' ? (
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Erro
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-1.5" />
                    Salvar Alterações
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Personalização da Loja</h2>
          <p className="text-sm text-gray-600 mb-4">
            Personalize o logo e o nome da sua loja que serão exibidos no cabeçalho da página inicial.
          </p>

          {storeConfig && (
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
                
                {/* Configuração de WhatsApp removida */}
                
                {/* Configuração de PIX removida */}

                {storeConfig?.deliveryFee !== 0 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Taxa Padrão (R$)</label>
                      <input
                        type="number"
                        value={(storeConfig as any)?._deliveryFee || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStoreConfig({
                            ...storeConfig!,
                            deliveryFee: value === "" ? 0 : Number.parseFloat(value) || 0,
                            _deliveryFee: value
                          } as any)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Digite o valor da taxa"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Entrega para Maringá (R$)</label>
                      <input
                        type="number"
                        value={(storeConfig as any)?._maringaDeliveryFee || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStoreConfig({
                            ...storeConfig!,
                            maringaDeliveryFee: value === "" ? 0 : Number.parseFloat(value) || 0,
                            _maringaDeliveryFee: value
                          } as any)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Digite o valor da taxa para Maringá"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Esta taxa será aplicada automaticamente quando o endereço de entrega for em Maringá.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  {storeConfig?.deliveryFee === 0
                    ? "A entrega será gratuita para todos os pedidos."
                    : "A taxa padrão será aplicada a todos os pedidos, exceto para endereços em Maringá que usarão a taxa específica."}
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Configurações de Picolés</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de Picolés por Pedido
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={storeConfig.maxPicolesPerOrder || 20}
                      onChange={(e) =>
                        setStoreConfig({
                          ...storeConfig,
                          maxPicolesPerOrder: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 20"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número máximo de picolés que podem ser adicionados em um único pedido.
                    </p>
                  </div>
                </div>
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
                  Última atualização: {storeConfig.lastUpdated ? new Date(storeConfig.lastUpdated).toLocaleString() : 'Não disponível'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
