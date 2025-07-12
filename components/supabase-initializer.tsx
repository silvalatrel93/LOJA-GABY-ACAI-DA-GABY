"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase-client"
import { CategoryService } from "@/lib/services/category-service"
import { ProductService } from "@/lib/services/product-service"
import { CarouselService } from "@/lib/services/carousel-service"
import { AdditionalService } from "@/lib/services/additional-service"
import { PhraseService, phraseExists } from "@/lib/services/phrase-service"
import { StoreConfigService } from "@/lib/services/store-config-service"
import { PageContentService } from "@/lib/services/page-content-service"
import { NotificationService } from "@/lib/services/notification-service"

export default function SupabaseInitializer() {
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("Verificando conexão com Supabase...")
        const supabase = createSupabaseClient()

        // Verificar se o Supabase está disponível
        try {
          const { data, error } = await supabase.from("categories").select("count")
          if (error) throw error
          console.log("Conexão com Supabase estabelecida com sucesso")
        } catch (err) {
          console.error("Erro ao conectar com Supabase:", err)
          setError("Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente.")
          return
        }

        // Inicializar dados
        await initializeCategories()
        await initializeProducts()
        await initializeAdditionals()
        await initializeCarouselSlides()
        await initializePhrases()
        await initializeStoreConfig()
        await initializePageContent()
        await initializeNotifications()

        console.log("Inicialização de dados concluída com sucesso!")
        setInitialized(true)
      } catch (err) {
        console.error("Erro durante a inicialização de dados:", err)
        setError(`Erro durante a inicialização de dados: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    initializeData()
  }, [])

  // Inicializar categorias
  const initializeCategories = async () => {
    console.log("Verificando categorias...")
    const categories = await CategoryService.getAllCategories()

    if (categories.length === 0) {
      console.log("Inicializando categorias padrão...")

      // Categoria de Açaí Tradicional
      await CategoryService.saveCategory({
        id: 0, // Será gerado pelo banco
        name: "Açaí Tradicional",
        order: 1,
        active: true,
      })

      // Categoria de Açaí Especial
      await CategoryService.saveCategory({
        id: 0,
        name: "Açaí Especial",
        order: 2,
        active: true,
      })

      // Categoria de Adicionais
      await CategoryService.saveCategory({
        id: 0,
        name: "Adicionais",
        order: 3,
        active: true,
      })

      console.log("Categorias padrão inicializadas com sucesso!")
    } else {
      console.log(`${categories.length} categorias encontradas, pulando inicialização.`)
    }
  }

  // Inicializar produtos
  const initializeProducts = async () => {
    console.log("Verificando produtos...")
    const products = await ProductService.getAllProducts()

    if (products.length === 0) {
      console.log("Inicializando produtos padrão...")

      // Buscar categorias para obter os IDs
      const categories = await CategoryService.getAllCategories()
      const acaiTradicionalCategory = categories.find((c) => c.name === "Açaí Tradicional")
      const acaiEspecialCategory = categories.find((c) => c.name === "Açaí Especial")

      if (!acaiTradicionalCategory || !acaiEspecialCategory) {
        console.error("Categorias necessárias não encontradas!")
        return
      }

      // Produto Açaí Tradicional
      await ProductService.saveProduct({
        id: 0, // Será gerado pelo banco
        name: "Açaí Tradicional",
        description: "Açaí puro na tigela com granola e banana",
        image: "/acai-tradicional.jpg",
        sizes: [
          { size: "300ml", price: 15.9 },
          { size: "500ml", price: 19.9 },
          { size: "700ml", price: 24.9 },
        ],
        categoryId: acaiTradicionalCategory.id,
        active: true,
        allowedAdditionals: [],
      })

      // Produto Açaí Especial
      await ProductService.saveProduct({
        id: 0,
        name: "Açaí Especial",
        description: "Açaí com leite condensado, morango e kiwi",
        image: "/acai-bowl-special.png",
        sizes: [
          { size: "300ml", price: 18.9 },
          { size: "500ml", price: 22.9 },
          { size: "700ml", price: 27.9 },
        ],
        categoryId: acaiEspecialCategory.id,
        active: true,
        allowedAdditionals: [],
      })

      console.log("Produtos padrão inicializados com sucesso!")
    } else {
      console.log(`${products.length} produtos encontrados, pulando inicialização.`)
    }
  }

  // Inicializar adicionais
  const initializeAdditionals = async () => {
    console.log("Verificando adicionais...")
    const additionals = await AdditionalService.getAllAdditionals()

    if (additionals.length === 0) {
      console.log("Inicializando adicionais padrão...")

      // Buscar categoria de adicionais
      const categories = await CategoryService.getAllCategories()
      const additionalsCategory = categories.find((c) => c.name === "Adicionais")

      if (!additionalsCategory) {
        console.error("Categoria de adicionais não encontrada!")
        return
      }

      // Adicional Banana
      await AdditionalService.saveAdditional({
        id: 0, // Será gerado pelo banco
        name: "Banana",
        price: 2.0,
        categoryId: additionalsCategory.id,
        active: true,
        image: "/ripe-banana.png",
      })

      // Adicional Morango
      await AdditionalService.saveAdditional({
        id: 0,
        name: "Morango",
        price: 3.0,
        categoryId: additionalsCategory.id,
        active: true,
        image: "/ripe-strawberry.png",
      })

      // Adicional Leite Condensado
      await AdditionalService.saveAdditional({
        id: 0,
        name: "Leite Condensado",
        price: 2.5,
        categoryId: additionalsCategory.id,
        active: true,
        image: "/can-condensed-milk.png",
      })

      console.log("Adicionais padrão inicializados com sucesso!")
    } else {
      console.log(`${additionals.length} adicionais encontrados, pulando inicialização.`)
    }
  }

  // Inicializar slides do carrossel
  const initializeCarouselSlides = async () => {
    console.log("Verificando slides do carrossel...")
    
    // Verificar se o carrossel já foi inicializado anteriormente
    const storeConfig = await StoreConfigService.getStoreConfig()
    
    // Se a configuração indicar que o carrossel já foi inicializado, não reinicializar
    if (storeConfig?.carousel_initialized) {
      console.log("Carrossel já foi inicializado anteriormente, respeitando as alterações do usuário.")
      return
    }
    
    const slides = await CarouselService.getAllSlides()

    if (slides.length === 0) {
      console.log("Inicializando slides do carrossel padrão...")

      // Slide 1
      await CarouselService.saveSlide({
        id: 0, // Será gerado pelo banco
        image: "/acai-tradicional.jpg",
        title: "Açaí Tradicional",
        subtitle: "Experimente nosso delicioso açaí tradicional",
        order: 1,
        active: true,
      })

      // Slide 2
      await CarouselService.saveSlide({
        id: 0,
        image: "/acai-bowl-special.png",
        title: "Açaí Especial",
        subtitle: "Experimente nosso delicioso açaí especial",
        order: 2,
        active: true,
      })
      
      // Atualizar a configuração para indicar que o carrossel já foi inicializado
      if (storeConfig) {
        await StoreConfigService.saveStoreConfig({
          ...storeConfig,
          carousel_initialized: true
        })
      }

      console.log("Slides do carrossel padrão inicializados com sucesso!")
    } else {
      console.log(`${slides.length} slides encontrados, pulando inicialização.`)
      
      // Mesmo que já existam slides, marcar como inicializado para evitar reinicialização futura
      if (storeConfig && !storeConfig.carousel_initialized) {
        await StoreConfigService.saveStoreConfig({
          ...storeConfig,
          carousel_initialized: true
        })
      }
    }
  }

  // Inicializar frases
  const initializePhrases = async () => {
    console.log("Verificando frases...")

    // Verificar se já existem frases no banco
    const existingPhrases = await phraseExists()

    if (!existingPhrases) {
      console.log("Inicializando frases padrão...")

      try {
        // Frase 1
        await PhraseService.savePhrase({
          id: 0, // ID será gerado pelo banco
          text: "O melhor açaí da cidade!",
          order: 1,
          active: true,
        })

        // Frase 2
        await PhraseService.savePhrase({
          id: 0, // ID será gerado pelo banco
          text: "Experimente nosso açaí especial!",
          order: 2,
          active: true,
        })

        // Frase 3
        await PhraseService.savePhrase({
          id: 0, // ID será gerado pelo banco
          text: "Entrega rápida e segura!",
          order: 3,
          active: true,
        })

        console.log("Frases padrão inicializadas com sucesso!")
      } catch (error) {
        console.error("Erro ao inicializar frases padrão:", error)
      }
    } else {
      console.log("Frases já existem no banco, pulando inicialização.")
    }
  }

  // Inicializar configuração da loja
  const initializeStoreConfig = async () => {
    console.log("Verificando configuração da loja...")
    const config = await StoreConfigService.getStoreConfig()

    if (!config) {
      console.log("Inicializando configuração da loja padrão...")

      await StoreConfigService.saveStoreConfig({
        id: "main",
                  name: "Heai Açai e Sorvetes",
        logoUrl: "",
        deliveryFee: 5.0,
        isOpen: true,
        operatingHours: {
          monday: { open: true, hours: "10:00 - 22:00" },
          tuesday: { open: true, hours: "10:00 - 22:00" },
          wednesday: { open: true, hours: "10:00 - 22:00" },
          thursday: { open: true, hours: "10:00 - 22:00" },
          friday: { open: true, hours: "10:00 - 22:00" },
          saturday: { open: true, hours: "10:00 - 22:00" },
          sunday: { open: true, hours: "10:00 - 22:00" },
        },
        specialDates: [],
      })

      console.log("Configuração da loja padrão inicializada com sucesso!")
    } else {
      console.log("Configuração da loja encontrada, pulando inicialização.")
    }
  }

  // Inicializar conteúdo das páginas
  const initializePageContent = async () => {
    console.log("Verificando conteúdo das páginas...")
    // Usar a função initializeDefaultPageContent do PageContentService
    await PageContentService.initializeDefaultPageContent()
  }

  // Inicializar notificações
  const initializeNotifications = async () => {
    console.log("Verificando notificações...")
    const notifications = await NotificationService.getAllNotifications()

    if (notifications.length === 0) {
      console.log("Inicializando notificações padrão...")

      // Notificação de boas-vindas
      const now = new Date()
      const oneMonthLater = new Date()
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

      await NotificationService.saveNotification({
        id: 0, // Será gerado pelo banco
        title: "Bem-vindo ao Sistema Heai Açai e Sorvetes",
        message: "Obrigado por usar nosso sistema! Estamos felizes em tê-lo conosco.",
        type: "info",
        active: true,
        startDate: now,
        endDate: oneMonthLater,
        priority: 1,
        read: false,
        createdAt: now,
      })

      console.log("Notificações padrão inicializadas com sucesso!")
    } else {
      console.log(`${notifications.length} notificações encontradas, pulando inicialização.`)
    }
  }

  // Renderizar mensagem de erro, se houver
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Erro de Inicialização</h2>
          <p className="mb-4">{error}</p>
          <p className="text-sm text-gray-600">Verifique as variáveis de ambiente e a conexão com o Supabase.</p>
        </div>
      </div>
    )
  }

  // Componente não renderiza nada visualmente quando não há erro
  return null
}
