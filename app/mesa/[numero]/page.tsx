"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, QrCode, Users, Clock } from "lucide-react"
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
import { TableService } from "@/lib/services/table-service"
import type { CarouselSlide } from "@/lib/services/carousel-service"
import type { Product } from "@/lib/services/product-service"
import type { Phrase } from "@/lib/services/phrase-service"
import type { StoreConfig } from "@/lib/services/store-config-service"
import type { Table, Category } from "@/lib/types"

export default function MesaPage() {
  const params = useParams()
  const numeroMesa = params?.numero as string

  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
  const [storeOpen, setStoreOpen] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [table, setTable] = useState<Table | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        setTableError(null)

        // Verificar se a mesa existe e está ativa
        if (numeroMesa) {
          const tableNumber = parseInt(numeroMesa)
          if (isNaN(tableNumber)) {
            setTableError("Número da mesa inválido")
            setLoading(false)
            return
          }

          const tableData = await TableService.getTableByNumber(tableNumber)
          if (!tableData) {
            setTableError("Mesa não encontrada ou inativa")
            setLoading(false)
            return
          }

          setTable(tableData)
        }

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
  }, [numeroMesa])

  // Salvar informações da mesa no localStorage para usar no checkout
  useEffect(() => {
    console.log('Mesa useEffect executado:', { table, hasTable: !!table })

    if (table) {
      const mesaData = {
        id: table.id,
        number: table.number,
        name: table.name
      }

      localStorage.setItem('mesa_atual', JSON.stringify(mesaData))
      console.log('Mesa configurada no localStorage:', mesaData)
      console.log('Verificando se foi salvo:', localStorage.getItem('mesa_atual'))

      // Disparar evento customizado para notificar o contexto do carrinho
      window.dispatchEvent(new CustomEvent('mesa-configurada', {
        detail: mesaData
      }))
    } else {
      console.log('Table é null/undefined, não salvando no localStorage')
    }
  }, [table])

  if (tableError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="bg-red-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <QrCode className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Mesa não encontrada</h1>
          <p className="text-red-600 mb-6">{tableError}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout carouselSlides={slides} showCart={true}>
      {/* Header da Mesa */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-4 mb-4 rounded-lg mx-4 mt-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{table?.name || `Mesa ${numeroMesa}`}</h1>
            <p className="text-purple-100 text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl break-words leading-tight max-w-full overflow-hidden whitespace-normal">Faça seu pedido diretamente da mesa</p>
          </div>
        </div>
      </div>

      {/* Informações importantes para mesa */}
      <div className="mx-2 sm:mx-4 mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2 text-xs sm:text-sm md:text-base">📋 Informações do pedido</h3>
        <ul className="text-[10px] xs:text-xs sm:text-sm text-yellow-700 space-y-1 leading-relaxed">
          <li className="break-words">• Seu pedido será preparado e entregue na mesa</li>
          <li className="break-words">• Não há taxa de entrega para pedidos na mesa</li>
          <li className="break-words">• Aguarde a confirmação do pedido pela equipe</li>
        </ul>
      </div>

      {/* Carrossel de frases */}
      {phrases && phrases.length > 0 && <TextCarousel phrases={phrases} />}

      {/* Aviso de loja fechada */}
      {!storeOpen && <StoreClosedNotice />}

      <div className="w-screen py-0" style={{
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