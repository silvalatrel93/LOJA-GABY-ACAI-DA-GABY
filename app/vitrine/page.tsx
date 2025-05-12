"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { getActiveProducts } from "@/lib/services/product-service"
import { getStoreConfig } from "@/lib/services/store-config-service"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@/lib/types"
import type { StoreConfig } from "@/lib/types"

export default function VitrinePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activeProducts, config] = await Promise.all([getActiveProducts(), getStoreConfig()])

        console.log("Produtos carregados:", activeProducts)

        setProducts(activeProducts)
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-purple-600 text-white p-4 text-center">
        <div className="flex items-center justify-center">
          {storeConfig?.logoUrl && (
            <div className="relative w-12 h-12 mr-3">
              <Image
                src={storeConfig.logoUrl || "/placeholder.svg"}
                alt={`Logo ${storeConfig.name || "Açaí Online"}`}
                fill
                className="object-contain rounded-full bg-white p-1"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{storeConfig?.name || "Açaí Online"}</h1>
        </div>
        <p className="mt-2">Confira nossos produtos deliciosos!</p>
      </header>

      {/* Lista de produtos */}
      <main className="max-w-screen-xl mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {product.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <p className="text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-purple-600">
                    {typeof product.price === "number" && !isNaN(product.price)
                      ? formatCurrency(product.price)
                      : "Consulte o preço"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA para acessar a loja completa */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Acessar Loja Completa
          </Link>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-purple-600 text-white p-4 text-center mt-8">
        <p>
          © {new Date().getFullYear()} {storeConfig?.name || "Açaí Online"}
        </p>
      </footer>
    </div>
  )
}
