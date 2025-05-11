import { openDB, type DBSchema } from "idb"
import { initializePersistenceManager, shouldUseSupabase } from "@/lib/persistence-manager"
import * as supabaseDB from "@/lib/db-supabase"

// Inicializar o gerenciador de persistência
initializePersistenceManager().catch(console.error)

// Nome do banco de dados
const DB_NAME = "acai_delivery"

// Variável para armazenar a promessa do banco de dados
let dbPromise: Promise<IDBDatabase<CartDB>> | null = null

// Interfaces
export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  size: string
  additionals?: { id: number; name: string; price: number; quantity: number }[]
}

export interface Product {
  id: number
  name: string
  description: string
  image: string
  sizes: { size: string; price: number }[]
  categoryId: number
  active?: boolean
  allowedAdditionals?: number[]
}

export interface Order {
  id?: number
  customerName: string
  customerPhone: string
  address: {
    street: string
    number: string
    neighborhood: string
    complement?: string
  }
  items: {
    id: number
    name: string
    size: string
    price: number
    quantity: number
    additionals?: { id: number; name: string; price: number; quantity: number }[]
  }[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: "card" | "pix"
  status: "new" | "preparing" | "delivering" | "completed" | "cancelled"
  date: Date
  printed: boolean
}

export interface CarouselSlide {
  id: number
  image: string
  title: string
  subtitle: string
  order: number
  active: boolean
}

export interface Category {
  id: number
  name: string
  order: number
  active: boolean
}

export interface Additional {
  id: number
  name: string
  price: number
  categoryId: number
  active: boolean
  image?: string
}

export interface Phrase {
  id: number
  text: string
  order: number
  active: boolean
}

export interface StoreConfig {
  id: string
  name: string
  logoUrl: string
  deliveryFee: number
  isOpen: boolean
  operatingHours: {
    monday: { open: boolean; hours: string }
    tuesday: { open: boolean; hours: string }
    wednesday: { open: boolean; hours: string }
    thursday: { open: boolean; hours: string }
    friday: { open: boolean; hours: string }
    saturday: { open: boolean; hours: string }
    sunday: { open: boolean; hours: string }
  }
  specialDates: {
    date: string
    isOpen: boolean
    note: string
  }[]
  lastUpdated: Date
}

export interface PageContent {
  id: string
  title: string
  content: string
  lastUpdated: Date
}

export interface Notification {
  id: number
  title: string
  message: string
  type: "info" | "warning" | "alert" | "success"
  active: boolean
  startDate: Date
  endDate: Date
  priority: number
  read: boolean
  createdAt: Date
}

const DB_VERSION = 7

const STORES = {
  cart: "cart",
  products: "products",
  orders: "orders",
  carousel: "carousel",
  categories: "categories",
  additionals: "additionals",
  phrases: "phrases",
  storeConfig: "storeConfig",
  pageContent: "pageContent",
  notifications: "notifications",
}

// Função para verificar se a migração para o Supabase foi concluída
export function isSupabaseMigrationCompleted(): boolean {
  return shouldUseSupabase()
}

async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<CartDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORES.cart)) {
          db.createObjectStore(STORES.cart, {
            keyPath: ["id", "size"],
          })
        }

        if (!db.objectStoreNames.contains(STORES.products)) {
          db.createObjectStore(STORES.products, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.orders)) {
          db.createObjectStore(STORES.orders, {
            keyPath: "id",
            autoIncrement: true,
          })
        }

        if (!db.objectStoreNames.contains(STORES.carousel)) {
          db.createObjectStore(STORES.carousel, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.categories)) {
          db.createObjectStore(STORES.categories, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.additionals)) {
          db.createObjectStore(STORES.additionals, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.phrases)) {
          db.createObjectStore(STORES.phrases, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.storeConfig)) {
          db.createObjectStore(STORES.storeConfig, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.pageContent)) {
          db.createObjectStore(STORES.pageContent, {
            keyPath: "id",
          })
        }

        if (!db.objectStoreNames.contains(STORES.notifications)) {
          db.createObjectStore(STORES.notifications, {
            keyPath: "id",
            autoIncrement: true,
          })
        }
      },
      blocked() {
        console.warn("Banco de dados bloqueado por outra conexão")
      },
      blocking() {
        console.warn("Esta conexão está bloqueando uma atualização do banco de dados")
      },
      terminated() {
        console.error("Conexão com o banco de dados encerrada inesperadamente")
        dbPromise = null
      },
    })
  }

  return dbPromise
}

