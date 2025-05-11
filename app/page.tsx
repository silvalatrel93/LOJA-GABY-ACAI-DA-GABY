"use client"

import { useEffect, useState } from "react"
import MainLayout from "@/components/main-layout"
import ProductList from "@/components/product-list"
import TextCarousel from "@/components/text-carousel"
import StoreClosedNotice from "@/components/store-closed-notice"
import FloatingCartButton from "@/components/floating-cart-button"
import { getActiveSlides } from "@/lib/services/carousel-service"
import { getActiveCategories } from "@/lib/services/category-service"
import { getActiveProducts } from "@/lib/services/product-service"
import { getActivePhrases } from "@/lib/services/phrase-service"
import { getStoreConfig } from "@/lib/services/store-config-service"
import { getStoreStatus } from "@/lib/store-utils"
import type { CarouselSlide } from "@/lib/services/carousel-service"
import type { Category } from "@/lib/types"
import type { Product } from "@/lib/types"
import type { Phrase } from "@/lib/types"
import type { StoreConfig } from "@/lib/types"

export default function Home() {
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [storeOpen, setStoreOpen] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [slidesData, categoriesData, productsData, phrasesData, configData, storeStatus] = await Promise.all([
          getActiveSlides(),
          getActiveCategories(),
          getActiveProducts(),
          getActivePhrases(),
          getStoreConfig(),
          getStoreStatus(),
        ])

        setSlides(slidesData)
        setCategories(categoriesData)
        setProducts(productsData)
        setPhrases(phrasesData)
        setStoreConfig(configData)
        setStoreOpen(storeStatus.isOpen)

        console.log("Frases carregadas:", phrasesData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <MainLayout carouselSlides={slides} showCart={true}>
      {/* Carrossel de frases */}
      {phrases && phrases.length > 0 && <TextCarousel phrases={phrases} />}

      <div className="container mx-auto px-4 py-6">
        {!storeOpen && <StoreClosedNotice />}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <ProductList products={products} categories={categories} />
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      <FloatingCartButton />
    </MainLayout>
  )
}
