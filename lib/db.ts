// Este arquivo agora apenas exporta os serviços do Supabase
import * as ProductService from "./services/product-service"
import * as CategoryService from "./services/category-service"
import * as AdditionalService from "./services/additional-service"
import * as AdditionalCategoryService from "./services/additional-category-service"
import * as CarouselService from "./services/carousel-service"
import * as PhraseService from "./services/phrase-service"
import * as StoreConfigService from "./services/store-config-service"
import { OrderService } from "./services/order-service" // Importar diretamente o objeto OrderService
import * as PageContentService from "./services/page-content-service"
import { NotificationService } from "./services/notification-service"
import * as CartService from "./services/cart-service"
import * as BackupService from "./services/backup-service"

// Exportar todos os serviços
export {
  ProductService,
  CategoryService,
  AdditionalService,
  AdditionalCategoryService,
  CarouselService,
  PhraseService,
  StoreConfigService,
  OrderService,
  PageContentService,
  NotificationService,
  CartService,
  BackupService,
}

// Exportar tipos das entidades para manter compatibilidade com código existente
export type {
  Product,
  Category,
  Additional,
  CarouselSlide,
  Phrase,
  StoreConfig,
  Order,
  PageContent,
  Notification,
  CartItem,
} from "./types"

// Função para gerar um ID de sessão para o carrinho
export function getSessionId(): string {
  // Verificar se já existe um ID de sessão no localStorage
  let sessionId = localStorage.getItem("cart_session_id")

  // Se não existir, criar um novo
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("cart_session_id", sessionId)
  }

  return sessionId
}

// Funções de backup para manter compatibilidade com código existente
export async function backupData(): Promise<boolean> {
  try {
    const data = await exportAllData()
    localStorage.setItem("acai_backup_data", JSON.stringify(data))
    localStorage.setItem("acai_backup_date", new Date().toISOString())
    return true
  } catch (error) {
    console.error("Erro ao fazer backup dos dados:", error)
    return false
  }
}

export async function restoreFromBackup(): Promise<boolean> {
  try {
    const backupData = localStorage.getItem("acai_backup_data")
    if (!backupData) return false

    const data = JSON.parse(backupData)
    await importData(data)
    return true
  } catch (error) {
    console.error("Erro ao restaurar backup:", error)
    return false
  }
}

