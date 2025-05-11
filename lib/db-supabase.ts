import { createSupabaseClient } from "@/lib/supabase-client"
import { shouldUseSupabase } from "@/lib/persistence-manager"
import type {
  Product,
  Category,
  Additional,
  Order,
  CarouselSlide,
  Phrase,
  StoreConfig,
  PageContent,
  Notification,
  CartItem,
} from "@/lib/db"

// Verificar se a migração para o Supabase foi concluída
export function isSupabaseMigrationCompleted(): boolean {
  return shouldUseSupabase()
}

// Função para gerar um ID seguro para o PostgreSQL
export async function generateSafeId(table: string): Promise<number> {
  const supabase = createSupabaseClient()

  // Buscar o maior ID atual
  const { data, error } = await supabase.from(table).select("id").order("id", { ascending: false }).limit(1)

  if (error) {
    console.error(`Erro ao buscar maior ID da tabela ${table}:`, error)
    // Começar com um ID seguro se houver erro
    return 1
  }

  // Se não houver registros, começar com 1
  if (!data || data.length === 0) {
    return 1
  }

  // Retornar o próximo ID
  return data[0].id + 1
}

// Funções para Carrinho
export async function getCartFromSupabase(): Promise<CartItem[]> {
  // Implementação para o carrinho no Supabase
  // Nota: Isso requer autenticação de usuário para associar o carrinho a um usuário específico
  // Por enquanto, vamos manter o carrinho no IndexedDB
  return []
}

export async function addToCartInSupabase(item: CartItem): Promise<void> {
  // Implementação para adicionar ao carrinho no Supabase
  // Por enquanto, vamos manter o carrinho no IndexedDB
}

export async function removeFromCartInSupabase(id: number, size: string): Promise<void> {
  // Implementação para remover do carrinho no Supabase
  // Por enquanto, vamos manter o carrinho no IndexedDB
}

export async function updateCartItemQuantityInSupabase(id: number, size: string, quantity: number): Promise<void> {
  // Implementação para atualizar quantidade no carrinho no Supabase
  // Por enquanto, vamos manter o carrinho no IndexedDB
}

export async function clearCartInSupabase(): Promise<void> {
  // Implementação para limpar o carrinho no Supabase
  // Por enquanto, vamos manter o carrinho no IndexedDB
}

// Funções para Produtos
export async function getAllProductsFromSupabase(): Promise<Product[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("products").select("*")

  if (error) {
    console.error("Erro ao buscar produtos do Supabase:", error)
    throw error
  }

  return data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    sizes: product.sizes as { size: string; price: number }[],
    categoryId: product.category_id,
    active: product.active,
    allowedAdditionals: product.allowed_additionals,
  }))
}

export async function getProductsByCategoryFromSupabase(categoryId: number): Promise<Product[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("products").select("*").eq("category_id", categoryId)

  if (error) {
    console.error(`Erro ao buscar produtos da categoria ${categoryId} do Supabase:`, error)
    throw error
  }

  return data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    sizes: product.sizes as { size: string; price: number }[],
    categoryId: product.category_id,
    active: product.active,
    allowedAdditionals: product.allowed_additionals,
  }))
}

export async function saveProductToSupabase(product: Product): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Verificar se o ID está dentro do intervalo seguro para PostgreSQL
    const isIdTooLarge = product.id > 2147483647

    // Se o ID for muito grande, gerar um novo ID seguro
    const safeProduct = { ...product }

    if (isIdTooLarge) {
      // Verificar se o produto já existe com outro ID
      const { data: existingProducts } = await supabase.from("products").select("id").eq("name", product.name).limit(1)

      if (existingProducts && existingProducts.length > 0) {
        // Usar o ID existente
        safeProduct.id = existingProducts[0].id
      } else {
        // Gerar um novo ID seguro
        safeProduct.id = await generateSafeId("products")
      }
    }

    const { error } = await supabase.from("products").upsert(
      {
        id: safeProduct.id,
        name: safeProduct.name,
        description: safeProduct.description,
        image: safeProduct.image,
        sizes: safeProduct.sizes,
        category_id: safeProduct.categoryId,
        active: safeProduct.active !== undefined ? safeProduct.active : true,
        allowed_additionals: safeProduct.allowedAdditionals || null,
      },
      { onConflict: "id" },
    )

    if (error) {
      console.error(`Erro ao salvar produto ${safeProduct.id} no Supabase:`, error)
      throw error
    }

    // Se o ID foi alterado, retornar o novo ID para atualização local
    if (isIdTooLarge) {
      console.log(`ID do produto alterado de ${product.id} para ${safeProduct.id}`)
    }
  } catch (error) {
    console.error(`Erro ao salvar produto ${product.id} no Supabase:`, error)
    throw error
  }
}

