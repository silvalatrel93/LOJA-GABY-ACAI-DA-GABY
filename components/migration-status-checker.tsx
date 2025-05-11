"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { isSupabaseMigrationCompleted } from "@/lib/db-supabase"

export default function MigrationStatusChecker() {
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking")
  const [message, setMessage] = useState("Verificando status da migração...")
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function checkMigration() {
      try {
        // Verificar se a migração foi concluída
        const migrationCompleted = isSupabaseMigrationCompleted()

        if (!migrationCompleted) {
          setStatus("error")
          setMessage("A migração para o Supabase ainda não foi concluída.")
          return
        }

        // Tentar buscar dados do Supabase
        const supabase = createSupabaseClient()

        // Verificar categorias
        const { data: categories, error: categoriesError } = await supabase.from("categories").select("*")
        if (categoriesError) {
          throw new Error(`Erro ao buscar categorias: ${categoriesError.message}`)
        }

        // Verificar produtos
        const { data: products, error: productsError } = await supabase.from("products").select("*")
        if (productsError) {
          throw new Error(`Erro ao buscar produtos: ${productsError.message}`)
        }

        // Verificar adicionais
        const { data: additionals, error: additionalsError } = await supabase.from("additionals").select("*")
        if (additionalsError) {
          throw new Error(`Erro ao buscar adicionais: ${additionalsError.message}`)
        }

        // Verificar carrossel
        const { data: carousel, error: carouselError } = await supabase.from("carousel_slides").select("*")
        if (carouselError) {
          throw new Error(`Erro ao buscar slides do carrossel: ${carouselError.message}`)
        }

        // Verificar frases
        const { data: phrases, error: phrasesError } = await supabase.from("phrases").select("*")
        if (phrasesError) {
          throw new Error(`Erro ao buscar frases: ${phrasesError.message}`)
        }

        // Verificar configuração da loja
        const { data: storeConfig, error: storeConfigError } = await supabase.from("store_config").select("*")
        if (storeConfigError) {
          throw new Error(`Erro ao buscar configuração da loja: ${storeConfigError.message}`)
        }

        // Tudo OK, migração concluída com sucesso
        setStatus("success")
        setMessage("Migração para o Supabase concluída com sucesso!")
        setData({
          categories: categories.length,
          products: products.length,
          additionals: additionals.length,
          carousel: carousel.length,
          phrases: phrases.length,
          storeConfig: storeConfig.length,
        })
      } catch (error) {
        console.error("Erro ao verificar migração:", error)
        setStatus("error")
        setMessage(`Erro ao verificar migração: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    checkMigration()
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-purple-900 mb-4">Status da Migração para o Supabase</h2>

      {status === "checking" ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      ) : status === "success" ? (
        <div>
          <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">{message}</div>

          {data && (
            <div className="mt-4">
              <h3 className="font-medium text-purple-800 mb-2">Dados migrados:</h3>
              <ul className="space-y-1 text-gray-700">
                <li>Categorias: {data.categories}</li>
                <li>Produtos: {data.products}</li>
                <li>Adicionais: {data.additionals}</li>
                <li>Slides do Carrossel: {data.carousel}</li>
                <li>Frases: {data.phrases}</li>
                <li>Configuração da Loja: {data.storeConfig}</li>
              </ul>
            </div>
          )}

          <div className="mt-6">
            <p className="text-green-600 font-medium">O sistema está usando o Supabase como banco de dados!</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{message}</div>

          <div className="mt-4">
            <p className="text-gray-700">
              Para iniciar a migração, acesse a página inicial do sistema. A migração será iniciada automaticamente.
            </p>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Ir para a Página Inicial
          </button>
        </div>
      )}
    </div>
  )
}
