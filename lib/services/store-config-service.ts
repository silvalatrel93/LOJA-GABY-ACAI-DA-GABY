import { createSupabaseClient } from "../supabase-client"
import type { StoreConfig } from "../types"
import type { RealtimeChannel } from '@supabase/supabase-js'

// Configuração padrão para usar como fallback
const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: "main",
  name: "Açaí Online",
  logoUrl: "/acai-logo.png",
  deliveryFee: 5.0,
  isOpen: true,
  operatingHours: {
    "segunda-feira": { open: true, hours: "10:00 - 22:00" },
    "terça-feira": { open: true, hours: "10:00 - 22:00" },
    "quarta-feira": { open: true, hours: "10:00 - 22:00" },
    "quinta-feira": { open: true, hours: "10:00 - 22:00" },
    "sexta-feira": { open: true, hours: "10:00 - 22:00" },
    sábado: { open: true, hours: "10:00 - 22:00" },
    domingo: { open: true, hours: "10:00 - 22:00" },
  },
  specialDates: [],
}

// ID da loja padrão (Loja Principal)
const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000000"

// Serviço para gerenciar configurações da loja
export const StoreConfigService = {
  // Obter configurações da loja
  async getStoreConfig(): Promise<StoreConfig> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.from("store_config").select("*").eq("store_id", DEFAULT_STORE_ID).single()

      if (error) {
        console.error("Erro ao buscar configurações da loja:", error)
        return this.getDefaultConfig()
      }

      return {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url || "",
        deliveryFee: Number(data.delivery_fee),
        isOpen: data.is_open,
        operatingHours: data.operating_hours,
        specialDates: data.special_dates || [],
        whatsappNumber: data.whatsapp_number || "5511999999999",
        lastUpdated: data.last_updated,
      }
    } catch (error) {
      console.error("Erro ao buscar configurações da loja:", error)
      return this.getDefaultConfig()
    }
  },

  // Retorna a configuração padrão
  getDefaultConfig(): StoreConfig {
    return DEFAULT_STORE_CONFIG
  },

  // Salvar configurações da loja
  async saveStoreConfig(config: StoreConfig): Promise<StoreConfig | null> {
    try {
      console.log("Salvando configurações da loja:", config)
      const supabase = createSupabaseClient()

      const configData = {
        id: "main",
        store_id: DEFAULT_STORE_ID, // Adicionando o store_id
        name: config.name,
        logo_url: config.logoUrl,
        delivery_fee: config.deliveryFee,
        is_open: config.isOpen,
        operating_hours: config.operatingHours,
        special_dates: config.specialDates || [],
        whatsapp_number: config.whatsappNumber || "", // Adicionando o número de WhatsApp
        last_updated: new Date().toISOString(),
      }

      console.log("Dados a serem salvos:", configData)

      const { data, error } = await supabase.from("store_config").upsert(configData).select().single()

      if (error) {
        console.error("Erro ao salvar configurações da loja:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        logoUrl: data.logo_url || "",
        deliveryFee: Number(data.delivery_fee),
        isOpen: data.is_open,
        operatingHours: data.operating_hours,
        specialDates: data.special_dates || [],
        whatsappNumber: data.whatsapp_number || "5511999999999",
        lastUpdated: data.last_updated,
      }
    } catch (error) {
      console.error("Erro ao salvar configurações da loja:", error)
      return null
    }
  },

  // Verificar se a loja está aberta
  async isStoreOpen(): Promise<boolean> {
    try {
      const config = await this.getStoreConfig()
      if (!config) return false

      if (!config.isOpen) return false

      // Verificar horário de funcionamento
      const now = new Date()
      const dayOfWeek = now.toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase()

      const dayConfig = config.operatingHours[dayOfWeek]
      if (!dayConfig || !dayConfig.open) return false

      // Verificar se está dentro do horário de funcionamento
      const hours = dayConfig.hours.split(" - ")
      if (hours.length !== 2) return false

      const [openTime, closeTime] = hours
      const [openHour, openMinute] = openTime.split(":").map(Number)
      const [closeHour, closeMinute] = closeTime.split(":").map(Number)

      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      const currentTimeInMinutes = currentHour * 60 + currentMinute
      const openTimeInMinutes = openHour * 60 + openMinute
      const closeTimeInMinutes = closeHour * 60 + closeMinute

      return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes
    } catch (error) {
      console.error("Erro ao verificar status da loja:", error)
      return true // Em caso de erro, assume que a loja está aberta para não impedir vendas
    }
  },

  // Subscrição em tempo real para status da loja
  subscribeToStoreStatus(
    onStatusChange: (isOpen: boolean) => void,
    onError?: (error: any) => void
  ): RealtimeChannel | null {
    try {
      const supabase = createSupabaseClient()
      
      const channel = supabase
        .channel('store_status')
        .on(
          'postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'store_config',
            filter: `store_id=eq.${DEFAULT_STORE_ID}`
          },
          (payload) => {
            const newIsOpen = payload.new.is_open
            onStatusChange(newIsOpen)
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to store status updates')
          }
        })

      if (onError) {
        channel.on('error', onError)
      }

      return channel
    } catch (error) {
      console.error('Erro ao criar subscrição em tempo real:', error)
      return null
    }
  },

  // Desinscrever do canal em tempo real
  unsubscribeFromStoreStatus(channel: RealtimeChannel) {
    try {
      channel.unsubscribe()
      console.log('Unsubscribed from store status updates')
    } catch (error) {
      console.error('Erro ao desinscrever do canal:', error)
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getStoreConfig = StoreConfigService.getStoreConfig.bind(StoreConfigService)
export const saveStoreConfig = StoreConfigService.saveStoreConfig.bind(StoreConfigService)
export const isStoreOpen = StoreConfigService.isStoreOpen.bind(StoreConfigService)