export async function deleteProductFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir produto ${id} do Supabase:`, error)
    throw error
  }
}

// Funções para Categorias
export async function getAllCategoriesFromSupabase(): Promise<Category[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("categories").select("*")

  if (error) {
    console.error("Erro ao buscar categorias do Supabase:", error)
    throw error
  }

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order,
    active: category.active,
  }))
}

export async function getActiveCategoriesFromSupabase(): Promise<Category[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("order")

  if (error) {
    console.error("Erro ao buscar categorias ativas do Supabase:", error)
    throw error
  }

  return data.map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order,
    active: category.active,
  }))
}

export async function saveCategoryToSupabase(category: Category): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Verificar se o ID está dentro do intervalo seguro para PostgreSQL
    const isIdTooLarge = category.id > 2147483647

    // Se o ID for muito grande, gerar um novo ID seguro
    const safeCategory = { ...category }

    if (isIdTooLarge) {
      // Verificar se a categoria já existe com outro ID
      const { data: existingCategories } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category.name)
        .limit(1)

      if (existingCategories && existingCategories.length > 0) {
        // Usar o ID existente
        safeCategory.id = existingCategories[0].id
      } else {
        // Gerar um novo ID seguro
        safeCategory.id = await generateSafeId("categories")
      }
    }

    const { error } = await supabase.from("categories").upsert(
      {
        id: safeCategory.id,
        name: safeCategory.name,
        order: safeCategory.order,
        active: safeCategory.active,
      },
      { onConflict: "id" },
    )

    if (error) {
      console.error(`Erro ao salvar categoria ${safeCategory.id} no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar categoria ${category.id} no Supabase:`, error)
    throw error
  }
}

export async function deleteCategoryFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir categoria ${id} do Supabase:`, error)
    throw error
  }
}

// Funções para Adicionais
export async function getAllAdditionalsFromSupabase(): Promise<Additional[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("additionals").select("*")

  if (error) {
    console.error("Erro ao buscar adicionais do Supabase:", error)
    throw error
  }

  return data.map((additional) => ({
    id: additional.id,
    name: additional.name,
    price: additional.price,
    categoryId: additional.category_id,
    active: additional.active,
    image: additional.image || undefined,
  }))
}

export async function getActiveAdditionalsFromSupabase(): Promise<Additional[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("additionals").select("*").eq("active", true)

  if (error) {
    console.error("Erro ao buscar adicionais ativos do Supabase:", error)
    throw error
  }

  return data.map((additional) => ({
    id: additional.id,
    name: additional.name,
    price: additional.price,
    categoryId: additional.category_id,
    active: additional.active,
    image: additional.image || undefined,
  }))
}

