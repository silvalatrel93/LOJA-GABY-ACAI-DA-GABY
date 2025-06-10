import { createSupabaseClient } from "../supabase-client"
import type { Order, OrderStatus, Address, OrderItem } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import { PushNotificationService } from "./push-notification-service"

// Interface para tipar os dados do Supabase
interface SupabaseOrder {
  id: number
  customer_name: string
  customer_phone: string
  address: Address
  items: OrderItem[]
  subtotal: string | number
  delivery_fee: string | number
  total: string | number
  payment_method: string
  payment_change?: string // Adicionando o campo opcional payment_change
  status: OrderStatus
  date: string
  printed: boolean
  notified: boolean
  store_id: string
}

// Serviço para gerenciar pedidos
export const OrderService = {
  // Obter todos os pedidos
  async getAllOrders(): Promise<Order[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("date", { ascending: false })

    if (error || !data) {
      console.error("Erro ao buscar pedidos:", error)
      return []
    }

    return (data as unknown as SupabaseOrder[]).map((item) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      address: item.address,
      items: item.items,
      subtotal: Number(item.subtotal),
      deliveryFee: Number(item.delivery_fee),
      total: Number(item.total),
      paymentMethod: item.payment_method,
      ...(item.payment_change && { paymentChange: item.payment_change }),
      status: item.status,
      date: new Date(item.date),
      printed: item.printed,
      notified: item.notified,
    }))
  },

  // Obter pedidos por status
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", status)
      .order("date", { ascending: false })

    if (error || !data) {
      console.error(`Erro ao buscar pedidos com status ${status}:`, error)
      return []
    }

    return (data as unknown as SupabaseOrder[]).map((item) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      address: item.address,
      items: item.items,
      subtotal: Number(item.subtotal),
      deliveryFee: Number(item.delivery_fee),
      total: Number(item.total),
      paymentMethod: item.payment_method,
      ...(item.payment_change && { paymentChange: item.payment_change }),
      status: item.status,
      date: new Date(item.date),
      printed: item.printed,
      notified: item.notified,
    }))
  },

  // Obter pedidos não notificados
  async getUnnotifiedOrders(): Promise<Order[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("notified", false)
      .order("date", { ascending: false })

    if (error || !data) {
      console.error("Erro ao buscar pedidos não notificados:", error)
      return []
    }

    return (data as unknown as SupabaseOrder[]).map((item) => ({
      id: item.id,
      customerName: item.customer_name,
      customerPhone: item.customer_phone,
      address: item.address,
      items: item.items,
      subtotal: Number(item.subtotal),
      deliveryFee: Number(item.delivery_fee),
      total: Number(item.total),
      paymentMethod: item.payment_method,
      ...(item.payment_change && { paymentChange: item.payment_change }),
      status: item.status,
      date: new Date(item.date),
      printed: item.printed || false,
      notified: item.notified || false,
    }))
  },

  // Obter pedido por ID
  async getOrderById(id: number): Promise<Order | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      console.error(`Erro ao buscar pedido ${id}:`, error)
      return null
    }

    const orderData = data as unknown as SupabaseOrder
    return {
      id: orderData.id,
      customerName: orderData.customer_name,
      customerPhone: orderData.customer_phone,
      address: orderData.address,
      items: orderData.items,
      subtotal: Number(orderData.subtotal),
      deliveryFee: Number(orderData.delivery_fee),
      total: Number(orderData.total),
      paymentMethod: orderData.payment_method,
      ...(orderData.payment_change && { paymentChange: orderData.payment_change }),
      status: orderData.status,
      date: new Date(orderData.date),
      printed: orderData.printed,
      notified: orderData.notified || false,
    }
  },

  // Criar pedido
  async createOrder(order: Omit<Order, "id">): Promise<Order | null> {
    const supabase = createSupabaseClient()

    try {
      // Adicionar store_id e outros campos ao objeto do pedido
      const orderData = {
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        delivery_fee: order.deliveryFee,
        total: order.total,
        payment_method: order.paymentMethod,
        // Incluir payment_change apenas se existir e for um pagamento em dinheiro
        ...(order.paymentMethod === 'money' && { payment_change: order.paymentChange || '0' }),
        status: order.status,
        date: order.date.toISOString(),
        printed: order.printed || false,
        notified: false, // Inicialmente falso, será marcado como true após notificação
        store_id: DEFAULT_STORE_ID,
      }

      console.log("Criando pedido com dados:", JSON.stringify(orderData, null, 2))

      const { data, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single()

      if (error || !data) {
        console.error("Erro ao criar pedido:", error)
        return null
      }

      const createdOrder = data as unknown as SupabaseOrder
      
      // Enviar notificação push para administradores
      try {
        const notificationTitle = 'Novo Pedido Recebido';
        const notificationBody = `Pedido #${createdOrder.id} - ${createdOrder.customer_name}`;
        
        // Enviar notificação para todos os administradores
        await PushNotificationService.broadcastNotification({
          title: notificationTitle,
          body: notificationBody,
          data: {
            url: `/admin/pedidos`,
            orderId: createdOrder.id
          }
        });

        // Marcar o pedido como notificado
        await supabase
          .rpc('update_order_notified', { order_id: createdOrder.id })
          .single();
          
      } catch (notificationError) {
        console.error('Erro ao enviar notificação push:', notificationError);
        // Não interromper o fluxo se a notificação falhar
      }

      return {
        id: createdOrder.id,
        customerName: createdOrder.customer_name,
        customerPhone: createdOrder.customer_phone,
        address: createdOrder.address,
        items: createdOrder.items,
        subtotal: Number(createdOrder.subtotal),
        deliveryFee: Number(createdOrder.delivery_fee),
        total: Number(createdOrder.total),
        paymentMethod: createdOrder.payment_method,
        // Incluir paymentChange se existir no item retornado
        ...(createdOrder.payment_change && { paymentChange: createdOrder.payment_change }),
        status: createdOrder.status,
        date: new Date(createdOrder.date),
        printed: createdOrder.printed,
        notified: createdOrder.notified || false,
      }
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      return null
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(id: number, status: OrderStatus): Promise<boolean> {
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

  // Marcar pedido como notificado
  async markOrderAsNotified(id: number): Promise<boolean> {
    console.log(`[DEBUG] Tentando marcar pedido ${id} como notificado...`);
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          notified: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .select()

      console.log(`[DEBUG] Resposta do Supabase para pedido ${id}:`, { data, error });

      if (error) {
        console.error(`Erro ao marcar pedido ${id} como notificado:`, error)
        return false
      }

      if (!data || data.length === 0) {
        console.error(`Nenhum pedido encontrado com ID ${id} para marcar como notificado`);
        return false;
      }

      console.log(`[DEBUG] Pedido ${id} marcado como notificado com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao tentar marcar pedido ${id} como notificado:`, error);
      return false;
    }
  },

  // Atualizar pedido
  async updateOrder(id: number, updates: Partial<Order>): Promise<boolean> {
    const supabase = createSupabaseClient()
    
    const updateData: any = {}
    
    // Mapear campos do Order para o formato do banco de dados
    if (updates.customerName !== undefined) updateData.customer_name = updates.customerName
    if (updates.customerPhone !== undefined) updateData.customer_phone = updates.customerPhone
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.items !== undefined) updateData.items = updates.items
    if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal
    if (updates.deliveryFee !== undefined) updateData.delivery_fee = updates.deliveryFee
    if (updates.total !== undefined) updateData.total = updates.total
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.date !== undefined) updateData.date = updates.date.toISOString()
    if (updates.printed !== undefined) updateData.printed = updates.printed
    if (updates.notified !== undefined) updateData.notified = updates.notified

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .eq("store_id", DEFAULT_STORE_ID)

    if (error) {
      console.error(`Erro ao atualizar pedido ${id}:`, error)
      return false
    }

    return true
  },
}

// Função auxiliar para salvar um pedido (para compatibilidade com código existente)
export async function saveOrder(order: Omit<Order, 'id'>): Promise<Order | null> {
  try {
    console.log("Salvando pedido:", JSON.stringify(order, null, 2))
    return await OrderService.createOrder(order)
  } catch (error) {
    console.error("Erro ao salvar pedido:", error)
    return null
  }
}

// Exportar funções individuais para facilitar o uso
export const getAllOrders = OrderService.getAllOrders.bind(OrderService)
export const getOrdersByStatus = OrderService.getOrdersByStatus.bind(OrderService)
export const getOrderById = OrderService.getOrderById.bind(OrderService)
export const createOrder = OrderService.createOrder.bind(OrderService)
export const updateOrderStatus = OrderService.updateOrderStatus.bind(OrderService)
export const markOrderAsPrinted = OrderService.markOrderAsPrinted.bind(OrderService)
export const markOrderAsNotified = OrderService.markOrderAsNotified.bind(OrderService)
export const updateOrder = OrderService.updateOrder.bind(OrderService)
