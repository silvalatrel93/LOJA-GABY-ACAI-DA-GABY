"use client"

import Image from "next/image"
import Link from "next/link"
import ProductsInitializer from "@/components/products-initializer"
import CarouselInitializer from "@/components/carousel-initializer"
import CategoriesInitializer from "@/components/categories-initializer"
import AdditionalsInitializer from "@/components/additionals-initializer"
import PhrasesInitializer from "@/components/phrases-initializer"
import StoreConfigInitializer from "@/components/store-config-initializer"
import PageContentInitializer from "@/components/page-content-initializer"
import StoreHeader from "@/components/store-header"
import { products } from "@/lib/data"
import ProductsLoader from "@/components/products-loader"
import { useState, useEffect } from "react"
import {
  getActiveCarouselSlides,
  getActiveCategories,
  getStoreConfig,
  type CarouselSlide,
  type Category,
} from "@/lib/db"
import TextCarousel from "@/components/text-carousel"
import StoreClosedNotice from "@/components/store-closed-notice"

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [storeConfig, setStoreConfig] = useState<{ name: string } | null>(null)

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        const activeCategories = await getActiveCategories()
        setCategories(activeCategories)

        // Definir a primeira categoria como ativa por padrão
        if (activeCategories.length > 0 && !activeCategory) {
          setActiveCategory(activeCategories[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar categorias:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [activeCategory])

  // Carregar configurações da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      }
    }

    loadStoreConfig()
  }, [])

  return (
    <main className="flex min-h-screen flex-col">
      {/* Componentes para inicializar dados no IndexedDB */}
      <ProductsInitializer defaultProducts={products} />
      <CarouselInitializer />
      <CategoriesInitializer />
      <AdditionalsInitializer />
      <PhrasesInitializer />
      <StoreConfigInitializer />
      <PageContentInitializer />

      {/* Header com logo e nome da loja */}
      <StoreHeader />

      {/* Aviso de loja fechada */}
      <StoreClosedNotice />

      {/* Hero Section - Carrossel */}
      <div className="relative w-full h-64 md:h-80 bg-white">
        <CarouselHero />
      </div>

      {/* Carrossel de frases */}
      <div className="bg-purple-900 text-white py-2">
        <TextCarousel />
      </div>

      {/* Admin Link (apenas para desenvolvimento) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link href="/admin">
          <button className="bg-gray-700 hover:bg-gray-800 text-white p-2 rounded-full shadow-lg text-xs">Admin</button>
        </Link>
      </div>

      {/* Products Section */}
      <section className="p-4 bg-purple-50">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">Nossos Produtos</h2>

        {/* Categorias */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === null ? "bg-purple-700 text-white" : "bg-white text-purple-900 hover:bg-purple-100"
              }`}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === category.id
                    ? "bg-purple-700 text-white"
                    : "bg-white text-purple-900 hover:bg-purple-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <ProductsLoader categoryId={activeCategory} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 text-white p-4 mt-auto">
        <div className="text-center">
          <p>
            © {new Date().getFullYear()} {storeConfig?.name || "Açaí Delícia"} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </main>
  )
}

// Componente de Carrossel para o Hero
function CarouselHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar slides do banco de dados
  useEffect(() => {
    const loadSlides = async () => {
      try {
        setLoading(true)
        const activeSlides = await getActiveCarouselSlides()

        if (activeSlides.length > 0) {
          setSlides(activeSlides)
        } else {
          // Fallback para slides padrão se não houver slides ativos
          setSlides([
            {
              id: 1,
              image: "/placeholder.svg?key=qip7s",
              title: "Açaí Delícia",
              subtitle: "O melhor açaí da região, agora no seu celular!",
              order: 1,
              active: true,
            },
          ])
        }
      } catch (error) {
        console.error("Erro ao carregar slides do carrossel:", error)
        // Fallback para slide padrão em caso de erro
        setSlides([
          {
            id: 1,
            image: "/placeholder.svg?key=qip7s",
            title: "Açaí Delícia",
            subtitle: "O melhor açaí da região, agora no seu celular!",
            order: 1,
            active: true,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    loadSlides()
  }, [])

  // Função para ir para o próximo slide
  const nextSlide = () => {
    if (slides.length <= 1) return
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  // Alternar slides automaticamente a cada 5 segundos
  useEffect(() => {
    if (slides.length <= 1) return // Não alternar se houver apenas um slide

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    )
  }

  return (
    <>
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-center ${
            index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Container para a imagem com object-fit: contain */}
          <div className="relative w-full h-full">
            <Image
              src={slide.image || "/placeholder.svg"}
              alt={slide.title || "Slide do carrossel"}
              fill
              className="object-contain"
              priority={index === 0}
            />
          </div>
        </div>
      ))}

      {/* Indicadores (apenas se houver mais de um slide) */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full ${index === currentSlide ? "bg-purple-700" : "bg-purple-300"}`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </>
  )
}
