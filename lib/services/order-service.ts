import { createSupabaseClient, createSupabaseClientWithStoreContext } from "../supabase-client"
import type { Order } from "../types"

// Serviço para gerenciar pedidos
export const OrderService = {
  // Obter todos os pedidos
  async getAllOrders(storeId?: string): Promise<Order[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("orders").select("*").order("date", { ascending: false })

      if (error) {
        console.error("Erro ao buscar pedidos:", error)
        return []
      }

      return data.map((item) => ({
        id: item.id,
        customerName: item.customer_name,
        customerPhone: item.customer_phone,
        address: item.address,
        items: item.items,
        subtotal: Number(item.subtotal),
        deliveryFee: Number(item.delivery_fee),
        total: Number(item.total),
        paymentMethod: item.payment_method,
        status: item.status,
        date: new Date(item.date),
        printed: item.printed,
        storeId: item.store_id,
      }))
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      return []
    }
  },

  // Obter pedidos por status
  async getOrdersByStatus(status: string, storeId?: string): Promise<Order[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", status)
        .order("date", { ascending: false })

      if (error) {
        console.error(`Erro ao buscar pedidos com status ${status}:`, error)
        return []
      }

      return data.map((item) => ({
        id: item.id,
        customerName: item.customer_name,
        customerPhone: item.customer_phone,
        address: item.address,
        items: item.items,
        subtotal: Number(item.subtotal),
        deliveryFee: Number(item.delivery_fee),
        total: Number(item.total),
        paymentMethod: item.payment_method,
        status: item.status,
        date: new Date(item.date),
        printed: item.printed,
        storeId: item.store_id,
      }))
    } catch (error) {
      console.error(`Erro ao buscar pedidos com status ${status}:`, error)
      return []
    }
  },

  // Obter pedido por ID
  async getOrderById(id: number, storeId?: string): Promise<Order | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("orders").select("*").eq("id", id).single()

      if (error) {
        console.error(`Erro ao buscar pedido ${id}:`, error)
        return null
      }

      return {
        id: data.id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        address: data.address,
        items: data.items,
        subtotal: Number(data.subtotal),
        deliveryFee: Number(data.delivery_fee),
        total: Number(data.total),
        paymentMethod: data.payment_method,
        status: data.status,
        date: new Date(data.date),
        printed: data.printed,
        storeId: data.store_id,
      }
    } catch (error) {
      console.error(`Erro ao buscar pedido ${id}:`, error)
      return null
    }
  },

  // Criar pedido
  async createOrder(order: Omit<Order, "id">, storeId?: string): Promise<Order | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const orderData = {
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        total: order.total,
        payment_method: order.paymentMethod,
        status: order.status,
        date: order.date.toISOString(),
        printed: order.printed || false,
        store_id: storeId || order.storeId,
      }

      const { data, error } = await supabase.from("orders").insert(orderData).select().single()

      if (error) {
        console.error("Erro ao criar pedido:", error)
        return null
      }

      return {
        id: data.id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        address: data.address,
        items: data.items,
        subtotal: Number(data.subtotal),
        deliveryFee: Number(data.delivery_fee),
        total: Number(data.total),
        paymentMethod: data.payment_method,
        status: data.status,
        date: new Date(data.date),
        printed: data.printed,
        storeId: data.store_id,
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      return null
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(id: number, status: string, storeId?: string): Promise<boolean> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { error } = await supabase.from("orders").update({ status }).eq("id", id)

      if (error) {
        console.error(`Erro ao atualizar status do pedido ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${id}:`, error)
      return false
    }
  },

  // Marcar pedido como impresso
  async markOrderAsPrinted(id: number, storeId?: string): Promise<boolean> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { error } = await supabase.from("orders").update({ printed: true }).eq("id", id)

      if (error) {
        console.error(`Erro ao marcar pedido ${id} como impresso:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao marcar pedido ${id} como impresso:`, error)
      return false
    }
  },
}

// Exportar funções individuais para compatibilidade com código existente
export const getAllOrders = OrderService.getAllOrders.bind(OrderService)
export const getOrdersByStatus = OrderService.getOrdersByStatus.bind(OrderService)
export const getOrderById = OrderService.getOrderById.bind(OrderService)
export const createOrder = OrderService.createOrder.bind(OrderService)
export const updateOrderStatus = OrderService.updateOrderStatus.bind(OrderService)
export const markOrderAsPrinted = OrderService.markOrderAsPrinted.bind(OrderService)

// Função auxiliar para salvar um pedido (para compatibilidade com código existente)
export async function saveOrder(order: any, storeId?: string): Promise<Order | null> {
  return await OrderService.createOrder(order, storeId)
}
