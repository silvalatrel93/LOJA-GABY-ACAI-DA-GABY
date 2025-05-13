"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { getUserStores, deleteStore } from "@/lib/services/store-service"
import type { Store } from "@/lib/types"

export default function StoresPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteStatus, setDeleteStatus] = useState<{ id: string; status: "pending" | "success" | "error" } | null>(null)

  // Carregar lojas do usuário
  const loadStores = async () => {
    try {
      setIsLoading(true)
      const storesList = await getUserStores()
      setStores(storesList)
    } catch (error) {
      console.error("Erro ao carregar lojas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleDeleteStore = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta loja? Esta ação não pode ser desfeita.")) {
      try {
        setDeleteStatus({ id, status: "pending" })
        await deleteStore(id)

        // Atualizar a lista de lojas após excluir
        await loadStores()
        setDeleteStatus({ id, status: "success" })
      } catch (error) {
        console.error("Erro ao excluir loja:", error)
        setDeleteStatus({ id, status: "error" })
        alert("Erro ao excluir loja. Tente novamente.")
      }
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-purple-900 text-white p-4">
            <div className="container mx-auto flex items-center justify-between">
              <h1 className="text-xl font-bold">Minhas Lojas</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm hidden md:inline-block">Olá, {user?.user_metadata?.name || user?.email}</span>
              </div>
            </div>
          </header>

          <main className="container mx-auto p-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-purple-900 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold">Minhas Lojas</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm hidden md:inline-block">Olá, {user?.user_metadata?.name || user?.email}</span>
              <Link
                href={`/admin/stores/action/new`}
                className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus size={18} className="mr-1" />
                Nova Loja
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4">
          {stores.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Você ainda não tem lojas</h2>
              <p className="text-gray-600 mb-6">Crie sua primeira loja de açaí online e comece a vender agora mesmo!</p>
              <Link href="/admin/stores/new">
                <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-md font-medium flex items-center mx-auto">
                  <Plus size={20} className="mr-2" />
                  Criar Minha Primeira Loja
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {stores.map((store) => (
                <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-40 bg-gradient-to-r from-purple-500 to-purple-700 relative">
                    {store.logoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full w-24 h-24 flex items-center justify-center">
                          <Image
                            src={store.logoUrl || "/placeholder.svg"}
                            alt={store.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {!store.isActive && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        Inativa
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h2 className="text-xl font-bold text-center mb-2">{store.name}</h2>
                    <p className="text-gray-500 text-sm text-center mb-4">{store.slug}</p>

                    <div className="flex justify-between mt-4">
                      <Link href={`/store/${store.slug}`} target="_blank">
                        <button className="text-blue-600 flex items-center text-sm">
                          <ExternalLink size={16} className="mr-1" />
                          Visitar Loja
                        </button>
                      </Link>

                      <div className="flex space-x-2">
                        <Link href={`/admin/stores/edit/${store.id}`} className="text-purple-600 hover:text-purple-800">
                          <Edit size={16} />
                        </Link>

                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                          title="Excluir loja"
                          disabled={deleteStatus?.id === store.id && deleteStatus.status === "pending"}
                        >
                          {deleteStatus?.id === store.id && deleteStatus.status === "pending" ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <Link href={`/store/${store.slug}/admin`}>
                        <button className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-md">
                          Acessar Painel Administrativo
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
