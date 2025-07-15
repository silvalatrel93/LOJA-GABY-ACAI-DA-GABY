import { createSupabaseClient } from "../supabase-client"
import type { Order, OrderStatus, OrderType } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import { NotificationService } from "./notification-service"

export const OrderService = {
  // Obter todos os pedidos
  async getAllOrders(): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      let query = supabase
        .from("orders")
        .select("*")
        .order("date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar pedidos:", error)
        return []
      }

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: order.items as any,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        paymentChange: order.payment_change ? String(order.payment_change) : undefined,
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        printed: Boolean(order.printed),
        notified: Boolean(order.notified),
        orderType: (order.order_type as OrderType) || 'delivery',
        tableId: order.table_id ? Number(order.table_id) : undefined,
        tableName: order.table_name ? String(order.table_name) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error)
      return []
    }
  },

  // Obter pedidos por status
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
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

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: order.items as any,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        paymentChange: order.payment_change ? String(order.payment_change) : undefined,
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        printed: Boolean(order.printed),
        notified: Boolean(order.notified),
        orderType: (order.order_type as OrderType) || 'delivery',
        tableId: order.table_id ? Number(order.table_id) : undefined,
        tableName: order.table_name ? String(order.table_name) : undefined,
      }))
    } catch (error) {
      console.error(`Erro ao buscar pedidos com status ${status}:`, error)
      return []
    }
  },

  // Obter pedido por ID
  async getOrderById(id: number): Promise<Order | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Erro ao buscar pedido ${id}:`, error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: Number(data.id),
        customerName: String(data.customer_name),
        customerPhone: String(data.customer_phone),
        address: data.address as any,
        items: data.items as any,
        subtotal: Number(data.subtotal),
        deliveryFee: Number(data.delivery_fee),
        total: Number(data.total),
        paymentMethod: String(data.payment_method),
        paymentChange: data.payment_change ? String(data.payment_change) : undefined,
        status: data.status as OrderStatus,
        date: new Date(String(data.date)),
        printed: Boolean(data.printed),
        notified: Boolean(data.notified),
        orderType: (data.order_type as OrderType) || 'delivery',
        tableId: data.table_id ? Number(data.table_id) : undefined,
        tableName: data.table_name ? String(data.table_name) : undefined,
      }
    } catch (error) {
      console.error(`Erro ao buscar pedido ${id}:`, error)
      return null
    }
  },

  // Criar novo pedido
  async createOrder(order: Omit<Order, "id">): Promise<{ data: Order | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()

      const orderData = {
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        total: order.total,
        payment_method: order.paymentMethod,
        payment_change: order.paymentChange,
        status: order.status,
        date: order.date.toISOString(),
        printed: order.printed || false,
        notified: order.notified || false,
        store_id: DEFAULT_STORE_ID, // Store ID padrão obrigatório
        order_type: order.orderType || 'delivery', // Incluir tipo do pedido
        table_id: order.tableId || null, // Incluir ID da mesa se for pedido de mesa
        table_name: order.tableName || null, // Incluir nome da mesa se for pedido de mesa
      }

      const { data, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar pedido:", {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
          errorHint: error.hint,
          orderData: {
            customer_name: order.customerName,
            payment_method: order.paymentMethod,
            total: order.total,
            store_id: DEFAULT_STORE_ID
          }
        })
        return { data: null, error: new Error(error.message || 'Erro desconhecido ao criar pedido') }
      }

      const result: Order = {
        id: Number(data.id),
        customerName: String(data.customer_name),
        customerPhone: String(data.customer_phone),
        address: data.address as any,
        items: data.items as any,
        subtotal: Number(data.subtotal),
        deliveryFee: Number(data.delivery_fee),
        total: Number(data.total),
        paymentMethod: String(data.payment_method),
        paymentChange: data.payment_change ? String(data.payment_change) : undefined,
        status: data.status as OrderStatus,
        date: new Date(String(data.date)),
        printed: Boolean(data.printed),
        notified: Boolean(data.notified),
        orderType: (data.order_type as OrderType) || 'delivery',
        tableId: data.table_id ? Number(data.table_id) : undefined,
        tableName: data.table_name ? String(data.table_name) : undefined,
      }

      // Criar notificação e enviar push notification para administradores
      try {
        await NotificationService.createOrderNotification(result)
      } catch (notificationError) {
        console.error("Erro ao criar notificação do pedido:", notificationError)
        // Não falhar a criação do pedido se a notificação falhar
      }

      return { data: result, error: null }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(id: number | string, status: OrderStatus): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)

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
  async markOrderAsPrinted(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({ printed: true })
        .eq("id", id)

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

  // Marcar pedido como notificado
  async markOrderAsNotified(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .update({ notified: true })
        .eq("id", id)

      if (error) {
        console.error(`Erro ao marcar pedido ${id} como notificado:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao marcar pedido ${id} como notificado:`, error)
      return false
    }
  },

  // Excluir pedido
  async deleteOrder(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar pedido ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar pedido ${id}:`, error)
      return false
    }
  },

  // Obter estatísticas de pedidos
  async getOrderStats(): Promise<{
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    byStatus: Record<OrderStatus, number>
  }> {
    try {
      const supabase = createSupabaseClient()

      // Total de pedidos
      const { count: total } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })

      // Pedidos de hoje
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("date", today.toISOString())

      // Pedidos da semana
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      const { count: weekCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("date", weekStart.toISOString())

      // Pedidos do mês
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { count: monthCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("date", monthStart.toISOString())

      // Pedidos por status
      const { data: statusData } = await supabase
        .from("orders")
        .select("status")

      const byStatus: Record<OrderStatus, number> = {
        new: 0,
        pending: 0,
        preparing: 0,
        ready: 0,
        delivering: 0,
        delivered: 0,
        completed: 0,
        cancelled: 0,
        canceled: 0,
      }

      statusData?.forEach((order) => {
        if (order.status && typeof order.status === 'string' && order.status in byStatus) {
          byStatus[order.status as OrderStatus]++
        }
      })

      return {
        total: total || 0,
        today: todayCount || 0,
        thisWeek: weekCount || 0,
        thisMonth: monthCount || 0,
        byStatus,
      }
    } catch (error) {
      console.error("Erro ao obter estatísticas de pedidos:", error)
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byStatus: {
          new: 0,
          pending: 0,
          preparing: 0,
          ready: 0,
          delivering: 0,
          delivered: 0,
          completed: 0,
          cancelled: 0,
          canceled: 0,
        },
      }
    }
  },

  // Obter pedidos por tipo (delivery ou table)
  async getOrdersByType(orderType: OrderType): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", orderType)
        .order("date", { ascending: false })

      if (error) {
        console.error(`Erro ao buscar pedidos do tipo ${orderType}:`, error)
        return []
      }

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: order.items as any,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        paymentChange: order.payment_change ? String(order.payment_change) : undefined,
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        printed: Boolean(order.printed),
        notified: Boolean(order.notified),
        orderType: (order.order_type as OrderType) || 'delivery',
        tableId: order.table_id ? Number(order.table_id) : undefined,
        tableName: order.table_name ? String(order.table_name) : undefined,
      }))
    } catch (error) {
      console.error(`Erro ao buscar pedidos do tipo ${orderType}:`, error)
      return []
    }
  },

  // Obter pedidos de mesa
  async getTableOrders(): Promise<Order[]> {
    return this.getOrdersByType('table')
  },

  // Obter pedidos de delivery
  async getDeliveryOrders(): Promise<Order[]> {
    return this.getOrdersByType('delivery')
  },

  // Obter pedidos de uma mesa específica
  async getOrdersByTable(tableId: number): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .eq("order_type", "table")
        .order("date", { ascending: false })

      if (error) {
        console.error(`Erro ao buscar pedidos da mesa ${tableId}:`, error)
        return []
      }

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: order.items as any,
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        paymentChange: order.payment_change ? String(order.payment_change) : undefined,
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        printed: Boolean(order.printed),
        notified: Boolean(order.notified),
        orderType: (order.order_type as OrderType) || 'delivery',
        tableId: order.table_id ? Number(order.table_id) : undefined,
        tableName: order.table_name ? String(order.table_name) : undefined,
      }))
    } catch (error) {
      console.error(`Erro ao buscar pedidos da mesa ${tableId}:`, error)
      return []
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllOrders = OrderService.getAllOrders.bind(OrderService)
export const getOrdersByStatus = OrderService.getOrdersByStatus.bind(OrderService)
export const getOrderById = OrderService.getOrderById.bind(OrderService)
export const createOrder = OrderService.createOrder.bind(OrderService)
export const updateOrderStatus = OrderService.updateOrderStatus.bind(OrderService)
export const markOrderAsPrinted = OrderService.markOrderAsPrinted.bind(OrderService)
export const markOrderAsNotified = OrderService.markOrderAsNotified.bind(OrderService)
export const deleteOrder = OrderService.deleteOrder.bind(OrderService)
export const getOrderStats = OrderService.getOrderStats.bind(OrderService)
export const getOrdersByType = OrderService.getOrdersByType.bind(OrderService)
export const getTableOrders = OrderService.getTableOrders.bind(OrderService)
export const getDeliveryOrders = OrderService.getDeliveryOrders.bind(OrderService)
export const getOrdersByTable = OrderService.getOrdersByTable.bind(OrderService)
