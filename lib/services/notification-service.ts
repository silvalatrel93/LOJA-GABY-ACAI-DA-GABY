import { createSupabaseClient } from "@/lib/supabase-client"
import type { Notification } from "@/lib/types"

export const NotificationService = {
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar todas as notificações:", error)
        return []
      }

      return (data || []).map((notification: any) => ({
        id: Number(notification.id),
        title: String(notification.title),
        message: String(notification.message),
        type: String(notification.type),
        active: Boolean(notification.active),
        startDate: new Date(String(notification.start_date)),
        endDate: new Date(String(notification.end_date)),
        priority: Number(notification.priority),
        read: Boolean(notification.read),
        createdAt: notification.created_at ? new Date(String(notification.created_at)) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar todas as notificações:", error)
      return []
    }
  },

  async getActiveNotifications(): Promise<Notification[]> {
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
        console.error("Erro ao buscar notificações:", error)
        return []
      }

      return (data || []).map((notification: any) => ({
        id: Number(notification.id),
        title: String(notification.title),
        message: String(notification.message),
        type: String(notification.type),
        active: Boolean(notification.active),
        startDate: new Date(String(notification.start_date)),
        endDate: new Date(String(notification.end_date)),
        priority: Number(notification.priority),
        read: Boolean(notification.read),
        createdAt: notification.created_at ? new Date(String(notification.created_at)) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
      return []
    }
  },

  async markAsRead(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)

      if (error) {
        console.error("Erro ao marcar notificação como lida:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      return false
    }
  },

  async saveNotification(notification: Partial<Notification>): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      const notificationData = {
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        active: notification.active ?? true,
        start_date: notification.startDate ? notification.startDate.toISOString() : new Date().toISOString(),
        end_date: notification.endDate ? notification.endDate.toISOString() : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: notification.priority ?? 1,
        read: notification.read ?? false
      }

      if (notification.id) {
        // Atualizar notificação existente
        const { error } = await supabase
          .from("notifications")
          .update(notificationData)
          .eq("id", notification.id)

        if (error) {
          console.error("Erro ao atualizar notificação:", error)
          return false
        }
      } else {
        // Criar nova notificação
        const { error } = await supabase
          .from("notifications")
          .insert(notificationData)

        if (error) {
          console.error("Erro ao criar notificação:", error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Erro ao salvar notificação:", error)
      return false
    }
  },

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Erro ao deletar notificação:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao deletar notificação:", error)
      return false
    }
  },

  async createOrderNotification(order: any): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      
      // Determinar o tipo de pedido
      const orderType = order.orderType === 'table' ? 'mesa' : 'delivery'
      const tableInfo = order.tableId ? ` - ${order.tableName || `Mesa ${order.tableId}`}` : ''
      
      // Criar notificação no banco
      const notification: Omit<Notification, "id"> = {
        title: `Novo Pedido ${orderType === 'mesa' ? 'de Mesa' : 'Delivery'}`,
        message: `Pedido #${order.id} - ${order.customerName}${tableInfo} - ${formatCurrency(order.total)}`,
        type: "alert",
        active: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        priority: 10,
        read: false,
        createdAt: new Date()
      }

      const { data, error } = await supabase
        .from("notifications")
        .insert({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          active: notification.active,
          start_date: notification.startDate.toISOString(),
          end_date: notification.endDate.toISOString(),
          priority: notification.priority,
          read: notification.read,
          created_at: notification.createdAt?.toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar notificação de pedido:", error)
        return false
      }

      // Enviar push notification para administradores
      await this.sendPushNotificationToAdmins({
        title: notification.title,
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: {
          orderId: order.id,
          orderType: orderType,
          url: orderType === 'mesa' ? '/admin/pedidos-mesa' : '/admin/pedidos'
        }
      })

      return true
    } catch (error) {
      console.error("Erro ao criar notificação de pedido:", error)
      return false
    }
  },

  async sendPushNotificationToAdmins(payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: any
  }): Promise<void> {
    try {
      const supabase = createSupabaseClient()

      // Obter todas as assinaturas push dos administradores
      // Para o MVP, vamos assumir que todas as assinaturas são de administradores
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('subscription')

      if (error) {
        console.error("Erro ao buscar assinaturas push:", error)
        return
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log("Nenhuma assinatura push encontrada")
        return
      }

      // Enviar notificação para cada assinatura
      const sendPromises = subscriptions.map(async (sub) => {
        try {
          const response = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscription: sub.subscription,
              payload: {
                title: payload.title,
                body: payload.body,
                icon: payload.icon || '/icons/icon-192x192.png',
                badge: payload.badge || '/icons/icon-96x96.png',
                data: payload.data || {}
              }
            }),
          })

          if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`)
          }

          return true
        } catch (error) {
          console.error("Erro ao enviar push notification:", error)
          return false
        }
      })

      const results = await Promise.allSettled(sendPromises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length
      const failed = results.length - successful

      console.log(`Push notifications enviadas: ${successful} sucessos, ${failed} falhas`)
    } catch (error) {
      console.error("Erro ao enviar push notifications para admins:", error)
    }
  }
}

// Função helper para formatação de moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