interface CartDB extends DBSchema {
  cart: {
    key: [number, string]
    value: CartItem
  }
  products: {
    key: number
    value: Product
  }
  orders: {
    key: number
    value: Order
  }
  carousel: {
    key: number
    value: CarouselSlide
  }
  categories: {
    key: number
    value: Category
  }
  additionals: {
    key: number
    value: Additional
  }
  phrases: {
    key: number
    value: Phrase
  }
  storeConfig: {
    key: string
    value: StoreConfig
  }
  pageContent: {
    key: string
    value: PageContent
  }
  notifications: {
    key: number
    value: Notification
  }
}

// Funções para Carrinho (sempre usam IndexedDB por enquanto)
export async function getCart(): Promise<CartItem[]> {
  // Por enquanto, o carrinho sempre usa IndexedDB
  const db = await initDB()
  return await db.getAll(STORES.cart)
}

export async function addToCart(item: CartItem): Promise<void> {
  // Por enquanto, o carrinho sempre usa IndexedDB
  const db = await initDB()
  await db.put(STORES.cart, item)
}

export async function removeFromCart(id: number, size: string): Promise<void> {
  // Por enquanto, o carrinho sempre usa IndexedDB
  const db = await initDB()
  await db.delete(STORES.cart, [id, size])
}

export async function updateCartItemQuantity(id: number, size: string, quantity: number): Promise<void> {
  // Por enquanto, o carrinho sempre usa IndexedDB
  const db = await initDB()
  const item = await db.get(STORES.cart, [id, size])
  if (item) {
    item.quantity = quantity
    await db.put(STORES.cart, item)
  }
}

export async function clearCart(): Promise<void> {
  // Por enquanto, o carrinho sempre usa IndexedDB
  const db = await initDB()
  await db.clear(STORES.cart)
}

// Funções para Produtos
export async function getAllProducts(): Promise<Product[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllProductsFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.products)
}

export async function initializeDefaultProducts(products: Product[]): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Inicializar produtos no Supabase
    for (const product of products) {
      await supabaseDB.saveProductToSupabase(product)
    }
    return
  }

  const db = await initDB()
  const tx = db.transaction(STORES.products, "readwrite")
  for (const product of products) {
    await tx.store.put(product)
  }
  await tx.done
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getProductsByCategoryFromSupabase(categoryId)
  }

  const db = await initDB()
  const products = await db.getAll(STORES.products)
  return products.filter((product) => product.categoryId === categoryId)
}

export async function saveProduct(product: Product): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveProductToSupabase(product)
    return
  }

  const db = await initDB()
  await db.put(STORES.products, product)
}

export async function deleteProduct(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deleteProductFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.products, id)
}

// Funções para Pedidos
export async function saveOrder(order: Order): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveOrderToSupabase(order)
    return
  }

  const db = await initDB()
  await db.put(STORES.orders, order)
}

export async function getAllOrders(): Promise<Order[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllOrdersFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.orders)
}

export async function markOrderAsPrinted(orderId: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.markOrderAsPrintedInSupabase(orderId)
    return
  }

  const db = await initDB()
  const order = await db.get(STORES.orders, orderId)
  if (order) {
    order.printed = true
    await db.put(STORES.orders, order)
  }
}

export async function updateOrderStatus(orderId: number, status: Order["status"]): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.updateOrderStatusInSupabase(orderId, status)
    return
  }

  const db = await initDB()
  const order = await db.get(STORES.orders, orderId)
  if (order) {
    order.status = status
    await db.put(STORES.orders, order)
  }
}

// Funções para Carrossel
export async function getAllCarouselSlides(): Promise<CarouselSlide[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllCarouselSlidesFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.carousel)
}

export async function getActiveCarouselSlides(): Promise<CarouselSlide[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getActiveCarouselSlidesFromSupabase()
  }

  const db = await initDB()
  const slides = await db.getAll(STORES.carousel)
  return slides.filter((slide) => slide.active).sort((a, b) => a.order - b.order)
}

