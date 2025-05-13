import { createSupabaseClient } from "../supabase-client"
import type { Order } from "../types"

// ID da loja padrão (Loja Principal)
const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000000"

// Serviço para gerenciar pedidos
export const OrderService = {
  // Obter todos os pedidos
  async getAllOrders(): Promise<Order[]> {
    const supabase = createSupabaseClient()
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
    }))
  },

  // Obter pedidos por status
  async getOrdersByStatus(status: string): Promise<Order[]> {
    const supabase = createSupabaseClient()
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
    }))
  },

  // Obter pedido por ID
  async getOrderById(id: number): Promise<Order | null> {
    const supabase = createSupabaseClient()
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
    }
  },

  // Criar pedido
  async createOrder(order: Omit<Order, "id">): Promise<Order | null> {
    const supabase = createSupabaseClient()

    try {
      // Adicionar store_id ao objeto do pedido
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
        store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
      }

      console.log("Criando pedido com dados:", JSON.stringify(orderData, null, 2))

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
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      return null
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(id: number, status: string): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("orders").update({ status }).eq("id", id)

    if (error) {
      console.error(`Erro ao atualizar status do pedido ${id}:`, error)
      return false
    }

    return true
  },

  // Marcar pedido como impresso
  async markOrderAsPrinted(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("orders").update({ printed: true }).eq("id", id)

    if (error) {
      console.error(`Erro ao marcar pedido ${id} como impresso:`, error)
      return false
    }

    return true
  },
}

// Função auxiliar para salvar um pedido (para compatibilidade com código existente)
export async function saveOrder(order: any): Promise<Order | null> {
  try {
    console.log("Salvando pedido:", JSON.stringify(order, null, 2))
    return await OrderService.createOrder(order)
  } catch (error) {
    console.error("Erro ao salvar pedido:", error)
    return null
  }
}
