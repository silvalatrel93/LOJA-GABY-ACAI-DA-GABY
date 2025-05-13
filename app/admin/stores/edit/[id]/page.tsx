"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Save } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { getStoreById, updateStore } from "@/lib/services/store-service"
import type { Store } from "@/lib/types"

export default function EditStorePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const storeId = params?.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    themeColor: "#6B21A8",
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar dados da loja
  useEffect(() => {
    const loadStore = async () => {
      if (!storeId) return

      try {
        setIsLoading(true)
        const storeData = await getStoreById(storeId)

        if (storeData) {
          setStore(storeData)
          setFormData({
            name: storeData.name,
            slug: storeData.slug,
            logoUrl: storeData.logoUrl || "",
            themeColor: storeData.themeColor || "#6B21A8",
            isActive: storeData.isActive,
          })
        } else {
          router.push("/admin/stores")
        }
      } catch (error) {
        console.error("Erro ao carregar loja:", error)
        alert("Erro ao carregar dados da loja. Por favor, tente novamente.")
        router.push("/admin/stores")
      } finally {
        setIsLoading(false)
      }
    }

    loadStore()
  }, [storeId, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "O nome da loja é obrigatório"
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "O URL da loja é obrigatório"
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "O URL deve conter apenas letras minúsculas, números e hífens"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "isActive") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Limpar erro do campo quando o usuário digita
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !store) {
      return
    }

    try {
      setIsSubmitting(true)

      const updatedStore = await updateStore({
        ...store,
        name: formData.name,
        slug: formData.slug,
        logoUrl: formData.logoUrl || "/acai-logo.png", // Logo padrão se não for fornecido
        themeColor: formData.themeColor,
        isActive: formData.isActive,
      })

      if (updatedStore) {
        router.push(`/admin/stores`)
      }
    } catch (error: any) {
      console.error("Erro ao atualizar loja:", error)

      if (error.message.includes("URL já está em uso")) {
        setErrors((prev) => ({
          ...prev,
          slug: "Este URL já está em uso. Por favor, escolha outro.",
        }))
      } else {
        alert("Erro ao atualizar loja. Por favor, tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-purple-900 text-white p-4">
            <div className="container mx-auto flex items-center">
              <Link href="/admin/stores" className="mr-4">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-xl font-bold">Editar Loja</h1>
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
          <div className="container mx-auto flex items-center">
            <Link href="/admin/stores" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Editar Loja</h1>
          </div>
        </header>

        <main className="container mx-auto p-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              {formData.logoUrl && (
                <div className="mr-4">
                  <Image
                    src={formData.logoUrl || "/placeholder.svg"}
                    alt={formData.name}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800">Editar {formData.name}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Loja *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  placeholder="Ex: Açaí Delícia"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Loja *
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-gray-500">
                    acai-online.com/store/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className={`flex-1 px-3 py-2 border ${
                      errors.slug ? "border-red-500" : "border-gray-300"
                    } rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    placeholder="minha-loja"
                  />
                </div>
                {errors.slug ? (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Use apenas letras minúsculas, números e hífens. Este será o endereço da sua loja.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Logo (opcional)
                </label>
                <input
                  type="text"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Deixe em branco para usar o logo padrão. Recomendamos uma imagem quadrada com fundo transparente.
                </p>
              </div>

              <div>
                <label htmlFor="themeColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Cor do Tema
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="themeColor"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    className="h-10 w-10 border-0 p-0 mr-2"
                  />
                  <input
                    type="text"
                    value={formData.themeColor}
                    onChange={handleChange}
                    name="themeColor"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Loja ativa
                </label>
                <p className="ml-4 text-xs text-gray-500">
                  {formData.isActive
                    ? "Sua loja está visível para os clientes."
                    : "Sua loja está oculta para os clientes."}
                </p>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-4">
                <Link href="/admin/stores">
                  <button type="button" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">
                    Cancelar
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-md flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-1" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
