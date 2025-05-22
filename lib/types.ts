// Tipos para o sistema de açaí online

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
  hasAdditionals?: boolean
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
  quantity?: number // Quantidade no carrinho
  hasPricing?: boolean // Indica se o adicional tem preço ou é gratuito
}

// Item do carrinho
export interface CartItem {
  id: number
  productId: number
  name: string
  price: number // Preço base do produto (sem adicionais)
  quantity: number
  image?: string
  size: string
  originalSize?: string // Campo opcional para armazenar o tamanho original com identificador
  originalPrice?: number // Preço total incluindo adicionais (se houver)
  additionals?: Additional[]
  categoryName?: string // Nome da categoria do produto
}

// Adicional no carrinho
export interface CartAdditional {
  id: number
  name: string
  price: number
  quantity?: number // Adicionado campo de quantidade para adicionais
}

// Slide do carrossel
export interface CarouselSlide {
  id: number
  image: string
  title: string
  subtitle: string
  order: number
  active: boolean
}

// Frase
export interface Phrase {
  id: number
  text: string
  order: number
  active: boolean
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
  whatsappNumber?: string
  pixKey?: string
  lastUpdated?: string
  carousel_initialized?: boolean
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

// Status do pedido
export type OrderStatus = 'new' | 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'completed' | 'cancelled' | 'canceled';

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
  status: OrderStatus
  date: Date
  printed: boolean
  notified: boolean
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
  createdAt?: Date
}
