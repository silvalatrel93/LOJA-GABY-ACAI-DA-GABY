import { createSupabaseClient } from "./supabase-client"
import type { Product, Category, Additional, Order, CarouselSlide, Phrase, OrderStatus, StoreConfig, PageContent, Notification } from "./types"

// Configurações de produtos base (açaí, sorvete, picolé)
const baseProducts: Product[] = [
  {
    id: 1,
    name: "Açaí 300ml",
    description: "Delicioso açaí cremoso servido em copo de 300ml",
    image: "https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    sizes: [
      { size: "300ml", price: 8.00 },
    ],
    categoryId: 1,
    categoryName: "Açaí",
    active: true,
    allowedAdditionals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    hasAdditionals: true,
    additionalsLimit: 10,
    needsSpoon: true,
  },
  {
    id: 2,
    name: "Açaí 500ml",
    description: "Açaí cremoso e delicioso servido em copo de 500ml",
    image: "https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    sizes: [
      { size: "500ml", price: 12.00 },
    ],
    categoryId: 1,
    categoryName: "Açaí",
    active: true,
    allowedAdditionals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    hasAdditionals: true,
    additionalsLimit: 15,
    needsSpoon: true,
  },
  {
    id: 3,
    name: "Açaí 700ml",
    description: "Grande porção de açaí cremoso servido em copo de 700ml",
    image: "https://images.unsplash.com/photo-1591034856923-c87b5f3e6e2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    sizes: [
      { size: "700ml", price: 16.00 },
    ],
    categoryId: 1,
    categoryName: "Açaí",
    active: true,
    allowedAdditionals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    hasAdditionals: true,
    additionalsLimit: 20,
    needsSpoon: true,
  },
]

// Configurações de categorias base
const baseCategories: Category[] = [
  {
    id: 1,
    name: "Açaí",
    order: 1,
    active: true,
  },
  {
    id: 2,
    name: "Sorvetes",
    order: 2,
    active: true,
  },
  {
    id: 3,
    name: "Picolés",
    order: 3,
    active: true,
  },
]

// Configurações de adicionais base
const baseAdditionals: Additional[] = [
  {
    id: 1,
    name: "Banana",
    price: 1.50,
    categoryId: 1,
    categoryName: "Frutas",
    active: true,
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    hasPricing: true,
  },
  {
    id: 2,
    name: "Morango",
    price: 2.00,
    categoryId: 1,
    categoryName: "Frutas",
    active: true,
    image: "https://images.unsplash.com/photo-1518635017498-87f514b751ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    hasPricing: true,
  },
  {
    id: 3,
    name: "Granola",
    price: 1.00,
    categoryId: 2,
    categoryName: "Complementos",
    active: true,
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    hasPricing: true,
  },
  {
    id: 4,
    name: "Condensado",
    price: 1.50,
    categoryId: 2,
    categoryName: "Complementos",
    active: true,
    image: "https://images.unsplash.com/photo-1520170350707-b2da59970118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    hasPricing: true,
  },
  {
    id: 5,
    name: "Chocolate",
    price: 2.50,
    categoryId: 2,
    categoryName: "Complementos",
    active: true,
    image: "https://images.unsplash.com/photo-1549007174-ab74efb5d5dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80",
    hasPricing: true,
  },
]

// Interface para configuração inicial
interface InitialConfig {
  products: Product[]
  categories: Category[]
  additionals: Additional[]
  carouselSlides: CarouselSlide[]
  phrases: Phrase[]
  storeConfig: StoreConfig
  pageContents: PageContent[]
  notifications: Notification[]
}

