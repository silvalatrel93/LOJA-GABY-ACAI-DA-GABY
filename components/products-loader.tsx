"use client"

import { useEffect, useState } from "react"
import { getAllProducts, getProductsByCategory, type Product } from "@/lib/db"
import ProductCard from "@/components/product-card"
import { createSafeKey } from "@/lib/key-utils"

interface ProductsLoaderProps {
  categoryId: number | null
  storeColor?: string
}

export default function ProductsLoader({ categoryId, storeColor = "#8B5CF6" }: ProductsLoaderProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para carregar produtos que pode ser chamada para atualizar
  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      let productsList: Product[]

      if (categoryId === null) {
        // Carregar todos os produtos
        productsList = await getAllProducts()
      } else {
        // Carregar produtos por categoria
        productsList = await getProductsByCategory(categoryId)
      }

      console.log(`Produtos carregados (${categoryId ? "categoria " + categoryId : "todos"}):`, productsList.length)
      setProducts(productsList)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      setError("Falha ao carregar produtos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Carregar produtos na montagem do componente e quando a categoria mudar
  useEffect(() => {
    loadProducts()

    // Adicionar um listener para atualizar produtos quando a página ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProducts()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Limpar o listener quando o componente for desmontado
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [categoryId]) // Recarregar quando a categoria mudar

  if (loading) {
    return (
      <>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-36 bg-gray-200"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="flex justify-between items-center mt-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (error) {
    return (
      <div className="col-span-full text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={loadProducts} 
          className="text-white px-4 py-2 rounded-md transition-colors duration-200"
          style={{
            backgroundColor: storeColor,
            ':hover': { backgroundColor: `${storeColor}dd` }
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${storeColor}dd`}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = storeColor}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center p-8">
        <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
      </div>
    )
  }

  return (
    <>
      {products.map((product, index) => (
        <ProductCard key={createSafeKey(product.id, 'product-card-loader', index)} product={product} storeColor={storeColor} />
      ))}
    </>
  )
}
