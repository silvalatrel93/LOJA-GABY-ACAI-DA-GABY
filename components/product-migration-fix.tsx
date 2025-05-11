"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { exportAllData } from "@/lib/db"

export default function ProductMigrationFix() {
  const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [productCount, setProductCount] = useState(0)

  const handleFixProducts = async () => {
    try {
      setStatus("migrating")
      setMessage("Verificando produtos...")

      // Verificar produtos no Supabase
      const supabase = createSupabaseClient()
      const { data: existingProducts, error: checkError } = await supabase.from("products").select("*")

      if (checkError) {
        throw new Error(`Erro ao verificar produtos: ${checkError.message}`)
      }

      if (existingProducts && existingProducts.length > 0) {
        setMessage(`Já existem ${existingProducts.length} produtos no Supabase.`)
        setProductCount(existingProducts.length)
        setStatus("success")
        return
      }

      // Exportar dados do IndexedDB
      setMessage("Exportando dados do IndexedDB...")
      const data = await exportAllData()

      if (!data.products || data.products.length === 0) {
        setMessage("Não há produtos no IndexedDB para migrar.")
        setStatus("error")
        return
      }

      // Migrar produtos para o Supabase
      setMessage(`Migrando ${data.products.length} produtos para o Supabase...`)

      for (const product of data.products) {
        const { error } = await supabase.from("products").upsert(
          {
            id: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            sizes: product.sizes,
            category_id: product.categoryId,
            active: product.active !== undefined ? product.active : true,
            allowed_additionals: product.allowedAdditionals || null,
          },
          { onConflict: "id" },
        )

        if (error) {
          throw new Error(`Erro ao migrar produto ${product.id}: ${error.message}`)
        }
      }

      setProductCount(data.products.length)
      setMessage(`${data.products.length} produtos migrados com sucesso!`)
      setStatus("success")
    } catch (error) {
      console.error("Erro ao migrar produtos:", error)
      setStatus("error")
      setMessage(`Erro ao migrar produtos: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-semibold text-purple-900 mb-4">Correção de Migração de Produtos</h2>

      {status === "idle" ? (
        <div>
          <p className="text-gray-700 mb-4">
            Parece que os produtos não foram migrados corretamente. Clique no botão abaixo para tentar migrar os
            produtos novamente.
          </p>
          <button
            onClick={handleFixProducts}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Migrar Produtos
          </button>
        </div>
      ) : status === "migrating" ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      ) : status === "success" ? (
        <div className="bg-green-100 text-green-700 p-4 rounded-md">
          <p>{message}</p>
          {productCount > 0 && <p className="mt-2">O sistema agora tem {productCount} produtos no Supabase.</p>}
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Recarregar Página
          </button>
        </div>
      ) : (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{message}</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}
