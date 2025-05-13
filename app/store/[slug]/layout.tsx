"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useStore } from "@/lib/store-context"
import { Loader2 } from "lucide-react"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { currentStore, isLoading, error } = useStore()
  const params = useParams()
  const slug = params.slug as string
  const [storeActive, setStoreActive] = useState<boolean | null>(null)

  // Mova todos os hooks para o topo, antes de qualquer lógica condicional
  useEffect(() => {
    if (currentStore) {
      setStoreActive(currentStore.isActive)
    }
  }, [currentStore])

  // Efeito para aplicar o tema da loja
  useEffect(() => {
    if (currentStore?.themeColor) {
      document.documentElement.style.setProperty("--primary-color", currentStore.themeColor)
    }

    return () => {
      document.documentElement.style.removeProperty("--primary-color")
    }
  }, [currentStore])

  // Renderização condicional baseada no estado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
          <p className="mt-2 text-gray-600">Carregando loja...</p>
        </div>
      </div>
    )
  }

  if (error || !currentStore) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">{error || `A loja "${slug}" não existe ou não está disponível.`}</p>
          <a href="/" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }

  if (storeActive === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja temporariamente indisponível</h1>
          <p className="text-gray-600 mb-6">
            Esta loja está temporariamente desativada. Por favor, tente novamente mais tarde.
          </p>
          <a href="/" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Voltar para a página inicial
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ "--store-theme": currentStore.themeColor } as any}>
      {children}
    </div>
  )
}
