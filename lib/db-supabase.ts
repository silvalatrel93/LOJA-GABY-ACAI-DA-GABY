import { createSupabaseClient } from "./supabase-client"
import type {
  Product,
  Order,
  CarouselSlide,
  Category,
  Additional,
  Phrase,
  StoreConfig,
  PageContent,
  Notification,
  CartItem,
} from "./db"

// Funções para o carrinho
export async function getCartFromSupabase(): Promise<CartItem[]> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    const { data, error } = await supabase.from("cart").select("*").eq("session_id", sessionId)

    if (error) {
      console.error("Erro ao obter carrinho do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((item: any) => ({
      id: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      size: item.size,
      additionals: item.additionals,
    }))
  } catch (error) {
    console.error("Erro ao obter carrinho do Supabase:", error)
    return []
  }
}

export async function addToCartInSupabase(item: CartItem): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    // Verificar se o item já existe no carrinho
    const { data, error: selectError } = await supabase
      .from("cart")
      .select("*")
      .eq("session_id", sessionId)
      .eq("product_id", item.id)
      .eq("size", item.size)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Erro ao verificar item no carrinho:", selectError)
    }

    if (data) {
      // Item já existe, atualizar quantidade
      const { error: updateError } = await supabase
        .from("cart")
        .update({
          quantity: data.quantity + item.quantity,
        })
        .eq("session_id", sessionId)
        .eq("product_id", item.id)
        .eq("size", item.size)

      if (updateError) {
        console.error("Erro ao atualizar item no carrinho:", updateError)
      }
    } else {
      // Item não existe, inserir novo
      const { error: insertError } = await supabase.from("cart").insert({
        session_id: sessionId,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        size: item.size,
        additionals: item.additionals || [],
      })

      if (insertError) {
        console.error("Erro ao adicionar item ao carrinho:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho no Supabase:", error)
  }
}

export async function removeFromCartInSupabase(id: number, size: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("session_id", sessionId)
      .eq("product_id", id)
      .eq("size", size)

    if (error) {
      console.error("Erro ao remover item do carrinho:", error)
    }
  } catch (error) {
    console.error("Erro ao remover do carrinho no Supabase:", error)
  }
}

export async function updateCartItemQuantityInSupabase(id: number, size: string, quantity: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    const { error } = await supabase
      .from("cart")
      .update({
        quantity: quantity,
      })
      .eq("session_id", sessionId)
      .eq("product_id", id)
      .eq("size", size)

    if (error) {
      console.error("Erro ao atualizar quantidade do item no carrinho:", error)
    }
  } catch (error) {
    console.error("Erro ao atualizar quantidade no carrinho no Supabase:", error)
  }
}

export async function clearCartInSupabase(): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    const { error } = await supabase.from("cart").delete().eq("session_id", sessionId)

    if (error) {
      console.error("Erro ao limpar carrinho:", error)
    }
  } catch (error) {
    console.error("Erro ao limpar carrinho no Supabase:", error)
  }
}

// Função para obter um ID de sessão único para o carrinho
function getSessionId(): string {
  if (typeof window === "undefined") {
    return "server-side"
  }

  // Verificar se já existe um ID de sessão no localStorage
  let sessionId = localStorage.getItem("cart_session_id")

  if (!sessionId) {
    // Criar um novo ID de sessão
    sessionId = "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
    localStorage.setItem("cart_session_id", sessionId)
  }

  return sessionId
}

// Funções para Produtos
export async function getAllProductsFromSupabase(): Promise<Product[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Erro ao obter produtos do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      sizes: product.sizes,
      categoryId: product.category_id,
      active: product.active,
      allowedAdditionals: product.allowed_additionals,
    }))
  } catch (error) {
    console.error("Erro ao obter produtos do Supabase:", error)
    return []
  }
}

export async function getProductsByCategoryFromSupabase(categoryId: number): Promise<Product[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("products").select("*").eq("category_id", categoryId).eq("active", true)

    if (error) {
      console.error("Erro ao obter produtos por categoria do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      sizes: product.sizes,
      categoryId: product.category_id,
      active: product.active,
      allowedAdditionals: product.allowed_additionals,
    }))
  } catch (error) {
    console.error("Erro ao obter produtos por categoria do Supabase:", error)
    return []
  }
}