export async function initializeDefaultCarouselSlides(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Implementar inicialização no Supabase se necessário
    return
  }

  const db = await initDB()
  const tx = db.transaction(STORES.carousel, "readwrite")

  const defaultSlides = [
    {
      id: 1,
      image: "/placeholder.svg?key=qip7s",
      title: "Açaí Delícia",
      subtitle: "O melhor açaí da região, agora no seu celular!",
      order: 1,
      active: true,
    },
    {
      id: 2,
      image: "/placeholder.svg?key=j4f9z",
      title: "Promoção da Semana",
      subtitle: "Açaí de 500ml com 2 adicionais por apenas R$25,90",
      order: 2,
      active: true,
    },
    {
      id: 3,
      image: "/placeholder.svg?key=r7x2a",
      title: "Novo Açaí Vegano",
      subtitle: "Aproveite nossa nova opção de açaí sem lactose",
      order: 3,
      active: true,
    },
  ]

  for (const slide of defaultSlides) {
    await tx.store.put(slide)
  }

  await tx.done
}

export async function saveCarouselSlide(slide: CarouselSlide): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveCarouselSlideToSupabase(slide)
    return
  }

  const db = await initDB()
  await db.put(STORES.carousel, slide)
}

export async function deleteCarouselSlide(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deleteCarouselSlideFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.carousel, id)
}

// Funções para Categorias
export async function getAllCategories(): Promise<Category[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllCategoriesFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.categories)
}

export async function getActiveCategories(): Promise<Category[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getActiveCategoriesFromSupabase()
  }

  const db = await initDB()
  const categories = await db.getAll(STORES.categories)
  return categories.filter((category) => category.active).sort((a, b) => a.order - b.order)
}

export async function initializeDefaultCategories(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Implementar inicialização no Supabase se necessário
    return
  }

  const db = await initDB()
  const tx = db.transaction(STORES.categories, "readwrite")

  const defaultCategories = [
    { id: 1, name: "Tradicional", order: 1, active: true },
    { id: 2, name: "Especial", order: 2, active: true },
  ]

  for (const category of defaultCategories) {
    await tx.store.put(category)
  }

  await tx.done
}

export async function saveCategory(category: Category): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveCategoryToSupabase(category)
    return
  }

  const db = await initDB()
  await db.put(STORES.categories, category)
}

export async function deleteCategory(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deleteCategoryFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.categories, id)
}

// Funções para Adicionais
export async function getAllAdditionals(): Promise<Additional[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllAdditionalsFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.additionals)
}

export async function getActiveAdditionals(): Promise<Additional[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getActiveAdditionalsFromSupabase()
  }

  const db = await initDB()
  const additionals = await db.getAll(STORES.additionals)
  return additionals.filter((additional) => additional.active)
}

export async function initializeDefaultAdditionals(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Implementar inicialização no Supabase se necessário
    return
  }

  const db = await initDB()
  const tx = db.transaction(STORES.additionals, "readwrite")

  const defaultAdditionals = [
    { id: 1, name: "Leite Condensado", price: 2.0, categoryId: 5, active: true },
    { id: 2, name: "Granola", price: 1.5, categoryId: 5, active: true },
    { id: 3, name: "Morango", price: 3.0, categoryId: 5, active: true },
    { id: 4, name: "Banana", price: 2.5, categoryId: 5, active: true },
  ]

  for (const additional of defaultAdditionals) {
    await tx.store.put(additional)
  }

  await tx.done
}

export async function saveAdditional(additional: Additional): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveAdditionalToSupabase(additional)
    return
  }

  const db = await initDB()
  await db.put(STORES.additionals, additional)
}

export async function deleteAdditional(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deleteAdditionalFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.additionals, id)
}

// Funções para Frases
export async function getAllPhrases(): Promise<Phrase[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllPhrasesFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.phrases)
}

export async function getActivePhrases(): Promise<Phrase[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getActivePhrasesFromSupabase()
  }

  const db = await initDB()
  const phrases = await db.getAll(STORES.phrases)
  return phrases.filter((phrase) => phrase.active).sort((a, b) => a.order - b.order)
}

