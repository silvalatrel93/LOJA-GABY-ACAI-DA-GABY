import {
  getAllProducts,
  getAllCategories,
  getAllAdditionals,
  getAllCarouselSlides,
  getAllPhrases,
  getAllOrders,
  getStoreConfig,
  getAllNotifications,
  getAllPageContents,
} from "@/lib/db" // Importa do IndexedDB

import {
  saveProductToSupabase,
  saveCategoryToSupabase,
  saveAdditionalToSupabase,
  saveCarouselSlideToSupabase,
  savePhraseToSupabase,
  saveOrderToSupabase,
  saveStoreConfigToSupabase,
  saveNotificationToSupabase,
  savePageContentToSupabase,
} from "@/lib/db-supabase" // Funções para salvar no Supabase

// Interface para o resultado da migração
export interface MigrationResult {
  success: boolean
  message: string
  details?: {
    products?: number
    categories?: number
    additionals?: number
    carouselSlides?: number
    phrases?: number
    orders?: number
    notifications?: number
    pageContents?: number
    storeConfig?: boolean
  }
  errors?: string[]
}

// Função para migrar todos os dados do IndexedDB para o Supabase
export async function migrateAllData(): Promise<MigrationResult> {
  const errors: string[] = []
  const details: MigrationResult["details"] = {}

  try {
    // 1. Migrar categorias
    try {
      const categories = await getAllCategories()
      for (const category of categories) {
        await saveCategoryToSupabase(category)
      }
      details.categories = categories.length
    } catch (error) {
      console.error("Erro ao migrar categorias:", error)
      errors.push(`Erro ao migrar categorias: ${error}`)
    }

    // 2. Migrar produtos
    try {
      const products = await getAllProducts()
      for (const product of products) {
        await saveProductToSupabase(product)
      }
      details.products = products.length
    } catch (error) {
      console.error("Erro ao migrar produtos:", error)
      errors.push(`Erro ao migrar produtos: ${error}`)
    }

    // 3. Migrar adicionais
    try {
      const additionals = await getAllAdditionals()
      for (const additional of additionals) {
        await saveAdditionalToSupabase(additional)
      }
      details.additionals = additionals.length
    } catch (error) {
      console.error("Erro ao migrar adicionais:", error)
      errors.push(`Erro ao migrar adicionais: ${error}`)
    }

    // 4. Migrar slides do carrossel
    try {
      const carouselSlides = await getAllCarouselSlides()
      for (const slide of carouselSlides) {
        await saveCarouselSlideToSupabase(slide)
      }
      details.carouselSlides = carouselSlides.length
    } catch (error) {
      console.error("Erro ao migrar slides do carrossel:", error)
      errors.push(`Erro ao migrar slides do carrossel: ${error}`)
    }

    // 5. Migrar frases
    try {
      const phrases = await getAllPhrases()
      for (const phrase of phrases) {
        await savePhraseToSupabase(phrase)
      }
      details.phrases = phrases.length
    } catch (error) {
      console.error("Erro ao migrar frases:", error)
      errors.push(`Erro ao migrar frases: ${error}`)
    }

    // 6. Migrar pedidos
    try {
      const orders = await getAllOrders()
      for (const order of orders) {
        await saveOrderToSupabase(order)
      }
      details.orders = orders.length
    } catch (error) {
      console.error("Erro ao migrar pedidos:", error)
      errors.push(`Erro ao migrar pedidos: ${error}`)
    }

    // 7. Migrar configurações da loja
    try {
      const storeConfig = await getStoreConfig()
      if (storeConfig) {
        await saveStoreConfigToSupabase(storeConfig)
        details.storeConfig = true
      }
    } catch (error) {
      console.error("Erro ao migrar configurações da loja:", error)
      errors.push(`Erro ao migrar configurações da loja: ${error}`)
    }

    // 8. Migrar notificações
    try {
      const notifications = await getAllNotifications()
      for (const notification of notifications) {
        await saveNotificationToSupabase(notification)
      }
      details.notifications = notifications.length
    } catch (error) {
      console.error("Erro ao migrar notificações:", error)
      errors.push(`Erro ao migrar notificações: ${error}`)
    }

    // 9. Migrar conteúdo das páginas
    try {
      const pageContents = await getAllPageContents()
      for (const pageContent of pageContents) {
        await savePageContentToSupabase(pageContent)
      }
      details.pageContents = pageContents.length
    } catch (error) {
      console.error("Erro ao migrar conteúdo das páginas:", error)
      errors.push(`Erro ao migrar conteúdo das páginas: ${error}`)
    }

    // Marcar migração como concluída
    localStorage.setItem("migrationCompleted", "true")
    localStorage.setItem("migrationDate", new Date().toISOString())

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? "Migração concluída com sucesso!" : "Migração concluída com alguns erros.",
      details,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("Erro durante a migração:", error)
    return {
      success: false,
      message: "Erro durante a migração. Verifique o console para mais detalhes.",
      errors: [`Erro geral: ${error}`],
    }
  }
}

// Função para verificar se a migração já foi concluída
export function isMigrationCompleted(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("migrationCompleted") === "true"
}

// Função para obter a data da última migração
export function getLastMigrationDate(): Date | null {
  if (typeof window === "undefined") return null
  const dateStr = localStorage.getItem("migrationDate")
  return dateStr ? new Date(dateStr) : null
}
