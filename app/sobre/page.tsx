"use client"

import { useState, useEffect } from "react"
import { getPageContent, type PageContent } from "@/lib/db"
import StoreHeader from "@/components/store-header"
import { getStoreConfig } from "@/lib/db"

export default function SobrePage() {
  const [pageContent, setPageContent] = useState<(PageContent & { storeName?: string }) | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        const [content, storeConfig] = await Promise.all([getPageContent("sobre"), getStoreConfig()])

        if (content) {
          setPageContent({
            ...content,
            storeName: storeConfig.name,
          })
        }
      } catch (error) {
        console.error("Erro ao carregar conteúdo da página:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      <StoreHeader />

      <div className="container mx-auto p-4 py-8">
        <h1 className="text-2xl font-bold text-purple-900 mb-6">{pageContent?.title || "Sobre Nós"}</h1>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {pageContent ? (
              <div
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
                className="prose max-w-none text-gray-700"
              />
            ) : (
              <p className="text-gray-700 mb-4">
                Somos especializados em açaí de alta qualidade, com ingredientes frescos e selecionados. Nossa missão é
                levar até você o melhor açaí com praticidade e rapidez.
              </p>
            )}
          </div>
        )}
      </div>
      <footer className="bg-purple-900 text-white p-4 mt-auto">
        <div className="text-center">
          <p>
            © {new Date().getFullYear()} {pageContent?.storeName || "Açaí Delícia"} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </main>
  )
}
