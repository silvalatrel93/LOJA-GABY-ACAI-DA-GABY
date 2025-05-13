"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useStore } from "@/lib/store-context"
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
import type { CarouselSlide } from "@/lib/types"
import type { Category } from "@/lib/types"
import type { Product } from "@/lib/types"
import type { Phrase } from "@/lib/types"
import type { StoreConfig } from "@/lib/types"

export default function StoreHomePage() {
  const { currentStore } = useStore()
  const params = useParams()
  const slug = params.slug as string

  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [storeOpen, setStoreOpen] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!currentStore) return

      try {
        setLoading(true)
        setError(null)

        // Carrega os dados com tratamento de erros para cada serviço
        let slidesData: CarouselSlide[] = []
        let categoriesData: Category[] = []
        let productsData: Product[] = []
        let phrasesData: Phrase[] = []
        let configData: StoreConfig | null = null
        let storeStatus = { isOpen: true }

        try {
          slidesData = await getActiveSlides(currentStore.id)
        } catch (e) {
          console.error("Erro ao carregar slides:", e)
          slidesData = []
        }

        try {
          categoriesData = await getActiveCategories(currentStore.id)
        } catch (e) {
          console.error("Erro ao carregar categorias:", e)
          categoriesData = []
        }

        try {
          productsData = await getActiveProducts(currentStore.id)
        } catch (e) {
          console.error("Erro ao carregar produtos:", e)
          productsData = []
        }

        try {
          phrasesData = await getActivePhrases(currentStore.id)
        } catch (e) {
          console.error("Erro ao carregar frases:", e)
          phrasesData = []
        }

        try {
          configData = await getStoreConfig(currentStore.id)
        } catch (e) {
          console.error("Erro ao carregar configurações da loja:", e)
          configData = null
        }

        try {
          storeStatus = await getStoreStatus(currentStore.id)
        } catch (e) {
          console.error("Erro ao verificar status da loja:", e)
          storeStatus = { isOpen: true }
        }

        setSlides(slidesData)
        setCategories(categoriesData)
        setProducts(productsData)
        setPhrases(phrasesData)
        setStoreConfig(configData)
        setStoreOpen(storeStatus.isOpen)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError("Ocorreu um erro ao carregar os dados. Por favor, tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentStore])

  return (
    <MainLayout carouselSlides={slides} showCart={true} storeId={currentStore?.id}>
      {/* Carrossel de frases */}
      {phrases && phrases.length > 0 && <TextCarousel phrases={phrases} />}

      {/* Aviso de loja fechada logo após o carrossel de frases */}
      {!storeOpen && <StoreClosedNotice />}

      <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-purple-100 to-white rounded-lg">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <ProductList products={products} categories={categories} storeId={currentStore?.id} />
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      <FloatingCartButton storeId={currentStore?.id} />
    </MainLayout>
  )
}