export async function exportAllData() {
  // Obter todos os dados do Supabase
  try {
    // Verificar se todas as funções existem antes de chamá-las
    if (typeof ProductService.getAllProducts !== "function") {
      console.error("ProductService.getAllProducts não é uma função")
    }
    if (typeof CategoryService.getAllCategories !== "function") {
      console.error("CategoryService.getAllCategories não é uma função")
    }
    if (typeof AdditionalService.getAllAdditionals !== "function") {
      console.error("AdditionalService.getAllAdditionals não é uma função")
    }
    if (typeof CarouselService.getAllSlides !== "function") {
      console.error("CarouselService.getAllSlides não é uma função")
    }
    if (typeof PhraseService.getAllPhrases !== "function") {
      console.error("PhraseService.getAllPhrases não é uma função")
    }
    if (typeof OrderService.getAllOrders !== "function") {
      console.error("OrderService.getAllOrders não é uma função")
    }
    if (typeof StoreConfigService.getStoreConfig !== "function") {
      console.error("StoreConfigService.getStoreConfig não é uma função")
    }
    if (typeof PageContentService.getAllPageContents !== "function") {
      console.error("PageContentService.getAllPageContents não é uma função")
    }
    if (typeof NotificationService.getAllNotifications !== "function") {
      console.error("NotificationService.getAllNotifications não é uma função")
    }

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

    return {
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
  } catch (error) {
    console.error("Erro ao exportar dados:", error)
    // Retornar um objeto vazio em caso de erro para evitar falhas catastróficas
    return {
      products: [],
      categories: [],
      additionals: [],
      slides: [],
      phrases: [],
      orders: [],
      storeConfig: null,
      pageContents: [],
      notifications: [],
    }
  }
}

export async function importData(data: any) {
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

  // Não importamos pedidos para evitar duplicações

  await Promise.all(importPromises)
}

// Exportar funções individuais para manter compatibilidade com código existente
export const getAllProducts = ProductService.getAllProducts
export const getActiveProducts = ProductService.getActiveProducts
// Removidas funções que não existem no ProductService
export const getProductById = ProductService.getProductById
export const saveProduct = ProductService.saveProduct
export const deleteProduct = ProductService.deleteProduct

export const getAllCategories = CategoryService.getAllCategories
export const getActiveCategories = CategoryService.getActiveCategories
export const getCategoryById = CategoryService.getCategoryById
export const saveCategory = CategoryService.saveCategory
export const deleteCategory = CategoryService.deleteCategory

// Exportar funções relacionadas a adicionais
export const getAllAdditionals = AdditionalService.getAllAdditionals.bind(AdditionalService)
export const getActiveAdditionals = AdditionalService.getActiveAdditionals.bind(AdditionalService)
export const getActiveAdditionalsByProduct = AdditionalService.getActiveAdditionalsByProduct.bind(AdditionalService)
export const getActiveAdditionalsByProductGroupedByCategory = AdditionalService.getActiveAdditionalsByProductGroupedByCategory.bind(AdditionalService)
export const getAdditionalById = AdditionalService.getAdditionalById.bind(AdditionalService)
export const saveAdditional = AdditionalService.saveAdditional.bind(AdditionalService)
export const deleteAdditional = AdditionalService.deleteAdditional.bind(AdditionalService)

// Exportar funções relacionadas a categorias de adicionais
export const getAllAdditionalCategories = AdditionalCategoryService.getAllAdditionalCategories.bind(AdditionalCategoryService)
export const getActiveAdditionalCategories = AdditionalCategoryService.getActiveAdditionalCategories.bind(AdditionalCategoryService)
export const getAdditionalCategoryById = AdditionalCategoryService.getAdditionalCategoryById.bind(AdditionalCategoryService)
export const saveAdditionalCategory = AdditionalCategoryService.saveAdditionalCategory.bind(AdditionalCategoryService)
export const deleteAdditionalCategory = AdditionalCategoryService.deleteAdditionalCategory.bind(AdditionalCategoryService)

export const getAllSlides = CarouselService.getAllSlides
export const getActiveSlides = CarouselService.getActiveSlides
export const getSlideById = CarouselService.getSlideById
export const saveSlide = CarouselService.saveSlide
export const deleteSlide = CarouselService.deleteSlide
export const getAllCarouselSlides = CarouselService.getAllSlides // Adicionar esta exportação como alias
export const deleteCarouselSlide = CarouselService.deleteSlide // Adicionar esta exportação como alias
export const saveCarouselSlide = CarouselService.saveSlide // Adicionar esta exportação como alias

export const getAllPhrases = PhraseService.getAllPhrases
export const getActivePhrases = PhraseService.getActivePhrases
export const getPhraseById = PhraseService.getPhraseById
export const savePhrase = PhraseService.savePhrase
export const deletePhrase = PhraseService.deletePhrase

export const getStoreConfig = StoreConfigService.getStoreConfig.bind(StoreConfigService)
export const saveStoreConfig = StoreConfigService.saveStoreConfig.bind(StoreConfigService)

// Exportar funções do OrderService
export const getAllOrders = OrderService.getAllOrders
export const getOrderById = OrderService.getOrderById
// @ts-ignore
export const createOrder = OrderService.createOrder
export const updateOrderStatus = OrderService.updateOrderStatus
export const markOrderAsPrinted = OrderService.markOrderAsPrinted
export const markOrderAsNotified = OrderService.markOrderAsNotified || (() => Promise.resolve(false))
// @ts-ignore
export const updateOrder = OrderService.updateOrder || (() => Promise.resolve(false))

export const getAllPageContents = PageContentService.getAllPageContents
export const getPageContent = PageContentService.getPageContent
export const getPageContentBySlug = PageContentService.getPageContentBySlug
export const savePageContent = PageContentService.savePageContent
export const initializeDefaultPageContent = PageContentService.initializeDefaultPageContent // Adicionando esta exportação que estava faltando

export const getAllNotifications = NotificationService.getAllNotifications.bind(NotificationService)
export const getActiveNotifications = NotificationService.getActiveNotifications.bind(NotificationService)
export const saveNotification = NotificationService.saveNotification.bind(NotificationService)
export const deleteNotification = NotificationService.deleteNotification.bind(NotificationService)
export const markAsRead = NotificationService.markAsRead.bind(NotificationService)
export const markNotificationAsRead = NotificationService.markAsRead.bind(NotificationService) // Alias para compatibilidade
