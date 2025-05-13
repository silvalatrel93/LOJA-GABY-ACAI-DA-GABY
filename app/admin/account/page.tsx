"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import AuthGuard from "@/components/auth-guard"
import { createSupabaseClient } from "@/lib/supabase-client"

export default function AccountPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.user_metadata?.name || "",
        email: user.email || "",
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
        },
      })

      if (error) {
        throw error
      }

      setSuccess("Informações atualizadas com sucesso!")
    } catch (error: any) {
      console.error("Erro ao atualizar informações:", error)
      setError(error.message || "Erro ao atualizar informações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-xl font-bold">Minha Conta</h1>
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

        <main className="flex-1 container mx-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 max-w-2xl mx-auto">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 max-w-2xl mx-auto">
              <p>{success}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Informações Pessoais</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado</p>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Segurança</h3>

              <Link href="/reset-password">
                <button className="px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50">
                  Alterar Senha
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
