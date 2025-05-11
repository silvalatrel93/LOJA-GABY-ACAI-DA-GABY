"use client"

import { useState, useEffect } from "react"
import { getAllActiveProducts, getProductsByCategory } from "@/lib/services/product-service"
import { getActiveCategories } from "@/lib/services/category-service"
import ProductCard from "@/components/product-card"
import type { Product } from "@/lib/services/product-service"
import type { Category } from "@/lib/services/category-service"

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const activeCategories = await getActiveCategories()
        setCategories(activeCategories)

        // Se houver categorias e nenhuma estiver selecionada, selecionar a primeira
        if (activeCategories.length > 0 && selectedCategory === null) {
          setSelectedCategory(activeCategories[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      }
    }

    loadCategories()
  }, [selectedCategory])

  // Carregar produtos com base na categoria selecionada
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        let productsList: Product[]

        if (selectedCategory !== null) {
          productsList = await getProductsByCategory(selectedCategory)
        } else {
          productsList = await getAllActiveProducts()
        }

        setProducts(productsList)
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [selectedCategory])

  return (
    <div className="w-full py-6">
      {/* Filtro de categorias */}
      <div className="flex overflow-x-auto pb-2 mb-4 gap-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === category.id
                ? "bg-purple-700 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Lista de produtos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