export async function saveProductToSupabase(product: Product): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o produto para o formato do banco
    const dbProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      sizes: product.sizes,
      category_id: product.categoryId,
      active: product.active !== undefined ? product.active : true,
      allowed_additionals: product.allowedAdditionals || [],
    }

    // Verificar se o produto já existe
    const { data, error: selectError } = await supabase.from("products").select("id").eq("id", product.id).maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar produto no Supabase:", selectError)
    }

    if (data) {
      // Produto existe, atualizar
      const { error: updateError } = await supabase.from("products").update(dbProduct).eq("id", product.id)

      if (updateError) {
        console.error("Erro ao atualizar produto no Supabase:", updateError)
      }
    } else {
      // Produto não existe, inserir
      const { error: insertError } = await supabase.from("products").insert(dbProduct)

      if (insertError) {
        console.error("Erro ao inserir produto no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar produto no Supabase:", error)
  }
}

export async function deleteProductFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir produto do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir produto do Supabase:", error)
  }
}

// Funções para Pedidos
export async function saveOrderToSupabase(order: Order): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o pedido para o formato do banco
    const dbOrder = {
      id: order.id,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      address: order.address,
      items: order.items,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      payment_method: order.paymentMethod,
      status: order.status,
      date: order.date,
      printed: order.printed,
    }

    if (order.id) {
      // Pedido existe, atualizar
      const { error: updateError } = await supabase.from("orders").update(dbOrder).eq("id", order.id)

      if (updateError) {
        console.error("Erro ao atualizar pedido no Supabase:", updateError)
      }
    } else {
      // Pedido não existe, inserir
      const { error: insertError } = await supabase.from("orders").insert(dbOrder)

      if (insertError) {
        console.error("Erro ao inserir pedido no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar pedido no Supabase:", error)
  }
}

export async function getAllOrdersFromSupabase(): Promise<Order[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("orders").select("*").order("date", { ascending: false })

    if (error) {
      console.error("Erro ao obter pedidos do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((order: any) => ({
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      address: order.address,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      total: order.total,
      paymentMethod: order.payment_method,
      status: order.status,
      date: new Date(order.date),
      printed: order.printed,
    }))
  } catch (error) {
    console.error("Erro ao obter pedidos do Supabase:", error)
    return []
  }
}

export async function markOrderAsPrintedInSupabase(orderId: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("orders").update({ printed: true }).eq("id", orderId)

    if (error) {
      console.error("Erro ao marcar pedido como impresso no Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao marcar pedido como impresso no Supabase:", error)
  }
}

export async function updateOrderStatusInSupabase(orderId: number, status: Order["status"]): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

    if (error) {
      console.error("Erro ao atualizar status do pedido no Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao atualizar status do pedido no Supabase:", error)
  }
}

// Funções para Carrossel
export async function getAllCarouselSlidesFromSupabase(): Promise<CarouselSlide[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("carousel_slides").select("*").order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter slides do carrossel do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((slide: any) => ({
      id: slide.id,
      image: slide.image,
      title: slide.title,
      subtitle: slide.subtitle,
      order: slide.order,
      active: slide.active,
    }))
  } catch (error) {
    console.error("Erro ao obter slides do carrossel do Supabase:", error)
    return []
  }
}

export async function getActiveCarouselSlidesFromSupabase(): Promise<CarouselSlide[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("carousel_slides")
      .select("*")
      .eq("active", true)
      .order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter slides ativos do carrossel do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((slide: any) => ({
      id: slide.id,
      image: slide.image,
      title: slide.title,
      subtitle: slide.subtitle,
      order: slide.order,
      active: slide.active,
    }))
  } catch (error) {
    console.error("Erro ao obter slides ativos do carrossel do Supabase:", error)
    return []
  }
}