export async function initializeDefaultPhrases(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Implementar inicialização no Supabase se necessário
    return
  }

  const db = await initDB()
  const tx = db.transaction(STORES.phrases, "readwrite")

  const defaultPhrases = [
    { id: 1, text: "O melhor açaí da cidade! 🍇", order: 1, active: true },
    { id: 2, text: "Experimente nossos adicionais exclusivos! ✨", order: 2, active: true },
    { id: 3, text: "Entrega rápida para toda a região! 🚚", order: 3, active: true },
  ]

  for (const phrase of defaultPhrases) {
    await tx.store.put(phrase)
  }

  await tx.done
}

export async function savePhrase(phrase: Phrase): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.savePhraseToSupabase(phrase)
    return
  }

  const db = await initDB()
  await db.put(STORES.phrases, phrase)
}

export async function deletePhrase(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deletePhraseFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.phrases, id)
}

// Funções para Configuração da Loja
export async function getStoreConfig(): Promise<StoreConfig> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getStoreConfigFromSupabase()
  }

  const db = await initDB()
  let config = await db.get(STORES.storeConfig, "main")
  if (!config) {
    // Se não existir, cria uma configuração padrão
    config = {
      id: "main",
      name: "Açaí Delícia",
      logoUrl: "/placeholder.svg?key=logo&text=Açaí+Delícia",
      deliveryFee: 5.0, // Valor padrão da taxa de entrega
      isOpen: true, // Loja aberta por padrão
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
      lastUpdated: new Date(),
    }
    await saveStoreConfig(config)
  }

  // Garantir que os campos existam mesmo em configurações antigas
  if (config.deliveryFee === undefined) {
    config.deliveryFee = 5.0
  }

  if (config.isOpen === undefined) {
    config.isOpen = true
  }

  if (!config.operatingHours) {
    config.operatingHours = {
      monday: { open: true, hours: "10:00 - 22:00" },
      tuesday: { open: true, hours: "10:00 - 22:00" },
      wednesday: { open: true, hours: "10:00 - 22:00" },
      thursday: { open: true, hours: "10:00 - 22:00" },
      friday: { open: true, hours: "10:00 - 22:00" },
      saturday: { open: true, hours: "10:00 - 22:00" },
      sunday: { open: true, hours: "10:00 - 22:00" },
    }
  }

  if (!config.specialDates) {
    config.specialDates = []
  }

  await saveStoreConfig(config)
  return config
}

export async function saveStoreConfig(config: StoreConfig): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveStoreConfigToSupabase(config)
    return
  }

  const db = await initDB()
  config.lastUpdated = new Date()
  await db.put(STORES.storeConfig, config)
}

// Funções para Conteúdo das Páginas
export async function getPageContent(id: string): Promise<PageContent | null> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getPageContentFromSupabase(id)
  }

  const db = await initDB()
  return await db.get(STORES.pageContent, id)
}

export async function savePageContent(pageContent: PageContent): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.savePageContentToSupabase(pageContent)
    return
  }

  const db = await initDB()
  pageContent.lastUpdated = new Date()
  await db.put(STORES.pageContent, pageContent)
}

