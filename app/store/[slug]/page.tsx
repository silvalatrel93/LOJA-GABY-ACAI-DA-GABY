"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store-context"
import { Loader2 } from "lucide-react"

export default function StorePage() {
  const { currentStore, isLoading, error } = useStore()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    // Redirecionar para a página inicial da loja quando ela for carregada
    if (currentStore && !isLoading) {
      router.push(`/store/${slug}/home`)
    }
  }, [currentStore, isLoading, router, slug])

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Voltar para a página inicial
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
        <p className="mt-2 text-gray-600">Redirecionando...</p>
      </div>
    </div>
  )
}