export async function saveCarouselSlideToSupabase(slide: CarouselSlide): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o slide para o formato do banco
    const dbSlide = {
      id: slide.id,
      image: slide.image,
      title: slide.title,
      subtitle: slide.subtitle,
      order: slide.order,
      active: slide.active,
    }

    // Verificar se o slide já existe
    const { data, error: selectError } = await supabase
      .from("carousel_slides")
      .select("id")
      .eq("id", slide.id)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar slide do carrossel no Supabase:", selectError)
    }

    if (data) {
      // Slide existe, atualizar
      const { error: updateError } = await supabase.from("carousel_slides").update(dbSlide).eq("id", slide.id)

      if (updateError) {
        console.error("Erro ao atualizar slide do carrossel no Supabase:", updateError)
      }
    } else {
      // Slide não existe, inserir
      const { error: insertError } = await supabase.from("carousel_slides").insert(dbSlide)

      if (insertError) {
        console.error("Erro ao inserir slide do carrossel no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar slide do carrossel no Supabase:", error)
  }
}

export async function deleteCarouselSlideFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("carousel_slides").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir slide do carrossel do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir slide do carrossel do Supabase:", error)
  }
}

// Funções para Categorias
export async function getAllCategoriesFromSupabase(): Promise<Category[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("categories").select("*").order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter categorias do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      order: category.order,
      active: category.active,
    }))
  } catch (error) {
    console.error("Erro ao obter categorias do Supabase:", error)
    return []
  }
}

export async function getActiveCategoriesFromSupabase(): Promise<Category[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter categorias ativas do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      order: category.order,
      active: category.active,
    }))
  } catch (error) {
    console.error("Erro ao obter categorias ativas do Supabase:", error)
    return []
  }
}

export async function saveCategoryToSupabase(category: Category): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter a categoria para o formato do banco
    const dbCategory = {
      id: category.id,
      name: category.name,
      order: category.order,
      active: category.active,
    }

    // Verificar se a categoria já existe
    const { data, error: selectError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category.id)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar categoria no Supabase:", selectError)
    }

    if (data) {
      // Categoria existe, atualizar
      const { error: updateError } = await supabase.from("categories").update(dbCategory).eq("id", category.id)

      if (updateError) {
        console.error("Erro ao atualizar categoria no Supabase:", updateError)
      }
    } else {
      // Categoria não existe, inserir
      const { error: insertError } = await supabase.from("categories").insert(dbCategory)

      if (insertError) {
        console.error("Erro ao inserir categoria no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar categoria no Supabase:", error)
  }
}

export async function deleteCategoryFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir categoria do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir categoria do Supabase:", error)
  }
}

// Funções para Adicionais
export async function getAllAdditionalsFromSupabase(): Promise<Additional[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("additionals").select("*")

    if (error) {
      console.error("Erro ao obter adicionais do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((additional: any) => ({
      id: additional.id,
      name: additional.name,
      price: additional.price,
      categoryId: additional.category_id,
      active: additional.active,
      image: additional.image,
    }))
  } catch (error) {
    console.error("Erro ao obter adicionais do Supabase:", error)
    return []
  }
}

export async function getActiveAdditionalsFromSupabase(): Promise<Additional[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("additionals").select("*").eq("active", true)

    if (error) {
      console.error("Erro ao obter adicionais ativos do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((additional: any) => ({
      id: additional.id,
      name: additional.name,
      price: additional.price,
      categoryId: additional.category_id,
      active: additional.active,
      image: additional.image,
    }))
  } catch (error) {
    console.error("Erro ao obter adicionais ativos do Supabase:", error)
    return []
  }
}

export async function saveAdditionalToSupabase(additional: Additional): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o adicional para o formato do banco
    const dbAdditional = {
      id: additional.id,
      name: additional.name,
      price: additional.price,
      category_id: additional.categoryId,
      active: additional.active,
      image: additional.image,
    }

    // Verificar se o adicional já existe
    const { data, error: selectError } = await supabase
      .from("additionals")
      .select("id")
      .eq("id", additional.id)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar adicional no Supabase:", selectError)
    }

    if (data) {
      // Adicional existe, atualizar
      const { error: updateError } = await supabase.from("additionals").update(dbAdditional).eq("id", additional.id)

      if (updateError) {
        console.error("Erro ao atualizar adicional no Supabase:", updateError)
      }
    } else {
      // Adicional não existe, inserir
      const { error: insertError } = await supabase.from("additionals").insert(dbAdditional)

      if (insertError) {
        console.error("Erro ao inserir adicional no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar adicional no Supabase:", error)
  }
}

