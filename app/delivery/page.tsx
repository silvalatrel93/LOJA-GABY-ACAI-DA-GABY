"use client"

import { useState, useEffect } from "react"
import { getPageContent, type PageContent, getStoreConfig, type StoreConfig } from "@/lib/db"
import StoreHeader from "@/components/store-header"
import { getSimplifiedOperatingHours } from "@/lib/format-hours"
import OperatingHoursCard from "@/components/operating-hours-card"

export default function DeliveryPage() {
  const [pageContent, setPageContent] = useState<(PageContent & { storeName?: string }) | null>(null)
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        const [content, config] = await Promise.all([getPageContent("delivery"), getStoreConfig()])

        setStoreConfig(config)

        if (content) {
          // Substituir o conteúdo estático de horário pelo dinâmico
          let updatedContent = content.content

          // Procurar por padrões de texto de horário e substituí-los
          const hourRegex = /Segunda a Domingo: 10h às 22h/g
          if (hourRegex.test(updatedContent)) {
            updatedContent = updatedContent.replace(hourRegex, getSimplifiedOperatingHours(config))
          }

          setPageContent({
            ...content,
            content: updatedContent,
            storeName: config.name,
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
        <h1 className="text-2xl font-bold text-purple-900 mb-6">{pageContent?.title || "Delivery"}</h1>

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
                Informações sobre nosso serviço de delivery não estão disponíveis no momento.
              </p>
            )}

            {/* Seção dedicada aos horários de funcionamento */}
            {storeConfig && (
              <div className="mt-8">
                <OperatingHoursCard storeConfig={storeConfig} />
              </div>
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
