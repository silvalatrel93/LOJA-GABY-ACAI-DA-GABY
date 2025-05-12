"use client"

import { useState, useEffect } from "react"
import { getAllActiveProducts, getProductsByCategory } from "@/lib/services/product-service"
import { getActiveCategories } from "@/lib/services/category-service"
import ProductCard from "@/components/product-card"
import type { Product } from "@/lib/services/product-service"
import type { Category } from "@/lib/services/category-service"

export default function ProductList({ products: initialProducts = [], categories: initialCategories = [] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const activeCategories = await getActiveCategories()

        // Adicionar opção "Todos" no início
        const allOption: Category = {
          id: 0, // Usando 0 como ID para "Todos"
          name: "Todos",
          order: -1,
          active: true,
        }

        const categoriesWithAll = [allOption, ...activeCategories]
        setCategories(categoriesWithAll)

        // Se houver categorias e nenhuma estiver selecionada, selecionar a primeira (Todos)
        if (categoriesWithAll.length > 0 && selectedCategory === null) {
          setSelectedCategory(categoriesWithAll[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      }
    }

    loadCategories()
  }, [])

  // Carregar todos os produtos uma vez
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        const allProductsList = await getAllActiveProducts()
        setAllProducts(allProductsList)
      } catch (error) {
        console.error("Erro ao carregar todos os produtos:", error)
      }
    }

    loadAllProducts()
  }, [])

  // Carregar produtos com base na categoria selecionada
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true)
      try {
        let productsList: Product[]

        if (selectedCategory === 0) {
          // 0 é o ID para "Todos"
          productsList = allProducts
        } else if (selectedCategory !== null) {
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
  }, [selectedCategory, allProducts])

  return (
    <div className="w-full flex flex-col">
      {/* Filtro de categorias - agora fixo */}
      <div
        className="sticky top-[40px] z-10 bg-gray-50 py-2 border-b border-gray-200 shadow-sm w-screen left-0 right-0"
        style={{
          marginLeft: "calc(-50vw + 50%)",
          marginRight: "calc(-50vw + 50%)",
          width: "100vw",
          boxSizing: "border-box",
        }}
      >
        <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide pl-4 pr-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-purple-700 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Área rolável para os produtos */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Lista de produtos */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : selectedCategory === 0 ? (
          // Exibição agrupada por categoria quando "Todos" está selecionado
          <div>
            {categories
              .filter((category) => category.id !== 0) // Excluir a categoria "Todos"
              .map((category) => {
                const categoryProducts = products.filter((product) => product.categoryId === category.id)

                if (categoryProducts.length === 0) return null

                return (
                  <div key={category.id} className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-purple-800">{category.name}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          // Exibição normal para categorias específicas
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