// Adicionar função para inicializar o conteúdo padrão das páginas
export async function initializeDefaultPageContent(): Promise<void> {
  try {
    if (isSupabaseMigrationCompleted()) {
      // Verificar se já existem conteúdos de página no Supabase
      const sobreContent = await supabaseDB.getPageContentFromSupabase("sobre")
      const deliveryContent = await supabaseDB.getPageContentFromSupabase("delivery")

      // Só adicionar conteúdo padrão se não existir
      if (!sobreContent) {
        const defaultSobreContent: PageContent = {
          id: "sobre",
          title: "Sobre Nós",
          content: `<p class="text-gray-700 mb-4">
            Somos especializados em açaí de alta qualidade, com ingredientes frescos e selecionados. Nossa missão é levar
            até você o melhor açaí com praticidade e rapidez.
          </p>

          <p class="text-gray-700 mb-4">
            Fundada em 2020, a Açaí Delícia nasceu da paixão por oferecer produtos saudáveis e saborosos. Utilizamos
            apenas frutas frescas e açaí de origem sustentável da Amazônia.
          </p>

          <p class="text-gray-700 mb-4">
            Nossa equipe é formada por profissionais apaixonados por gastronomia e dedicados a proporcionar a melhor
            experiência aos nossos clientes.
          </p>

          <h2 class="text-xl font-semibold text-purple-900 mt-6 mb-3">Nossos Valores</h2>

          <ul class="list-disc pl-5 text-gray-700 space-y-2">
            <li>Qualidade em primeiro lugar</li>
            <li>Compromisso com a satisfação do cliente</li>
            <li>Sustentabilidade e responsabilidade ambiental</li>
            <li>Inovação constante em nossos produtos</li>
          </ul>`,
          lastUpdated: new Date(),
        }

        await supabaseDB.savePageContentToSupabase(defaultSobreContent)
      }

      if (!deliveryContent) {
        const defaultDeliveryContent: PageContent = {
          id: "delivery",
          title: "Delivery",
          content: `<h2 class="text-xl font-semibold text-purple-900 mb-4">Informações de Entrega</h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-medium text-purple-800">Horário de Funcionamento</h3>
              <p class="text-gray-700">Segunda a Domingo: 10h às 22h</p>
            </div>

            <div>
              <h3 class="font-medium text-purple-800">Área de Entrega</h3>
              <p class="text-gray-700">Entregamos em toda a cidade. Taxa de entrega fixa de R$ 5,00.</p>
            </div>

            <div>
              <h3 class="font-medium text-purple-800">Tempo Médio</h3>
              <p class="text-gray-700">
                Nosso tempo médio de entrega é de 30 minutos, dependendo da sua localização.
              </p>
            </div>

            <div>
              <h3 class="font-medium text-purple-800">Formas de Pagamento</h3>
              <p class="text-gray-700">Aceitamos PIX e cartão na entrega.</p>
            </div>
          </div>

          <div class="mt-8 p-4 bg-purple-50 rounded-lg">
            <h3 class="font-semibold text-purple-900 mb-2">Pedido Mínimo</h3>
            <p class="text-gray-700">Não há valor mínimo para pedidos. Aproveite!</p>
          </div>

          <div class="mt-6">
            <p class="text-gray-700">
              Para mais informações ou dúvidas sobre entregas, entre em contato pelo WhatsApp: (11) 99999-9999
            </p>
          </div>`,
          lastUpdated: new Date(),
        }

        await supabaseDB.savePageContentToSupabase(defaultDeliveryContent)
      }

      return
    }

    const db = await initDB()

    // Verificar se já existem conteúdos de página
    const sobreContent = await db.get(STORES.pageContent, "sobre")
    const deliveryContent = await db.get(STORES.pageContent, "delivery")

    // Só adicionar conteúdo padrão se não existir
    if (!sobreContent) {
      const defaultSobreContent: PageContent = {
        id: "sobre",
        title: "Sobre Nós",
        content: `<p class="text-gray-700 mb-4">
          Somos especializados em açaí de alta qualidade, com ingredientes frescos e selecionados. Nossa missão é levar
          até você o melhor açaí com praticidade e rapidez.
        </p>

        <p class="text-gray-700 mb-4">
          Fundada em 2020, a Açaí Delícia nasceu da paixão por oferecer produtos saudáveis e saborosos. Utilizamos
          apenas frutas frescas e açaí de origem sustentável da Amazônia.
        </p>

        <p class="text-gray-700 mb-4">
          Nossa equipe é formada por profissionais apaixonados por gastronomia e dedicados a proporcionar a melhor
          experiência aos nossos clientes.
        </p>

        <h2 class="text-xl font-semibold text-purple-900 mt-6 mb-3">Nossos Valores</h2>

        <ul class="list-disc pl-5 text-gray-700 space-y-2">
          <li>Qualidade em primeiro lugar</li>
          <li>Compromisso com a satisfação do cliente</li>
          <li>Sustentabilidade e responsabilidade ambiental</li>
          <li>Inovação constante em nossos produtos</li>
        </ul>`,
        lastUpdated: new Date(),
      }

      await db.put(STORES.pageContent, defaultSobreContent)
      console.log("Conteúdo padrão da página 'Sobre Nós' inicializado com sucesso")
    }

    if (!deliveryContent) {
      const defaultDeliveryContent: PageContent = {
        id: "delivery",
        title: "Delivery",
        content: `<h2 class="text-xl font-semibold text-purple-900 mb-4">Informações de Entrega</h2>

        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-purple-800">Horário de Funcionamento</h3>
            <p class="text-gray-700">Segunda a Domingo: 10h às 22h</p>
          </div>

          <div>
            <h3 class="font-medium text-purple-800">Área de Entrega</h3>
            <p class="text-gray-700">Entregamos em toda a cidade. Taxa de entrega fixa de R$ 5,00.</p>
          </div>

          <div>
            <h3 class="font-medium text-purple-800">Tempo Médio</h3>
            <p class="text-gray-700">
              Nosso tempo médio de entrega é de 30 minutos, dependendo da sua localização.
            </p>
          </div>

          <div>
            <h3 class="font-medium text-purple-800">Formas de Pagamento</h3>
            <p class="text-gray-700">Aceitamos PIX e cartão na entrega.</p>
          </div>
        </div>

        <div class="mt-8 p-4 bg-purple-50 rounded-lg">
          <h3 class="font-semibold text-purple-900 mb-2">Pedido Mínimo</h3>
          <p class="text-gray-700">Não há valor mínimo para pedidos. Aproveite!</p>
        </div>

        <div class="mt-6">
          <p class="text-gray-700">
            Para mais informações ou dúvidas sobre entregas, entre em contato pelo WhatsApp: (11) 99999-9999
          </p>
        </div>`,
        lastUpdated: new Date(),
      }

      await db.put(STORES.pageContent, defaultDeliveryContent)
      console.log("Conteúdo padrão da página 'Delivery' inicializado com sucesso")
    }
  } catch (error) {
    console.error("Erro ao inicializar conteúdo padrão das páginas:", error)
    throw error
  }
}

