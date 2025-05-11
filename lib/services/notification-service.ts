import { createSupabaseClient } from "../supabase-client"
import type { Notification } from "../types"

// Serviço para gerenciar notificações
export const NotificationService = {
  // Obter todas as notificações
  async getAllNotifications(): Promise<Notification[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar notificações:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      active: item.active,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      priority: item.priority,
      read: item.read,
      createdAt: new Date(item.created_at),
    }))
  },

  // Obter notificações ativas
  async getActiveNotifications(): Promise<Notification[]> {
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
      console.error("Erro ao buscar notificações ativas:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      active: item.active,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      priority: item.priority,
      read: item.read,
      createdAt: new Date(item.created_at),
    }))
  },

  // Obter notificações não lidas
  async getUnreadNotifications(): Promise<Notification[]> {
    const supabase = createSupabaseClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("active", true)
      .eq("read", false)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar notificações não lidas:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      active: item.active,
      startDate: new Date(item.start_date),
      endDate: new Date(item.end_date),
      priority: item.priority,
      read: item.read,
      createdAt: new Date(item.created_at),
    }))
  },

  // Salvar notificação
  async saveNotification(notification: Notification): Promise<Notification | null> {
    const supabase = createSupabaseClient()

    const notificationData = {
      id: notification.id || undefined,
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

    let result

    if (notification.id) {
      // Atualizar notificação existente
      result = await supabase.from("notifications").update(notificationData).eq("id", notification.id).select().single()
    } else {
      // Criar nova notificação
      delete notificationData.id // Remover ID para que o banco gere um novo
      result = await supabase.from("notifications").insert(notificationData).select().single()
    }

    if (result.error) {
      console.error("Erro ao salvar notificação:", result.error)
      return null
    }

    const data = result.data

    return {
      id: data.id,
      title: data.title,
      message: data.message,
      type: data.type,
      active: data.active,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      priority: data.priority,
      read: data.read,
      createdAt: new Date(data.created_at),
    }
  },

  // Marcar notificação como lida
  async markAsRead(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

    if (error) {
      console.error(`Erro ao marcar notificação ${id} como lida:`, error)
      return false
    }

    return true
  },

  // Marcar todas as notificações como lidas
  async markAllAsRead(): Promise<boolean> {
    const supabase = createSupabaseClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("active", true)
      .eq("read", false)
      .lte("start_date", now)
      .gte("end_date", now)

    if (error) {
      console.error("Erro ao marcar todas as notificações como lidas:", error)
      return false
    }

    return true
  },

  // Excluir notificação
  async deleteNotification(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir notificação ${id}:`, error)
      return false
    }

    return true
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllNotifications = NotificationService.getAllNotifications.bind(NotificationService)
export const getActiveNotifications = NotificationService.getActiveNotifications.bind(NotificationService)
export const getUnreadNotifications = NotificationService.getUnreadNotifications.bind(NotificationService)
export const saveNotification = NotificationService.saveNotification.bind(NotificationService)
export const markAsRead = NotificationService.markAsRead.bind(NotificationService)
export const markAllAsRead = NotificationService.markAllAsRead.bind(NotificationService)
export const deleteNotification = NotificationService.deleteNotification.bind(NotificationService)