export async function deleteAdditionalFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("additionals").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir adicional do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir adicional do Supabase:", error)
  }
}

// Funções para Frases
export async function getAllPhrasesFromSupabase(): Promise<Phrase[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("phrases").select("*").order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter frases do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((phrase: any) => ({
      id: phrase.id,
      text: phrase.text,
      order: phrase.order,
      active: phrase.active,
    }))
  } catch (error) {
    console.error("Erro ao obter frases do Supabase:", error)
    return []
  }
}

export async function getActivePhrasesFromSupabase(): Promise<Phrase[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("phrases")
      .select("*")
      .eq("active", true)
      .order("order", { ascending: true })

    if (error) {
      console.error("Erro ao obter frases ativas do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((phrase: any) => ({
      id: phrase.id,
      text: phrase.text,
      order: phrase.order,
      active: phrase.active,
    }))
  } catch (error) {
    console.error("Erro ao obter frases ativas do Supabase:", error)
    return []
  }
}

export async function savePhraseToSupabase(phrase: Phrase): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter a frase para o formato do banco
    const dbPhrase = {
      id: phrase.id,
      text: phrase.text,
      order: phrase.order,
      active: phrase.active,
    }

    // Verificar se a frase já existe
    const { data, error: selectError } = await supabase.from("phrases").select("id").eq("id", phrase.id).maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar frase no Supabase:", selectError)
    }

    if (data) {
      // Frase existe, atualizar
      const { error: updateError } = await supabase.from("phrases").update(dbPhrase).eq("id", phrase.id)

      if (updateError) {
        console.error("Erro ao atualizar frase no Supabase:", updateError)
      }
    } else {
      // Frase não existe, inserir
      const { error: insertError } = await supabase.from("phrases").insert(dbPhrase)

      if (insertError) {
        console.error("Erro ao inserir frase no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar frase no Supabase:", error)
  }
}

export async function deletePhraseFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("phrases").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir frase do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir frase do Supabase:", error)
  }
}

// Funções para Configuração da Loja
export async function getStoreConfigFromSupabase(): Promise<StoreConfig> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("store_config").select("*").eq("id", "main").maybeSingle()

    if (error) {
      console.error("Erro ao obter configuração da loja do Supabase:", error)

      // Retornar configuração padrão
      return {
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
    }

    if (!data) {
      // Configuração não existe, criar padrão
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

    // Converter os dados do formato do banco para o formato da aplicação
    return {
      id: data.id,
      name: data.name,
      logoUrl: data.logo_url,
      deliveryFee: data.delivery_fee,
      isOpen: data.is_open,
      operatingHours: data.operating_hours,
      specialDates: data.special_dates || [],
      lastUpdated: new Date(data.last_updated),
    }
  } catch (error) {
    console.error("Erro ao obter configuração da loja do Supabase:", error)

    // Retornar configuração padrão em caso de erro
    return {
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
  }
}

export async function saveStoreConfigToSupabase(config: StoreConfig): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter a configuração para o formato do banco
    const dbConfig = {
      id: config.id,
      name: config.name,
      logo_url: config.logoUrl,
      delivery_fee: config.deliveryFee,
      is_open: config.isOpen,
      operating_hours: config.operatingHours,
      special_dates: config.specialDates,
      last_updated: new Date().toISOString(),
    }

    // Verificar se a configuração já existe
    const { data, error: selectError } = await supabase
      .from("store_config")
      .select("id")
      .eq("id", config.id)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar configuração da loja no Supabase:", selectError)
    }

    if (data) {
      // Configuração existe, atualizar
      const { error: updateError } = await supabase.from("store_config").update(dbConfig).eq("id", config.id)

      if (updateError) {
        console.error("Erro ao atualizar configuração da loja no Supabase:", updateError)
      }
    } else {
      // Configuração não existe, inserir
      const { error: insertError } = await supabase.from("store_config").insert(dbConfig)

      if (insertError) {
        console.error("Erro ao inserir configuração da loja no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar configuração da loja no Supabase:", error)
  }
}

