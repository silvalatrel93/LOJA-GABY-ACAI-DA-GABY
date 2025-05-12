"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { getAllActiveProducts } from "@/lib/services/product-service"
import { getActiveCategories } from "@/lib/services/category-service"
import ProductCard from "@/components/product-card"
import type { Product } from "@/lib/services/product-service"
import type { Category } from "@/lib/services/category-service"

export default function ProductList({ products: initialProducts = [], categories: initialCategories = [] }) {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevScrollY = useRef(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Carregar categorias e todos os produtos uma única vez no início
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Carregar categorias
        const activeCategories = await getActiveCategories()
        const allOption: Category = {
          id: 0,
          name: "Todos",
          order: -1,
          active: true,
        }
        const categoriesWithAll = [allOption, ...activeCategories]
        setCategories(categoriesWithAll)

        // Carregar todos os produtos de uma vez
        const allProductsList = await getAllActiveProducts()
        setAllProducts(allProductsList)

        // Selecionar a primeira categoria por padrão
        if (categoriesWithAll.length > 0) {
          setSelectedCategory(categoriesWithAll[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
      } finally {
        setIsInitialLoading(false)
      }
    }

    initializeData()
  }, [])

  // Filtrar produtos com base na categoria selecionada (feito no cliente)
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return []
    if (selectedCategory === 0) return allProducts // "Todos"
    return allProducts.filter((product) => product.categoryId === selectedCategory)
  }, [selectedCategory, allProducts])

  // Salvar a posição de scroll atual
  useEffect(() => {
    const handleScroll = () => {
      prevScrollY.current = window.scrollY
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Função para mudar de categoria com transição suave
  const handleCategoryChange = (categoryId: number) => {
    if (categoryId === selectedCategory) return

    // Iniciar transição
    setIsTransitioning(true)

    // Mudar a categoria após um pequeno delay
    setTimeout(() => {
      setSelectedCategory(categoryId)

      // Terminar a transição após um breve período
      setTimeout(() => {
        setIsTransitioning(false)
      }, 300)
    }, 50)
  }

  // Renderizar produtos agrupados por categoria quando "Todos" está selecionado
  const renderProductsByCategory = () => {
    return categories
      .filter((category) => category.id !== 0) // Excluir a categoria "Todos"
      .map((category) => {
        const categoryProducts = allProducts.filter((product) => product.categoryId === category.id)

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
      })
  }

  return (
    <div className="w-full">
      {/* Filtro de categorias - sticky */}
      <div
        className="sticky top-[56px] z-10 bg-gray-50 py-2 border-b border-gray-200 shadow-sm w-screen left-0 right-0"
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
              onClick={() => handleCategoryChange(category.id)}
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

      {/* Conteúdo dos produtos com transição suave */}
      <div className="px-4 py-4 min-h-[500px]">
        {isInitialLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          </div>
        ) : (
          <div
            ref={contentRef}
            className={`transition-all duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
          >
            {filteredProducts.length === 0 && selectedCategory !== 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
              </div>
            ) : selectedCategory === 0 ? (
              // Exibição agrupada por categoria quando "Todos" está selecionado
              <div>{renderProductsByCategory()}</div>
            ) : (
              // Exibição normal para categorias específicas
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