export async function saveAdditionalToSupabase(additional: Additional): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Verificar se o ID está dentro do intervalo seguro para PostgreSQL
    const isIdTooLarge = additional.id > 2147483647

    // Se o ID for muito grande, gerar um novo ID seguro
    const safeAdditional = { ...additional }

    if (isIdTooLarge) {
      // Verificar se o adicional já existe com outro ID
      const { data: existingAdditionals } = await supabase
        .from("additionals")
        .select("id")
        .eq("name", additional.name)
        .limit(1)

      if (existingAdditionals && existingAdditionals.length > 0) {
        // Usar o ID existente
        safeAdditional.id = existingAdditionals[0].id
      } else {
        // Gerar um novo ID seguro
        safeAdditional.id = await generateSafeId("additionals")
      }
    }

    const { error } = await supabase.from("additionals").upsert(
      {
        id: safeAdditional.id,
        name: safeAdditional.name,
        price: safeAdditional.price,
        category_id: safeAdditional.categoryId,
        active: safeAdditional.active,
        image: safeAdditional.image || null,
      },
      { onConflict: "id" },
    )

    if (error) {
      console.error(`Erro ao salvar adicional ${safeAdditional.id} no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar adicional ${additional.id} no Supabase:`, error)
    throw error
  }
}

export async function deleteAdditionalFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("additionals").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir adicional ${id} do Supabase:`, error)
    throw error
  }
}

// Funções para Pedidos
export async function getAllOrdersFromSupabase(): Promise<Order[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("orders").select("*").order("date", { ascending: false })

  if (error) {
    console.error("Erro ao buscar pedidos do Supabase:", error)
    throw error
  }

  return data.map((order) => ({
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    address: order.address as {
      street: string
      number: string
      neighborhood: string
      complement?: string
    },
    items: order.items as {
      id: number
      name: string
      size: string
      price: number
      quantity: number
      additionals?: { id: number; name: string; price: number; quantity: number }[]
    }[],
    subtotal: order.subtotal,
    deliveryFee: order.delivery_fee,
    total: order.total,
    paymentMethod: order.payment_method as "card" | "pix",
    status: order.status as "new" | "preparing" | "delivering" | "completed" | "cancelled",
    date: new Date(order.date),
    printed: order.printed,
  }))
}

export async function saveOrderToSupabase(order: Order): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Se o pedido não tiver ID ou o ID for muito grande, não incluir o ID para que o PostgreSQL gere um automaticamente
    const isIdTooLarge = order.id && order.id > 2147483647

    const orderData: any = {
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      address: order.address,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      payment_method: order.paymentMethod,
      status: order.status,
      date: new Date(order.date).toISOString(),
      printed: order.printed,
    }

    // Só incluir o ID se não for muito grande
    if (order.id && !isIdTooLarge) {
      orderData.id = order.id
    }

    const { error, data } = await supabase
      .from("orders")
      .upsert(orderData, { onConflict: order.id && !isIdTooLarge ? "id" : undefined, returning: "minimal" })

    if (error) {
      console.error(`Erro ao salvar pedido ${order.id} no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar pedido ${order.id} no Supabase:`, error)
    throw error
  }
}

export async function markOrderAsPrintedInSupabase(orderId: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("orders").update({ printed: true }).eq("id", orderId)

  if (error) {
    console.error(`Erro ao marcar pedido ${orderId} como impresso no Supabase:`, error)
    throw error
  }
}

export async function updateOrderStatusInSupabase(orderId: number, status: Order["status"]): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

  if (error) {
    console.error(`Erro ao atualizar status do pedido ${orderId} no Supabase:`, error)
    throw error
  }
}

// Funções para Carrossel
export async function getAllCarouselSlidesFromSupabase(): Promise<CarouselSlide[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("carousel_slides").select("*").order("order")

  if (error) {
    console.error("Erro ao buscar slides do carrossel do Supabase:", error)
    throw error
  }

  return data.map((slide) => ({
    id: slide.id,
    image: slide.image,
    title: slide.title,
    subtitle: slide.subtitle,
    order: slide.order,
    active: slide.active,
  }))
}

export async function getActiveCarouselSlidesFromSupabase(): Promise<CarouselSlide[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("carousel_slides").select("*").eq("active", true).order("order")

  if (error) {
    console.error("Erro ao buscar slides ativos do carrossel do Supabase:", error)
    throw error
  }

  return data.map((slide) => ({
    id: slide.id,
    image: slide.image,
    title: slide.title,
    subtitle: slide.subtitle,
    order: slide.order,
    active: slide.active,
  }))
}

export async function saveCarouselSlideToSupabase(slide: CarouselSlide): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Verificar se o ID está dentro do intervalo seguro para PostgreSQL
    const isIdTooLarge = slide.id > 2147483647

    // Se o ID for muito grande, gerar um novo ID seguro
    const safeSlide = { ...slide }

    if (isIdTooLarge) {
      // Gerar um novo ID seguro
      safeSlide.id = await generateSafeId("carousel_slides")
    }

    const { error } = await supabase.from("carousel_slides").upsert(
      {
        id: safeSlide.id,
        image: safeSlide.image,
        title: safeSlide.title,
        subtitle: safeSlide.subtitle,
        order: safeSlide.order,
        active: safeSlide.active,
      },
      { onConflict: "id" },
    )

    if (error) {
      console.error(`Erro ao salvar slide ${safeSlide.id} do carrossel no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar slide ${slide.id} do carrossel no Supabase:`, error)
    throw error
  }
}

export async function deleteCarouselSlideFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("carousel_slides").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir slide ${id} do carrossel do Supabase:`, error)
    throw error
  }
}