// Funções para Notificações
export async function getAllNotifications(): Promise<Notification[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getAllNotificationsFromSupabase()
  }

  const db = await initDB()
  return await db.getAll(STORES.notifications)
}

export async function getActiveNotifications(): Promise<Notification[]> {
  if (isSupabaseMigrationCompleted()) {
    return await supabaseDB.getActiveNotificationsFromSupabase()
  }

  const db = await initDB()
  const notifications = await db.getAll(STORES.notifications)
  const now = new Date()

  return notifications
    .filter((notification) => notification.active && notification.startDate <= now && notification.endDate >= now)
    .sort((a, b) => b.priority - a.priority || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getUnreadNotificationsCount(): Promise<number> {
  if (isSupabaseMigrationCompleted()) {
    const notifications = await supabaseDB.getActiveNotificationsFromSupabase()
    return notifications.filter((notification) => !notification.read).length
  }

  const db = await initDB()
  const notifications = await getActiveNotifications()
  return notifications.filter((notification) => !notification.read).length
}

export async function saveNotification(notification: Notification): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.saveNotificationToSupabase(notification)
    return
  }

  const db = await initDB()

  // Se não tiver ID, é uma nova notificação
  if (!notification.id) {
    notification.createdAt = new Date()
  }

  await db.put(STORES.notifications, notification)
}

export async function deleteNotification(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.deleteNotificationFromSupabase(id)
    return
  }

  const db = await initDB()
  await db.delete(STORES.notifications, id)
}

export async function markNotificationAsRead(id: number): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.markNotificationAsReadInSupabase(id)
    return
  }

  const db = await initDB()
  const notification = await db.get(STORES.notifications, id)
  if (notification) {
    notification.read = true
    await db.put(STORES.notifications, notification)
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    await supabaseDB.markAllNotificationsAsReadInSupabase()
    return
  }

  const db = await initDB()
  const notifications = await getActiveNotifications()
  const tx = db.transaction(STORES.notifications, "readwrite")

  for (const notification of notifications) {
    if (!notification.read) {
      notification.read = true
      await tx.store.put(notification)
    }
  }

  await tx.done
}

