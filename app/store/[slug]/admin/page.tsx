"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useStore } from "@/lib/store-context"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { Loader2, ShoppingBag, Tag, ImageIcon, Plus, Settings, Clock, Bell, FileText, Coffee } from "lucide-react"

export default function StoreAdminPage() {
  const { currentStore, isLoading, error } = useStore()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // Verificar se o usuário é dono da loja
  useEffect(() => {
    if (currentStore && user && currentStore.ownerId !== user.id) {
      router.push(`/store/${slug}`)
    }
  }, [currentStore, user, router, slug])

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
          <Link href="/admin/stores">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              Voltar para minhas lojas
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin/stores" className="mr-4">
                <button className="p-2 hover:bg-purple-800 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <h1 className="text-xl font-bold">Painel Administrativo - {currentStore.name}</h1>
            </div>
            <div className="flex items-center">
              <Link href={`/store/${slug}`} target="_blank">
                <button className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium">Visualizar Loja</button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={`/store/${slug}/admin/produtos`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Coffee className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Produtos</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar produtos, tamanhos e preços</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/categorias`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Tag className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Categorias</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar categorias de produtos</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/adicionais`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Adicionais</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar adicionais para produtos</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/carrossel`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <ImageIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Carrossel</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar imagens do carrossel</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/frases`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Frases</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar frases do carrossel de texto</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/pedidos`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Pedidos</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar pedidos recebidos</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/horarios`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Horários</h2>
                </div>
                <p className="mt-2 text-gray-600">Configurar horários de funcionamento</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/notificacoes`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Bell className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Notificações</h2>
                </div>
                <p className="mt-2 text-gray-600">Gerenciar notificações para clientes</p>
              </div>
            </Link>

            <Link href={`/store/${slug}/admin/configuracoes`}>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Settings className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="ml-3 text-lg font-semibold text-gray-800">Configurações</h2>
                </div>
                <p className="mt-2 text-gray-600">Configurações gerais da loja</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
