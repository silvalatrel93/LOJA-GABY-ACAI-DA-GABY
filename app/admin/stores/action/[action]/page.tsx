"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { createStore, updateStore, getStoreById, isSlugAvailable } from "@/lib/services/store-service"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function StoreFormPage() {
  const router = useRouter()
  const params = useParams()
  const action = params.action as string
  const storeId = params.id as string

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    logoUrl: "",
    themeColor: "#6B21A8",
    isActive: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  // Carregar dados da loja se for edição
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Verificar se o usuário está autenticado
        const supabase = createSupabaseClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login?redirect=/admin/stores")
          return
        }

        setUser(user)

        // Se for edição, carregar dados da loja
        if (action === "edit" && storeId) {
          const store = await getStoreById(storeId)

          if (store) {
            setFormData({
              name: store.name,
              slug: store.slug,
              domain: store.domain || "",
              logoUrl: store.logoUrl || "",
              themeColor: store.themeColor,
              isActive: store.isActive,
            })
          } else {
            setError("Loja não encontrada")
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError("Erro ao carregar dados. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [action, storeId, router])

  // Verificar disponibilidade do slug quando ele mudar
  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (formData.slug.length < 3) {
        setSlugAvailable(null)
        return
      }

      try {
        const available = await isSlugAvailable(formData.slug, action === "edit" ? storeId : undefined)
        setSlugAvailable(available)
      } catch (error) {
        console.error("Erro ao verificar disponibilidade do slug:", error)
        setSlugAvailable(null)
      }
    }

    const timer = setTimeout(checkSlugAvailability, 500)
    return () => clearTimeout(timer)
  }, [formData.slug, action, storeId])

  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Função para gerar slug a partir do nome
  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")

    setFormData((prev) => ({
      ...prev,
      slug,
    }))
  }

  // Função para salvar a loja
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setError(null)

      // Validar campos
      if (!formData.name) {
        setError("O nome da loja é obrigatório")
        return
      }

      if (!formData.slug) {
        setError("O slug da loja é obrigatório")
        return
      }

      if (formData.slug.length < 3) {
        setError("O slug deve ter pelo menos 3 caracteres")
        return
      }

      if (slugAvailable === false) {
        setError("Este slug já está em uso. Escolha outro.")
        return
      }

      // Criar ou atualizar a loja
      if (action === "edit" && storeId) {
        // Atualizar loja existente
        const updatedStore = await updateStore({
          id: storeId,
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || undefined,
          logoUrl: formData.logoUrl || undefined,
          themeColor: formData.themeColor,
          isActive: formData.isActive,
          ownerId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        if (updatedStore) {
          router.push("/admin/stores")
        } else {
          setError("Erro ao atualizar loja. Tente novamente.")
        }
      } else {
        // Criar nova loja
        const newStore = await createStore({
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || undefined,
          logoUrl: formData.logoUrl || undefined,
          themeColor: formData.themeColor,
          isActive: formData.isActive,
          ownerId: user.id,
        })

        if (newStore) {
          router.push("/admin/stores")
        } else {
          setError("Erro ao criar loja. Tente novamente.")
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar loja:", error)
      setError(error.message || "Erro ao salvar loja. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin/stores" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">{action === "edit" ? "Editar Loja" : "Nova Loja"}</h1>
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
            <Link href="/admin/stores" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">{action === "edit" ? "Editar Loja" : "Nova Loja"}</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="mr-1 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} className="mr-1" />
                Salvar
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
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
                onBlur={() => {
                  if (formData.name && !formData.slug) {
                    generateSlug()
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nome da sua loja de açaí"
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    slugAvailable === true
                      ? "border-green-300 focus:ring-green-500"
                      : slugAvailable === false
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-purple-500"
                  }`}
                  placeholder="slug-da-loja"
                  required
                  minLength={3}
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="ml-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Gerar
                </button>
              </div>
              <p className="mt-1 text-sm">
                {slugAvailable === true && <span className="text-green-600">✓ Slug disponível</span>}
                {slugAvailable === false && <span className="text-red-600">✗ Slug já está em uso</span>}
                {slugAvailable === null && formData.slug && (
                  <span className="text-gray-500">Verificando disponibilidade...</span>
                )}
                {!formData.slug && (
                  <span className="text-gray-500">
                    A URL da sua loja será: /store/<span className="font-mono">slug-da-loja</span>
                  </span>
                )}
              </p>
            </div>

            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
                Domínio Personalizado (opcional)
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="loja.seudominio.com"
              />
              <p className="mt-1 text-sm text-gray-500">Deixe em branco se não tiver um domínio personalizado</p>
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
                  className="w-12 h-10 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  value={formData.themeColor}
                  onChange={handleChange}
                  name="themeColor"
                  className="ml-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-32"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Loja ativa
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
