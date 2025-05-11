"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { getPageContent, savePageContent, backupData, initializeDefaultPageContent, type PageContent } from "@/lib/db"

export default function PagesAdminPage() {
  const [pages, setPages] = useState<{ id: string; title: string; lastUpdated: Date }[]>([])
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<PageContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Carregar lista de páginas
  useEffect(() => {
    const loadPages = async () => {
      try {
        setIsLoading(true)

        // Garantir que o conteúdo padrão das páginas esteja inicializado
        await initializeDefaultPageContent()

        // Carregar conteúdo das páginas conhecidas
        const [sobreContent, deliveryContent] = await Promise.all([getPageContent("sobre"), getPageContent("delivery")])

        const pagesList = []

        if (sobreContent) {
          pagesList.push({
            id: sobreContent.id,
            title: sobreContent.title,
            lastUpdated: sobreContent.lastUpdated,
          })
        }

        if (deliveryContent) {
          pagesList.push({
            id: deliveryContent.id,
            title: deliveryContent.title,
            lastUpdated: deliveryContent.lastUpdated,
          })
        }

        setPages(pagesList)

        // Se não houver página selecionada e existirem páginas, selecionar a primeira
        if (!selectedPage && pagesList.length > 0) {
          setSelectedPage(pagesList[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar páginas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPages()
  }, [])

  // Carregar conteúdo da página selecionada
  useEffect(() => {
    const loadSelectedPageContent = async () => {
      if (!selectedPage) return

      try {
        setIsLoading(true)
        const content = await getPageContent(selectedPage)
        setEditingContent(content)
      } catch (error) {
        console.error(`Erro ao carregar conteúdo da página ${selectedPage}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSelectedPageContent()
  }, [selectedPage])

  const handleSaveContent = async () => {
    if (!editingContent) return

    try {
      setIsSaving(true)
      await savePageContent(editingContent)

      // Fazer backup após salvar
      await backupData()

      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar conteúdo da página:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !editingContent) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Páginas</h1>
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
            <h1 className="text-xl font-bold">Gerenciar Páginas</h1>
          </div>
          <button
            onClick={handleSaveContent}
            disabled={isSaving || !editingContent}
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
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Editar Páginas</h2>
          <p className="text-sm text-gray-600 mb-4">
            Edite o conteúdo das páginas do seu site. As alterações serão refletidas imediatamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Seletor de páginas */}
            <div className="md:col-span-1">
              <h3 className="font-medium text-gray-700 mb-2">Páginas</h3>
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPage(page.id)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedPage === page.id
                        ? "bg-purple-100 text-purple-900 font-medium"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de conteúdo */}
            <div className="md:col-span-3">
              {editingContent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título da Página</label>
                    <input
                      type="text"
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Título da página"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo</label>
                    <p className="text-xs text-gray-500 mb-2">
                      Você pode usar HTML para formatar o conteúdo. Por exemplo, &lt;h2&gt;Título&lt;/h2&gt; para
                      títulos, &lt;p&gt;Parágrafo&lt;/p&gt; para parágrafos,
                      &lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt; para listas.
                    </p>
                    <textarea
                      value={editingContent.content}
                      onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      placeholder="Conteúdo da página (HTML)"
                      rows={15}
                    />
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Prévia</h3>
                    <div className="border rounded-lg p-4 bg-gray-50 prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: editingContent.content }} />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Última atualização: {new Date(editingContent.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Selecione uma página para editar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
