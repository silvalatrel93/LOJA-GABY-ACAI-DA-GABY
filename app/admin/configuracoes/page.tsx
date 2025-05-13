"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import { getStoreConfig, saveStoreConfig } from "@/lib/services/store-config-service"
import type { StoreConfig } from "@/lib/types"
import ShareVitrineButton from "./share-vitrine"

export default function ConfiguracoesPage() {
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: "",
    logoUrl: "",
    isOpen: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true)
        const config = await getStoreConfig()
        setStoreConfig(config || { name: "", logoUrl: "", isOpen: true })
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await saveStoreConfig(storeConfig)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      alert("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Configurações da Loja</h1>
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
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Configurações da Loja</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
          >
            {isSaving ? <RefreshCw size={18} className="mr-1 animate-spin" /> : <Save size={18} className="mr-1" />}
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Informações da Loja</h2>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">Configurações salvas com sucesso!</div>
          )}

          <div className="space-y-4">
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
                value={storeConfig.logoUrl || ""}
                onChange={(e) => setStoreConfig({ ...storeConfig, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Insira a URL de uma imagem para usar como logo da loja. Recomendamos uma imagem quadrada.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status da Loja</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOpen"
                  checked={storeConfig.isOpen}
                  onChange={(e) => setStoreConfig({ ...storeConfig, isOpen: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isOpen" className="ml-2 block text-sm text-gray-900">
                  Loja aberta para pedidos
                </label>
              </div>
            </div>

            {storeConfig.logoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pré-visualização do Logo</label>
                <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                  <Image
                    src={storeConfig.logoUrl || "/placeholder.svg"}
                    alt="Logo da loja"
                    fill
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Adicionar o componente de compartilhamento da vitrine */}
        <ShareVitrineButton />

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Instalar o Aplicativo</h2>

          <p className="text-gray-600 mb-4">
            Você pode instalar o painel administrativo como um aplicativo no seu celular para acesso rápido.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Como instalar:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Abra esta página no navegador Chrome ou Safari do seu celular</li>
              <li>Toque no menu do navegador (três pontos ou ícone de compartilhamento)</li>
              <li>Selecione "Adicionar à tela inicial" ou "Instalar aplicativo"</li>
              <li>Confirme a instalação</li>
            </ol>
            <p className="mt-3 text-sm text-gray-500">
              Após a instalação, você terá acesso rápido ao painel administrativo diretamente da tela inicial do seu
              celular.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