// Funções para Frases
export async function getAllPhrasesFromSupabase(): Promise<Phrase[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("phrases").select("*").order("order")

  if (error) {
    console.error("Erro ao buscar frases do Supabase:", error)
    throw error
  }

  return data.map((phrase) => ({
    id: phrase.id,
    text: phrase.text,
    order: phrase.order,
    active: phrase.active,
  }))
}

export async function getActivePhrasesFromSupabase(): Promise<Phrase[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("phrases").select("*").eq("active", true).order("order")

  if (error) {
    console.error("Erro ao buscar frases ativas do Supabase:", error)
    throw error
  }

  return data.map((phrase) => ({
    id: phrase.id,
    text: phrase.text,
    order: phrase.order,
    active: phrase.active,
  }))
}

export async function savePhraseToSupabase(phrase: Phrase): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Verificar se o ID está dentro do intervalo seguro para PostgreSQL
    const isIdTooLarge = phrase.id > 2147483647

    // Se o ID for muito grande, gerar um novo ID seguro
    const safePhrase = { ...phrase }

    if (isIdTooLarge) {
      // Gerar um novo ID seguro
      safePhrase.id = await generateSafeId("phrases")
    }

    const { error } = await supabase.from("phrases").upsert(
      {
        id: safePhrase.id,
        text: safePhrase.text,
        order: safePhrase.order,
        active: safePhrase.active,
      },
      { onConflict: "id" },
    )

    if (error) {
      console.error(`Erro ao salvar frase ${safePhrase.id} no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar frase ${phrase.id} no Supabase:`, error)
    throw error
  }
}

