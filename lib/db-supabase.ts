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
import { DEFAULT_STORE_ID } from "./constants"
import { 
  getTableWithStoreFilter,
  getActiveOrderedRecordsWithStoreFilter,
  getActiveRecordsWithStoreFilter,
  getOrderedRecordsWithStoreFilter,
  getRecordByIdWithStoreFilter,
  insertWithStoreId,
  updateWithStoreFilter,
  deleteWithStoreFilter,
  clearCartWithStoreFilter
} from "./supabase-utils"

// Funções para o carrinho
export async function getCartFromSupabase(): Promise<CartItem[]> {
  try {
    const supabase = createSupabaseClient()

    // Obter o ID do usuário atual (ou usar um ID de sessão)
    const sessionId = getSessionId()

    const { data, error } = await supabase.from("cart")
      .select("*")
      .eq("session_id", sessionId)
      .eq("store_id", DEFAULT_STORE_ID) // Filtrar pelo ID da loja padrão

    if (error) {
      console.error("Erro ao obter carrinho do Supabase:", error)
      return []
    }

    // Converter os dados do formato do banco para o formato da aplicação
    return data.map((item: any) => ({
      id: item.product_id,
      productId: item.product_id, // Adicionar productId para satisfazer o tipo CartItem
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
        store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
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
      .eq("store_id", DEFAULT_STORE_ID) // Filtrar pelo ID da loja padrão

    if (error) {
      console.error("Erro ao atualizar quantidade do item no carrinho:", error)
    }
  } catch (error) {
    console.error("Erro ao atualizar quantidade no carrinho no Supabase:", error)
  }
}

export async function clearCartInSupabase(): Promise<void> {
  try {
    const sessionId = getSessionId()
    const supabase = createSupabaseClient()
    // Usar a função utilitária para limpar o carrinho com filtro de store_id
    const { error } = await clearCartWithStoreFilter(supabase, "cart", sessionId)

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
    // Usar a função utilitária para aplicar o filtro de store_id
    const { data, error } = await getTableWithStoreFilter(supabase, "products")

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
    // Usar a função utilitária para aplicar o filtro de store_id e filtrar por categoria
    const { data, error } = await getTableWithStoreFilter(supabase, "products")
      .eq("category_id", categoryId).eq("active", true)

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
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    // Verificar se o produto já existe
    if (product.id) {
      // Verificar se o produto já existe usando a função utilitária
      const { data, error: selectError } = await getTableWithStoreFilter(supabase, "products")
        .eq("id", product.id)

      if (selectError) {
        console.error("Erro ao verificar produto no Supabase:", selectError)
        return
      }

      // Se encontrou algum resultado, o produto existe
      if (data && data.length > 0) {
        // Produto existe, atualizar usando a função utilitária
        const { error: updateError } = await updateWithStoreFilter(
          supabase, 
          "products", 
          dbProduct, 
          "id", 
          product.id
        )

        if (updateError) {
          console.error("Erro ao atualizar produto no Supabase:", updateError)
        }
        return
      }
    }
    
    // Produto não existe ou não tem ID, inserir usando a função utilitária
    const { error: insertError } = await insertWithStoreId(supabase, "products", dbProduct)

    if (insertError) {
      console.error("Erro ao inserir produto no Supabase:", insertError)
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
      date: order.date || new Date().toISOString(),
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    // Verificar se o pedido já existe
    if (order.id) {
      // Verificar se o pedido já existe usando a função utilitária
      const { data, error: selectError } = await getTableWithStoreFilter(supabase, "orders")
        .eq("id", order.id)

      if (selectError) {
        console.error("Erro ao verificar pedido no Supabase:", selectError)
        return
      }

      // Se encontrou algum resultado, o pedido existe
      if (data && data.length > 0) {
        // Pedido existe, atualizar usando a função utilitária
        const { error: updateError } = await updateWithStoreFilter(
          supabase, 
          "orders", 
          dbOrder, 
          "id", 
          order.id
        )

        if (updateError) {
          console.error("Erro ao atualizar pedido no Supabase:", updateError)
        }
        return
      }
    }
    
    // Pedido não existe ou não tem ID, inserir usando a função utilitária
    const { error: insertError } = await insertWithStoreId(supabase, "orders", dbOrder)

    if (insertError) {
      console.error("Erro ao inserir pedido no Supabase:", insertError)
    }
  } catch (error) {
    console.error("Erro ao salvar pedido no Supabase:", error)
  }
}

export async function getAllOrdersFromSupabase(): Promise<Order[]> {
  try {
    const supabase = createSupabaseClient()
    // Usar a função utilitária para aplicar o filtro de store_id e ordenação
    const { data, error } = await getOrderedRecordsWithStoreFilter(supabase, "orders", "date", false)

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

// Funções para Conteúdo das Páginas
export async function savePageContentToSupabase(pageContent: PageContent): Promise<void> {
  try {
    const supabase = createSupabaseClient()

    // Converter o conteúdo da página para o formato do banco
    const dbPageContent = {
      id: pageContent.id,
      title: pageContent.title,
      content: pageContent.content,
      last_updated: new Date().toISOString(),
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    // Verificar se o conteúdo da página já existe
    if (pageContent.id) {
      // Verificar se o conteúdo da página já existe usando a função utilitária
      const { data, error: selectError } = await getTableWithStoreFilter(supabase, "page_content")
        .eq("id", pageContent.id)

      if (selectError) {
        console.error("Erro ao verificar conteúdo da página no Supabase:", selectError)
        return
      }

      // Se encontrou algum resultado, o conteúdo da página existe
      if (data && data.length > 0) {
        // Conteúdo da página existe, atualizar usando a função utilitária
        const { error: updateError } = await updateWithStoreFilter(
          supabase, 
          "page_content", 
          dbPageContent, 
          "id", 
          pageContent.id
        )

        if (updateError) {
          console.error("Erro ao atualizar conteúdo da página no Supabase:", updateError)
        }
        return
      }
    }
    
    // Conteúdo da página não existe ou não tem ID, inserir usando a função utilitária
    const { error: insertError } = await insertWithStoreId(supabase, "page_content", dbPageContent)

    if (insertError) {
      console.error("Erro ao inserir conteúdo da página no Supabase:", insertError)
    }
  } catch (error) {
    console.error("Erro ao salvar conteúdo da página no Supabase:", error)
  }
}

// Funções para Notificações
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
      created_at: new Date().toISOString(), // Usar data atual para created_at
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    // Verificar se a notificação já existe
    if (notification.id) {
      // Verificar se a notificação já existe usando a função utilitária
      const { data, error: selectError } = await getTableWithStoreFilter(supabase, "notifications")
        .eq("id", notification.id)

      if (selectError) {
        console.error("Erro ao verificar notificação no Supabase:", selectError)
        return
      }

      // Se encontrou algum resultado, a notificação existe
      if (data && data.length > 0) {
        // Notificação existe, atualizar usando a função utilitária
        // Não atualizar a data de criação
        const dbNotificationUpdate = { ...dbNotification };
        // Usar operador de tipo para evitar erro de tipo
        if ('created_at' in dbNotificationUpdate) {
          // @ts-ignore - Ignorar erro de tipo para o operador delete
          delete dbNotificationUpdate.created_at;
        }
        
        const { error: updateError } = await updateWithStoreFilter(
          supabase, 
          "notifications", 
          dbNotificationUpdate, 
          "id", 
          notification.id
        )

        if (updateError) {
          console.error("Erro ao atualizar notificação no Supabase:", updateError)
        }
        return
      }
    }
    
    // Notificação não existe ou não tem ID, inserir usando a função utilitária
    const { error: insertError } = await insertWithStoreId(supabase, "notifications", dbNotification)

    if (insertError) {
      console.error("Erro ao inserir notificação no Supabase:", insertError)
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