export async function initializeDefaultNotifications(): Promise<void> {
  if (isSupabaseMigrationCompleted()) {
    // Implementar inicialização no Supabase se necessário
    return
  }

  const db = await initDB()
  const notifications = await db.getAll(STORES.notifications)

  // Só adicionar notificações padrão se não existirem outras
  if (notifications.length === 0) {
    const now = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(now.getDate() + 7)

    const defaultNotifications: Notification[] = [
      {
        id: 1,
        title: "Bem-vindo ao Sistema de Notificações",
        message:
          "Agora você pode receber avisos importantes sobre a loja, como feriados, promoções e atualizações do sistema.",
        type: "info",
        active: true,
        startDate: now,
        endDate: oneWeekLater,
        priority: 3,
        read: false,
        createdAt: now,
      },
    ]

    const tx = db.transaction(STORES.notifications, "readwrite")
    for (const notification of defaultNotifications) {
      await tx.store.put(notification)
    }
    await tx.done
  }
}

// Funções para Backup e Restauração
export async function backupData(): Promise<void> {
  try {
    const data = await exportAllData()
    const dataStr = JSON.stringify(data)
    localStorage.setItem("acai_backup", dataStr)
    localStorage.setItem("acai_backup_date", new Date().toISOString())
  } catch (error) {
    console.error("Erro ao fazer backup:", error)
    throw error
  }
}

export async function restoreFromBackup(): Promise<boolean> {
  const backupStr = localStorage.getItem("acai_backup")
  if (!backupStr) {
    return false
  }

  try {
    const data = JSON.parse(backupStr)
    await importData(data)
    return true
  } catch (error) {
    console.error("Erro ao restaurar backup:", error)
    throw error
  }
}

export async function exportAllData(): Promise<{
  products: Product[]
  orders: Order[]
  carousel: CarouselSlide[]
  categories: Category[]
  additionals: Additional[]
  phrases: Phrase[]
  storeConfig: StoreConfig | null
  pageContent: PageContent[]
  notifications: Notification[]
}> {
  try {
    if (isSupabaseMigrationCompleted()) {
      // Exportar dados do Supabase
      const products = await supabaseDB.getAllProductsFromSupabase()
      const orders = await supabaseDB.getAllOrdersFromSupabase()
      const carousel = await supabaseDB.getAllCarouselSlidesFromSupabase()
      const categories = await supabaseDB.getAllCategoriesFromSupabase()
      const additionals = await supabaseDB.getAllAdditionalsFromSupabase()
      const phrases = await supabaseDB.getAllPhrasesFromSupabase()
      const storeConfig = await supabaseDB.getStoreConfigFromSupabase()

      // Para o conteúdo das páginas, precisamos buscar cada página individualmente
      const sobreContent = await supabaseDB.getPageContentFromSupabase("sobre")
      const deliveryContent = await supabaseDB.getPageContentFromSupabase("delivery")
      const pageContent: PageContent[] = []
      if (sobreContent) pageContent.push(sobreContent)
      if (deliveryContent) pageContent.push(deliveryContent)

      const notifications = await supabaseDB.getAllNotificationsFromSupabase()

      return {
        products,
        orders,
        carousel,
        categories,
        additionals,
        phrases,
        storeConfig,
        pageContent,
        notifications,
      }
    }

    const db = await initDB()
    const products = await db.getAll(STORES.products)
    const orders = await db.getAll(STORES.orders)
    const carousel = await db.getAll(STORES.carousel)
    const categories = await db.getAll(STORES.categories)
    const additionals = await db.getAll(STORES.additionals)
    const phrases = await db.getAll(STORES.phrases)
    const storeConfig = await db.get(STORES.storeConfig, "main")
    const pageContent = await db.getAll(STORES.pageContent)
    const notifications = await db.getAll(STORES.notifications)

    return {
      products,
      orders,
      carousel,
      categories,
      additionals,
      phrases,
      storeConfig,
      pageContent,
      notifications,
    }
  } catch (error) {
    console.error("Erro ao exportar dados:", error)
    throw error
  }
}