// Função principal para inicializar o banco de dados
export async function initializeDatabase(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    console.log("🚀 Iniciando inicialização do banco de dados...")
    
    // Verificar se já existem dados
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id")
      .limit(1)
    
    if (existingProducts && existingProducts.length > 0) {
      console.log("✅ Banco de dados já contém dados, pulando inicialização")
      return true
    }
    
    // Inicializar categorias primeiro (dependência dos produtos)
    console.log("📂 Inserindo categorias...")
    const { error: categoriesError } = await supabase
      .from("categories")
      .insert(baseCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        order: cat.order,
        active: cat.active,
      })))
    
    if (categoriesError) {
      console.error("Erro ao inserir categorias:", categoriesError)
      return false
    }
    
    // Inserir produtos
    console.log("🍨 Inserindo produtos...")
    const { error: productsError } = await supabase
      .from("products")
      .insert(baseProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      sizes: product.sizes,
      category_id: product.categoryId,
        active: product.active,
        allowed_additionals: product.allowedAdditionals,
        has_additionals: product.hasAdditionals,
        additionals_limit: product.additionalsLimit,
        needs_spoon: product.needsSpoon,
      })))
    
    if (productsError) {
      console.error("Erro ao inserir produtos:", productsError)
      return false
    }
    
    // Inserir adicionais
    console.log("🍓 Inserindo adicionais...")
    const { error: additionalsError } = await supabase
      .from("additionals")
      .insert(baseAdditionals.map(additional => ({
      id: additional.id,
      name: additional.name,
      price: additional.price,
      category_id: additional.categoryId,
        active: additional.active,
        image: additional.image,
        has_pricing: additional.hasPricing,
      })))
    
    if (additionalsError) {
      console.error("Erro ao inserir adicionais:", additionalsError)
      return false
    }
    
    console.log("✅ Banco de dados inicializado com sucesso!")
    return true
    
  } catch (error) {
    console.error("❌ Erro ao inicializar banco de dados:", error)
    return false
  }
}

// Função para verificar se o banco está configurado
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    const { data: products } = await supabase
      .from("products")
      .select("id")
      .limit(1)
    
    const { data: categories } = await supabase
      .from("categories")
      .select("id")
      .limit(1)
    
    const { data: additionals } = await supabase
      .from("additionals")
      .select("id")
      .limit(1)
    
    return !!(products?.length && categories?.length && additionals?.length)
    
  } catch (error) {
    console.error("Erro ao verificar inicialização do banco:", error)
    return false
  }
}

// Função para limpar completamente o banco (usar com cuidado!)
export async function clearDatabase(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    console.log("⚠️ ATENÇÃO: Limpando todo o banco de dados...")
    
    // Limpar na ordem correta para evitar problemas de referência
    await supabase.from("orders").delete().neq("id", 0)
    await supabase.from("additionals").delete().neq("id", 0)
    await supabase.from("products").delete().neq("id", 0)
    await supabase.from("categories").delete().neq("id", 0)
    await supabase.from("carousel_slides").delete().neq("id", 0)
    await supabase.from("phrases").delete().neq("id", 0)
    await supabase.from("notifications").delete().neq("id", 0)
    await supabase.from("page_contents").delete().neq("id", 0)
    
    console.log("✅ Banco de dados limpo com sucesso!")
    return true
    
  } catch (error) {
    console.error("❌ Erro ao limpar banco de dados:", error)
    return false
  }
}

// Função para obter estatísticas do banco
export async function getDatabaseStats(): Promise<{
  products: number
  categories: number
  additionals: number
  orders: number
  slides: number
  phrases: number
  notifications: number
} | null> {
  try {
    const supabase = createSupabaseClient()

    const [
      { count: products },
      { count: categories },
      { count: additionals },
      { count: orders },
      { count: slides },
      { count: phrases },
      { count: notifications },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("additionals").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("carousel_slides").select("*", { count: "exact", head: true }),
      supabase.from("phrases").select("*", { count: "exact", head: true }),
      supabase.from("notifications").select("*", { count: "exact", head: true }),
    ])
    
    return {
      products: products || 0,
      categories: categories || 0,
      additionals: additionals || 0,
      orders: orders || 0,
      slides: slides || 0,
      phrases: phrases || 0,
      notifications: notifications || 0,
    }
    
  } catch (error) {
    console.error("Erro ao obter estatísticas do banco:", error)
    return null
  }
}
