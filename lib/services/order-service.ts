import { createSupabaseClient } from "../supabase-client"
import type { Order, OrderStatus, OrderType } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import { DeliveryAddressService } from "./delivery-address-service"

// Função utilitária para fazer o parsing correto dos items
const parseItems = (items: any): any[] => {
  if (typeof items === 'string') {
    try {
      return JSON.parse(items)
    } catch {
      return []
    }
  }
  return Array.isArray(items) ? items : []
}

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
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
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
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
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

      // Se for um pedido de entrega, verificar e criar endereço automaticamente
      if (order.orderType === 'delivery' && order.address) {
        try {
          // Verificar se o endereço já existe usando rua, número e bairro
          const existingAddress = await DeliveryAddressService.findDeliveryAddressByComponents(
            order.address.street || '',
            order.address.number || '',
            order.address.neighborhood || ''
          )
          
          // Se não existir, criar novo endereço
          if (!existingAddress) {
            const newAddressData = {
              address: order.address.street || '',
              number: order.address.number || '',
              neighborhood: order.address.neighborhood || '',
              city: order.address.city || 'Maringá',
              delivery_fee: order.deliveryFee || 0,
              is_active: true,
              notes: ''
            }
            
            await DeliveryAddressService.createDeliveryAddress(newAddressData)
            const addressKey = `${order.address.street}, ${order.address.number || ''}, ${order.address.neighborhood}, ${order.address.city}`.trim()
            console.log('Novo endereço de entrega criado automaticamente:', addressKey)
          }
        } catch (addressError) {
          // Log do erro mas não interrompe a criação do pedido
          console.warn('Erro ao criar endereço automaticamente:', addressError)
        }
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
        payment_change: order.paymentChange ? parseFloat(order.paymentChange) : null,
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
      const supabase = createSupabaseClient();

      // 1. Excluir itens do pedido da tabela 'order_items'
      // Esta tabela pode não existir em todas as versões, então tratamos o erro.
      const { error: deleteItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      if (deleteItemsError && deleteItemsError.code !== '42P01') { // 42P01: undefined_table
        console.error(`Erro ao excluir itens do pedido ${id}:`, deleteItemsError);
        // Continuar mesmo se a tabela não existir ou se houver outro erro,
        // pois o objetivo principal é excluir o pedido.
      }

      // 2. Excluir o pedido da tabela 'orders'
      const { error: deleteOrderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (deleteOrderError) {
        console.error(`Erro ao excluir o pedido ${id} da tabela 'orders':`, deleteOrderError);
        return false;
      }

      console.log(`Pedido ${id} e seus itens foram excluídos com sucesso.`);
      return true;
    } catch (error) {
      console.error(`Erro inesperado ao excluir o pedido ${id}:`, error);
      return false;
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
        pending_payment: 0,
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
          pending_payment: 0,
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
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
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

  // Obter pedidos de mesa (excluindo pedidos com pagamento pendente)
  async getTableOrders(): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", 'table')
        .neq("status", 'pending_payment') // Excluir pedidos com pagamento pendente
        .order("date", { ascending: false })

      if (error) {
        console.error(`Erro ao buscar pedidos de mesa:`, error)
        return []
      }

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
        subtotal: Number(order.subtotal),
        deliveryFee: Number(order.delivery_fee),
        total: Number(order.total),
        paymentMethod: String(order.payment_method),
        paymentChange: order.payment_change ? String(order.payment_change) : undefined,
        status: order.status as OrderStatus,
        date: new Date(String(order.date)),
        printed: Boolean(order.printed),
        notified: Boolean(order.notified),
        orderType: (order.order_type as OrderType) || 'table',
        tableId: order.table_id ? Number(order.table_id) : undefined,
        tableName: order.table_name ? String(order.table_name) : undefined,
      }))
    } catch (error) {
      console.error(`Erro ao buscar pedidos de mesa:`, error)
      return []
    }
  },

  // Obter pedidos de delivery (excluindo pedidos com pagamento pendente)
  async getDeliveryOrders(): Promise<Order[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_type", 'delivery')
        .neq("status", 'pending_payment') // Excluir pedidos com pagamento pendente
        .order("date", { ascending: false })

      if (error) {
        console.error(`Erro ao buscar pedidos de delivery:`, error)
        return []
      }

      return (data || []).map((order: any) => ({
        id: Number(order.id),
        customerName: String(order.customer_name),
        customerPhone: String(order.customer_phone),
        address: order.address as any,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
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
      console.error(`Erro ao buscar pedidos de delivery:`, error)
      return []
    }
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
        items: typeof order.items === 'string' ? JSON.parse(order.items) : (Array.isArray(order.items) ? order.items : []),
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

  // Subscrever a mudanças em tempo real na tabela de pedidos
  subscribeToOrderChanges(
    onOrderChange: (payload: any) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const supabase = createSupabaseClient()

      // Configurar o canal para escutar mudanças nos pedidos
      const channel = supabase.channel('orders_changes')

      // Configurar o handler para inserções de novos pedidos
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Novo pedido recebido via real-time:', payload)
          onOrderChange({ type: 'INSERT', ...payload })
        }
      )

      // Configurar o handler para atualizações de pedidos
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Pedido atualizado via real-time:', payload)
          onOrderChange({ type: 'UPDATE', ...payload })
        }
      )

      // Configurar o handler para exclusões de pedidos
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders'
        },
        (payload: any) => {
          console.log('Pedido excluído via real-time:', payload)
          onOrderChange({ type: 'DELETE', ...payload })
        }
      )

      // Configurar handler de erro
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (error: any) => {
        console.warn('Erro no canal real-time de pedidos:', error)
        // Não propagar erro para evitar erros intrusivos
      })

      // Subscrever ao canal
      channel.subscribe((status, err) => {
        console.log('Status da subscrição real-time de pedidos:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscrição real-time de pedidos ativa')
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Erro na subscrição real-time de pedidos - funcionando em modo offline')
          // Não chamar onError para evitar erros intrusivos no console
          // A aplicação continuará funcionando normalmente sem real-time
        }
        if (err && onError) {
          onError(err)
        }
      })

      return channel
    } catch (error) {
      console.error('Erro ao configurar subscrição real-time de pedidos:', error)
      if (onError) {
        onError(error as Error)
      }
      return null
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
export const subscribeToOrderChanges = OrderService.subscribeToOrderChanges.bind(OrderService)