export async function importData(data: {
  products?: Product[]
  orders?: Order[]
  carousel?: CarouselSlide[]
  categories?: Category[]
  additionals?: Additional[]
  phrases?: Phrase[]
  storeConfig?: StoreConfig
  pageContent?: PageContent[]
  notifications?: Notification[]
}): Promise<void> {
  try {
    if (isSupabaseMigrationCompleted()) {
      // Importar dados para o Supabase
      if (data.pageContent && data.pageContent.length > 0) {
        for (const content of data.pageContent) {
          await supabaseDB.savePageContentToSupabase(content)
        }
      }

      if (data.storeConfig) {
        await supabaseDB.saveStoreConfigToSupabase(data.storeConfig)
      }

      if (data.categories && data.categories.length > 0) {
        for (const category of data.categories) {
          await supabaseDB.saveCategoryToSupabase(category)
        }
      }

      if (data.additionals && data.additionals.length > 0) {
        for (const additional of data.additionals) {
          await supabaseDB.saveAdditionalToSupabase(additional)
        }
      }

      if (data.phrases && data.phrases.length > 0) {
        for (const phrase of data.phrases) {
          await supabaseDB.savePhraseToSupabase(phrase)
        }
      }

      if (data.products && data.products.length > 0) {
        for (const product of data.products) {
          await supabaseDB.saveProductToSupabase(product)
        }
      }

      if (data.orders && data.orders.length > 0) {
        for (const order of data.orders) {
          await supabaseDB.saveOrderToSupabase(order)
        }
      }

      if (data.carousel && data.carousel.length > 0) {
        for (const slide of data.carousel) {
          await supabaseDB.saveCarouselSlideToSupabase(slide)
        }
      }

      if (data.notifications && data.notifications.length > 0) {
        for (const notification of data.notifications) {
          await supabaseDB.saveNotificationToSupabase(notification)
        }
      }

      return
    }

    const db = await initDB()

    if (data.pageContent && data.pageContent.length > 0) {
      const tx = db.transaction(STORES.pageContent, "readwrite")
      const store = tx.objectStore(STORES.pageContent)

      await store.clear()

      for (const content of data.pageContent) {
        await store.put(content)
      }

      await tx.done
    }

    if (data.storeConfig) {
      const tx = db.transaction(STORES.storeConfig, "readwrite")
      const store = tx.objectStore(STORES.storeConfig)
      await store.put(data.storeConfig)
      await tx.done
    }

    if (data.categories && data.categories.length > 0) {
      const tx = db.transaction(STORES.categories, "readwrite")
      const store = tx.objectStore(STORES.categories)

      await store.clear()

      for (const category of data.categories) {
        await store.put(category)
      }

      await tx.done
    }

    if (data.additionals && data.additionals.length > 0) {
      const tx = db.transaction(STORES.additionals, "readwrite")
      const store = tx.objectStore(STORES.additionals)

      await store.clear()

      for (const additional of data.additionals) {
        await store.put(additional)
      }

      await tx.done
    }

    if (data.phrases && data.phrases.length > 0) {
      const tx = db.transaction(STORES.phrases, "readwrite")
      const store = tx.objectStore(STORES.phrases)

      await store.clear()

      for (const phrase of data.phrases) {
        await store.put(phrase)
      }

      await tx.done
    }

    if (data.products && data.products.length > 0) {
      const tx = db.transaction(STORES.products, "readwrite")
      const store = tx.objectStore(STORES.products)

      await store.clear()

      for (const product of data.products) {
        await store.put(product)
      }

      await tx.done
    }

    if (data.orders && data.orders.length > 0) {
      const tx = db.transaction(STORES.orders, "readwrite")
      const store = tx.objectStore(STORES.orders)

      await store.clear()

      for (const order of data.orders) {
        await store.put(order)
      }

      await tx.done
    }

    if (data.carousel && data.carousel.length > 0) {
      const tx = db.transaction(STORES.carousel, "readwrite")
      const store = tx.objectStore(STORES.carousel)

      await store.clear()

      for (const slide of data.carousel) {
        await store.put(slide)
      }

      await tx.done
    }

    if (data.notifications && data.notifications.length > 0) {
      const tx = db.transaction(STORES.notifications, "readwrite")
      const store = tx.objectStore(STORES.notifications)

      await store.clear()

      for (const notification of data.notifications) {
        await store.put(notification)
      }

      await tx.done
    }
  } catch (error) {
    console.error("Erro ao importar dados:", error)
    throw error
  }
}
