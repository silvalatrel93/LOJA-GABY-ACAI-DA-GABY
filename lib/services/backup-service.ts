import { createSupabaseClient } from "@/lib/supabase-client"
import * as ProductService from "./product-service"
import * as CategoryService from "./category-service"
import * as AdditionalService from "./additional-service"
import * as CarouselService from "./carousel-service"
import * as PhraseService from "./phrase-service"
import * as StoreConfigService from "./store-config-service"
import * as OrderService from "./order-service"
import * as PageContentService from "./page-content-service"
import * as NotificationService from "./notification-service"
import { DEFAULT_STORE_ID } from "../constants"

// Função para fazer backup de todos os dados
export async function backupAllData() {
  try {
    const supabase = createSupabaseClient()

    // Obter todos os dados do Supabase
    const [products, categories, additionals, slides, phrases, orders, storeConfig, pageContents, notifications] =
      await Promise.all([
        ProductService.getAllProducts(),
        CategoryService.getAllCategories(),
        AdditionalService.getAllAdditionals(),
        CarouselService.getAllSlides(),
        PhraseService.getAllPhrases(),
        OrderService.getAllOrders(),
        StoreConfigService.getStoreConfig(),
        PageContentService.getAllPageContents(),
        NotificationService.getAllNotifications(),
      ])

    // Criar objeto de backup
    const backupData = {
      timestamp: new Date().toISOString(),
      products,
      categories,
      additionals,
      slides,
      phrases,
      orders,
      storeConfig,
      pageContents,
      notifications,
    }

    // Salvar backup na tabela backups
    const { data, error } = await supabase
      .from("backups")
      .insert({
        data: backupData,
        created_at: new Date().toISOString(),
        store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
      })
      .select()

    if (error) {
      console.error("Erro ao salvar backup no Supabase:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao fazer backup dos dados:", error)
    return false
  }
}

// Função para obter todos os backups
export async function getAllBackups() {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("backups").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao obter backups:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Erro ao obter backups:", error)
    return []
  }
}

// Função para restaurar um backup específico
export async function restoreBackup(backupId: number) {
  try {
    const supabase = createSupabaseClient()
    // Obter o backup
    const { data, error } = await supabase.from("backups").select("*").eq("id", backupId).single()

    if (error || !data) {
      console.error("Erro ao obter backup para restauração:", error)
      return false
    }

    const backupData = data.data

    // Restaurar dados
    await restoreData(backupData)

    return true
  } catch (error) {
    console.error("Erro ao restaurar backup:", error)
    return false
  }
}

// Função para restaurar dados
export async function restoreData(data: any) {
  // Limpar tabelas existentes (opcional, dependendo da estratégia de restauração)
  // await clearAllTables()

  // Importar dados para o Supabase
  const importPromises = []

  if (data.categories && Array.isArray(data.categories)) {
    importPromises.push(Promise.all(data.categories.map((category: any) => CategoryService.saveCategory(category))))
  }

  if (data.additionals && Array.isArray(data.additionals)) {
    importPromises.push(
      Promise.all(data.additionals.map((additional: any) => AdditionalService.saveAdditional(additional))),
    )
  }

  if (data.products && Array.isArray(data.products)) {
    importPromises.push(Promise.all(data.products.map((product: any) => ProductService.saveProduct(product))))
  }

  if (data.slides && Array.isArray(data.slides)) {
    importPromises.push(Promise.all(data.slides.map((slide: any) => CarouselService.saveSlide(slide))))
  }

  if (data.phrases && Array.isArray(data.phrases)) {
    importPromises.push(Promise.all(data.phrases.map((phrase: any) => PhraseService.savePhrase(phrase))))
  }

  if (data.storeConfig) {
    importPromises.push(StoreConfigService.saveStoreConfig(data.storeConfig))
  }

  if (data.pageContents && Array.isArray(data.pageContents)) {
    importPromises.push(
      Promise.all(data.pageContents.map((content: any) => PageContentService.savePageContent(content))),
    )
  }

  if (data.notifications && Array.isArray(data.notifications)) {
    importPromises.push(
      Promise.all(data.notifications.map((notification: any) => NotificationService.saveNotification(notification))),
    )
  }

  // Não restauramos pedidos para evitar duplicações

  await Promise.all(importPromises)
}

// Função para excluir um backup
export async function deleteBackup(backupId: number) {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("backups").delete().eq("id", backupId)

    if (error) {
      console.error("Erro ao excluir backup:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao excluir backup:", error)
    return false
  }
}

// Função para limpar todas as tabelas (use com cuidado!)
async function clearAllTables() {
  try {
    const supabase = createSupabaseClient()
    await Promise.all([
      supabase.from("products").delete().neq("id", 0),
      supabase.from("categories").delete().neq("id", 0),
      supabase.from("additionals").delete().neq("id", 0),
      supabase.from("carousel_slides").delete().neq("id", 0),
      supabase.from("phrases").delete().neq("id", 0),
      supabase.from("store_config").delete().neq("id", 0),
      supabase.from("page_contents").delete().neq("id", 0),
      supabase.from("notifications").delete().neq("id", 0),
    ])
    return true
  } catch (error) {
    console.error("Erro ao limpar tabelas:", error)
    return false
  }
}