// Funções para Conteúdo das Páginas
export async function getPageContentFromSupabase(id: string): Promise<PageContent | null> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("page_content").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error(`Erro ao obter conteúdo da página ${id} do Supabase:`, error)
      return null
    }

    if (!data) {
      return null
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      lastUpdated: new Date(data.last_updated),
    }
  } catch (error) {
    console.error(`Erro ao obter conteúdo da página ${id} do Supabase:`, error)
    return null
  }
}

export async function savePageContentToSupabase(pageContent: PageContent): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o conteúdo da página para o formato do banco
    const dbPageContent = {
      id: pageContent.id,
      title: pageContent.title,
      content: pageContent.content,
      last_updated: new Date().toISOString(),
    }

    // Verificar se o conteúdo da página já existe
    const { data, error: selectError } = await supabase
      .from("page_content")
      .select("id")
      .eq("id", pageContent.id)
      .maybeSingle()

    if (selectError) {
      console.error("Erro ao verificar conteúdo da página no Supabase:", selectError)
    }

    if (data) {
      // Conteúdo da página existe, atualizar
      const { error: updateError } = await supabase.from("page_content").update(dbPageContent).eq("id", pageContent.id)

      if (updateError) {
        console.error("Erro ao atualizar conteúdo da página no Supabase:", updateError)
      }
    } else {
      // Conteúdo da página não existe, inserir
      const { error: insertError } = await supabase.from("page_content").insert(dbPageContent)

      if (insertError) {
        console.error("Erro ao inserir conteúdo da página no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar conteúdo da página no Supabase:", error)
  }
}

// Funções para Notificações
export async function getAllNotificationsFromSupabase(): Promise<Notification[]> {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao obter notificações do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      active: notification.active,
      startDate: new Date(notification.start_date),
      endDate: new Date(notification.end_date),
      priority: notification.priority,
      read: notification.read,
      createdAt: new Date(notification.created_at),
    }))
  } catch (error) {
    console.error("Erro ao obter notificações do Supabase:", error)
    return []
  }
}

export async function getActiveNotificationsFromSupabase(): Promise<Notification[]> {
  try {
    const supabase = createSupabaseClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao obter notificações ativas do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      active: notification.active,
      startDate: new Date(notification.start_date),
      endDate: new Date(notification.end_date),
      priority: notification.priority,
      read: notification.read,
      createdAt: new Date(notification.created_at),
    }))
  } catch (error) {
    console.error("Erro ao obter notificações ativas do Supabase:", error)
    return []
  }
}

export async function saveNotificationToSupabase(notification: Notification): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter a notificação para o formato do banco
    const dbNotification = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      active: notification.active,
      start_date: notification.startDate.toISOString(),
      end_date: notification.endDate.toISOString(),
      priority: notification.priority,
      read: notification.read,
      created_at: notification.createdAt ? notification.createdAt.toISOString() : new Date().toISOString(),
    }

    if (notification.id) {
      // Notificação existe, atualizar
      const { error: updateError } = await supabase
        .from("notifications")
        .update(dbNotification)
        .eq("id", notification.id)

      if (updateError) {
        console.error("Erro ao atualizar notificação no Supabase:", updateError)
      }
    } else {
      // Notificação não existe, inserir
      delete dbNotification.id // Remover ID para que o banco gere um novo
      const { error: insertError } = await supabase.from("notifications").insert(dbNotification)

      if (insertError) {
        console.error("Erro ao inserir notificação no Supabase:", insertError)
      }
    }
  } catch (error) {
    console.error("Erro ao salvar notificação no Supabase:", error)
  }
}

export async function deleteNotificationFromSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir notificação do Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao excluir notificação do Supabase:", error)
  }
}

export async function markNotificationAsReadInSupabase(id: number): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

    if (error) {
      console.error("Erro ao marcar notificação como lida no Supabase:", error)
    }
  } catch (error) {
    console.error("Erro ao marcar notificação como lida no Supabase:", error)
  }
}

export async function markAllNotificationsAsReadInSupabase(): Promise<void> {
  try {
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
    }
  } catch (error) {
    console.error("Erro ao marcar todas as notificações como lidas no Supabase:", error)
  }
}