export async function deletePhraseFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("phrases").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir frase ${id} do Supabase:`, error)
    throw error
  }
}

// Funções para Configuração da Loja
export async function getStoreConfigFromSupabase(): Promise<StoreConfig> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("store_config").select("*").eq("id", "main").single()

  if (error) {
    if (error.code === "PGRST116") {
      // Configuração não encontrada, criar uma padrão
      const defaultConfig: StoreConfig = {
        id: "main",
        name: "Açaí Delícia",
        logoUrl: "/placeholder.svg?key=logo&text=Açaí+Delícia",
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
        lastUpdated: new Date(),
      }

      await saveStoreConfigToSupabase(defaultConfig)
      return defaultConfig
    }

    console.error("Erro ao buscar configuração da loja do Supabase:", error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url,
    deliveryFee: data.delivery_fee,
    isOpen: data.is_open,
    operatingHours: data.operating_hours as StoreConfig["operatingHours"],
    specialDates: data.special_dates as StoreConfig["specialDates"],
    lastUpdated: new Date(data.last_updated),
  }
}

export async function saveStoreConfigToSupabase(config: StoreConfig): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("store_config").upsert(
    {
      id: config.id,
      name: config.name,
      logo_url: config.logoUrl,
      delivery_fee: config.deliveryFee,
      is_open: config.isOpen,
      operating_hours: config.operatingHours,
      special_dates: config.specialDates,
      last_updated: new Date(config.lastUpdated).toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error(`Erro ao salvar configuração da loja no Supabase:`, error)
    throw error
  }
}

// Funções para Conteúdo das Páginas
export async function getPageContentFromSupabase(id: string): Promise<PageContent | null> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("page_content").select("*").eq("id", id).single()

  if (error) {
    if (error.code === "PGRST116") {
      // Conteúdo não encontrado
      return null
    }

    console.error(`Erro ao buscar conteúdo da página ${id} do Supabase:`, error)
    throw error
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    lastUpdated: new Date(data.last_updated),
  }
}

export async function savePageContentToSupabase(pageContent: PageContent): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("page_content").upsert(
    {
      id: pageContent.id,
      title: pageContent.title,
      content: pageContent.content,
      last_updated: new Date(pageContent.lastUpdated).toISOString(),
    },
    { onConflict: "id" },
  )

  if (error) {
    console.error(`Erro ao salvar conteúdo da página ${pageContent.id} no Supabase:`, error)
    throw error
  }
}

// Funções para Notificações
export async function getAllNotificationsFromSupabase(): Promise<Notification[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase.from("notifications").select("*").order("priority", { ascending: false })

  if (error) {
    console.error("Erro ao buscar notificações do Supabase:", error)
    throw error
  }

  return data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type as "info" | "warning" | "alert" | "success",
    active: notification.active,
    startDate: new Date(notification.start_date),
    endDate: new Date(notification.end_date),
    priority: notification.priority,
    read: notification.read,
    createdAt: new Date(notification.created_at),
  }))
}

export async function getActiveNotificationsFromSupabase(): Promise<Notification[]> {
  const supabase = createSupabaseClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("priority", { ascending: false })

  if (error) {
    console.error("Erro ao buscar notificações ativas do Supabase:", error)
    throw error
  }

  return data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type as "info" | "warning" | "alert" | "success",
    active: notification.active,
    startDate: new Date(notification.start_date),
    endDate: new Date(notification.end_date),
    priority: notification.priority,
    read: notification.read,
    createdAt: new Date(notification.created_at),
  }))
}

export async function saveNotificationToSupabase(notification: Notification): Promise<void> {
  const supabase = createSupabaseClient()

  try {
    // Se a notificação não tiver ID ou o ID for muito grande, não incluir o ID para que o PostgreSQL gere um automaticamente
    const isIdTooLarge = notification.id && notification.id > 2147483647

    const notificationData: any = {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      active: notification.active,
      start_date: new Date(notification.startDate).toISOString(),
      end_date: new Date(notification.endDate).toISOString(),
      priority: notification.priority,
      read: notification.read,
      created_at: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
    }

    // Só incluir o ID se não for muito grande
    if (notification.id && !isIdTooLarge) {
      notificationData.id = notification.id
    }

    const { error } = await supabase
      .from("notifications")
      .upsert(notificationData, { onConflict: notification.id && !isIdTooLarge ? "id" : undefined })

    if (error) {
      console.error(`Erro ao salvar notificação ${notification.id} no Supabase:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Erro ao salvar notificação ${notification.id} no Supabase:`, error)
    throw error
  }
}

export async function deleteNotificationFromSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("notifications").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao excluir notificação ${id} do Supabase:`, error)
    throw error
  }
}

export async function markNotificationAsReadInSupabase(id: number): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

  if (error) {
    console.error(`Erro ao marcar notificação ${id} como lida no Supabase:`, error)
    throw error
  }
}

export async function markAllNotificationsAsReadInSupabase(): Promise<void> {
  const supabase = createSupabaseClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .eq("read", false)

  if (error) {
    console.error("Erro ao marcar todas as notificações como lidas no Supabase:", error)
    throw error
  }
}
