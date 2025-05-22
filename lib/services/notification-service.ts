import { createSupabaseClient } from "../supabase-client"
import type { Notification } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import { safelyGetRecordById } from "../supabase-utils"

// Serviço para gerenciar notificações
export const NotificationService = {
  // Obter todas as notificações
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar notificações:", error)
        return []
      }

      if (!data || !Array.isArray(data)) {
        console.error("Dados de notificações inválidos:", data)
        return []
      }

      return data.map((item) => ({
        id: Number(item.id),
        title: String(item.title || ""),
        message: String(item.message || ""),
        type: String(item.type || ""),
        active: Boolean(item.active),
        startDate: new Date(String(item.start_date)),
        endDate: new Date(String(item.end_date)),
        priority: Number(item.priority),
        read: Boolean(item.read),
        createdAt: new Date(String(item.created_at)),
      }))
    } catch (error) {
      console.error("Erro inesperado ao buscar notificações:", error)
      return []
    }
  },

  // Obter notificações ativas
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
        .eq("store_id", DEFAULT_STORE_ID)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar notificações ativas:", error)
        return []
      }

      if (!data || !Array.isArray(data)) {
        console.error("Dados de notificações inválidos:", data)
        return []
      }

      return data.map((item) => ({
        id: Number(item.id),
        title: String(item.title || ""),
        message: String(item.message || ""),
        type: String(item.type || ""),
        active: Boolean(item.active),
        startDate: new Date(String(item.start_date)),
        endDate: new Date(String(item.end_date)),
        priority: Number(item.priority),
        read: Boolean(item.read),
        createdAt: new Date(String(item.created_at)),
      }))
    } catch (error) {
      console.error("Erro inesperado ao buscar notificações ativas:", error)
      return []
    }
  },

  // Obter notificações não lidas
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const supabase = createSupabaseClient()
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("active", true)
        .eq("read", false)
        .eq("store_id", DEFAULT_STORE_ID)
        .lte("start_date", now)
        .gte("end_date", now)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar notificações não lidas:", error)
        return []
      }

      if (!data || !Array.isArray(data)) {
        console.error("Dados de notificações não lidas inválidos:", data)
        return []
      }

      return data.map((item) => ({
        id: Number(item.id),
        title: String(item.title || ""),
        message: String(item.message || ""),
        type: String(item.type || ""),
        active: Boolean(item.active),
        startDate: new Date(String(item.start_date)),
        endDate: new Date(String(item.end_date)),
        priority: Number(item.priority),
        read: Boolean(item.read),
        createdAt: new Date(String(item.created_at)),
      }))
    } catch (error) {
      console.error("Erro inesperado ao buscar notificações não lidas:", error)
      return []
    }
  },
  
  // Obter notificação por ID
  async getNotificationById(id: number): Promise<Notification | null> {
    if (!id || isNaN(id)) {
      console.error(`ID inválido para busca de notificação: ${id}`)
      return null
    }
    
    const supabase = createSupabaseClient()
    // Usar a função segura para evitar o erro PGRST116
    const { data, error } = await safelyGetRecordById<any>(supabase, "notifications", "id", id)

    if (error) {
      console.error("Erro ao buscar notificação por ID:", error)
      return null
    }
    
    if (!data) {
      console.log(`Notificação com ID ${id} não encontrada`)
      return null
    }

    return {
      id: data.id as number,
      title: data.title as string,
      message: data.message as string,
      type: data.type as string,
      active: data.active as boolean,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      priority: data.priority as number,
      read: data.read as boolean,
      createdAt: new Date(data.created_at),
    }
  },

  // Salvar notificação
  async saveNotification(notification: Notification): Promise<Notification | null> {
    const supabase = createSupabaseClient()

    const notificationData: any = {
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
      store_id: DEFAULT_STORE_ID // Adicionar o ID da loja padrão
    }

    let result

    if (notification.id) {
      // Atualizar notificação existente
      const { error: updateError } = await supabase
        .from("notifications")
        .update(notificationData)
        .eq("id", notification.id)
        .eq("store_id", DEFAULT_STORE_ID)
      
      if (updateError) {
        console.error("Erro ao atualizar notificação:", updateError)
        return null
      }
      
      // Buscar a notificação atualizada usando a função segura
      const { data, error } = await safelyGetRecordById<any>(supabase, "notifications", "id", notification.id)
      
      if (error || !data) {
        console.error("Erro ao buscar notificação atualizada:", error)
        return null
      }
      
      result = { data: [data], error: null }
    } else {
      // O store_id já foi adicionado ao objeto notificationData
      
      // Criar nova notificação
      const { error: insertError, data: insertedData } = await supabase
        .from("notifications")
        .insert(notificationData)
        .select()
      
      if (insertError || !insertedData || insertedData.length === 0) {
        console.error("Erro ao criar notificação:", insertError)
        return null
      }
      
      result = { data: insertedData, error: null }
    }

    if (result.error) {
      console.error("Erro ao salvar notificação:", result.error)
      return null
    }

    const data = result.data[0] || result.data

    return {
      id: Number(data.id),
      title: String(data.title || ""),
      message: String(data.message || ""),
      type: String(data.type || ""),
      active: Boolean(data.active),
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      priority: Number(data.priority),
      read: Boolean(data.read),
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
export const getNotificationById = NotificationService.getNotificationById.bind(NotificationService)
export const saveNotification = NotificationService.saveNotification.bind(NotificationService)
export const markAsRead = NotificationService.markAsRead.bind(NotificationService)
export const markAllAsRead = NotificationService.markAllAsRead.bind(NotificationService)
export const deleteNotification = NotificationService.deleteNotification.bind(NotificationService)
