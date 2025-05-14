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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
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
          slidesData = await getActiveSlides()
        } catch (e) {
          console.error("Erro ao carregar slides:", e)
          slidesData = []
        }

        try {
          categoriesData = await getActiveCategories()
        } catch (e) {
          console.error("Erro ao carregar categorias:", e)
          categoriesData = []
        }

        try {
          productsData = await getActiveProducts()
        } catch (e) {
          console.error("Erro ao carregar produtos:", e)
          productsData = []
        }

        try {
          phrasesData = await getActivePhrases()
        } catch (e) {
          console.error("Erro ao carregar frases:", e)
          phrasesData = []
        }

        try {
          configData = await getStoreConfig()
        } catch (e) {
          console.error("Erro ao carregar configurações da loja:", e)
          configData = null
        }

        try {
          storeStatus = await getStoreStatus()
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
  }, [])

  return (
    <MainLayout carouselSlides={slides} showCart={true}>
      {/* Carrossel de frases */}
      {phrases && phrases.length > 0 && <TextCarousel phrases={phrases} />}

      {/* Aviso de loja fechada logo após o carrossel de frases */}
      {!storeOpen && <StoreClosedNotice />}

      <div className="w-screen py-6" style={{ 
        marginLeft: 'calc(-50vw + 50%)', 
        marginRight: 'calc(-50vw + 50%)', 
        width: '100vw', 
        background: 'linear-gradient(to bottom, #f3e8ff, white)' 
      }}>
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
          <ProductList products={products} categories={categories} />
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      <FloatingCartButton />
    </MainLayout>
  )
}
