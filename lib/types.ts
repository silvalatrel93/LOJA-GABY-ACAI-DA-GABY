// Tipos para o sistema de açaí online multi-tenant

// Loja (Store)
export interface Store {
  id: string
  name: string
  slug: string
  domain?: string
  logoUrl?: string
  themeColor: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  ownerId: string
  customDomain?: string
  usage?: {
    products: number
    orders: number
  }
}

// Produto
export interface Product {
  id: number
  name: string
  description: string
  image: string
  sizes: ProductSize[]
  categoryId: number
  categoryName?: string
  active: boolean
  allowedAdditionals: number[]
  storeId: string
}

// Tamanho do produto
export interface ProductSize {
  size: string
  price: number
}

// Categoria
export interface Category {
  id: number
  name: string
  order: number
  active: boolean
  storeId: string
}

// Adicional
export interface Additional {
  id: number
  name: string
  price: number
  categoryId: number
  categoryName?: string
  active: boolean
  image?: string
  storeId: string
}

// Item do carrinho
export interface CartItem {
  id: number
  productId: number
  name: string
  price: number
  quantity: number
  image?: string
  size: string
  originalSize?: string
  additionals?: Additional[]
  storeId: string
}

// Adicional no carrinho
export interface CartAdditional {
  id: number
  name: string
  price: number
  quantity?: number
}

// Slide do carrossel
export interface CarouselSlide {
  id: number
  image: string
  title: string
  subtitle: string
  order: number
  active: boolean
  storeId: string
}

// Frase
export interface Phrase {
  id: number
  text: string
  order: number
  active: boolean
  storeId: string
}

// Configuração da loja
export interface StoreConfig {
  id: string
  name: string
  logoUrl: string
  deliveryFee: number
  isOpen: boolean
  operatingHours: OperatingHours
  specialDates: SpecialDate[]
  storeId: string
}

// Horário de funcionamento
export interface OperatingHours {
  [day: string]: {
    open: boolean
    hours: string
  }
}

// Data especial
export interface SpecialDate {
  date: string
  open: boolean
  hours?: string
  description: string
}

// Pedido
export interface Order {
  id: number
  customerName: string
  customerPhone: string
  address: Address
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  paymentMethod: string
  status: string
  date: Date
  printed: boolean
  storeId: string
}

// Endereço
export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode?: string
  reference?: string
}

// Item do pedido
export interface OrderItem {
  productId: number
  name: string
  price: number
  quantity: number
  size: string
  additionals?: CartAdditional[]
}

// Conteúdo da página
export interface PageContent {
  id: string
  title: string
  content: string
  lastUpdated: Date
  storeId: string
}

// Notificação
export interface Notification {
  id: number
  title: string
  message: string
  type: string
  active: boolean
  startDate: Date
  endDate: Date
  priority: number
  read: boolean
  storeId: string
}

// Usuário
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

// Plano de assinatura
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  maxProducts: number
  maxOrders: number
  customDomain: boolean
  advancedAnalytics: boolean
}

// Assinatura
export interface Subscription {
  id: string
  userId: string
  planId: string
  status: "active" | "canceled" | "past_due" | "trialing"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  billingCycle: "monthly" | "yearly"
  features: string[]
  limits: {
    stores: number
    products: number
    orders: number
    customDomain: boolean
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
