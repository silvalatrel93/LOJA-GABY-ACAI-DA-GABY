import { createSupabaseClient } from "../supabase-client"
import type { StoreConfig } from "../types"

// Serviço para gerenciar configurações da loja
export const StoreConfigService = {
  // Obter configurações da loja
  async getStoreConfig(): Promise<StoreConfig | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("store_config").select("*").eq("id", "main").single()

    if (error) {
      console.error("Erro ao buscar configurações da loja:", error)
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
    }
  },

  // Salvar configurações da loja
  async saveStoreConfig(config: StoreConfig): Promise<StoreConfig | null> {
    const supabase = createSupabaseClient()

    const configData = {
      id: "main",
      name: config.name,
      logo_url: config.logoUrl,
      delivery_fee: config.deliveryFee,
      is_open: config.isOpen,
      operating_hours: config.operatingHours,
      special_dates: config.specialDates || [],
      last_updated: new Date().toISOString(),
    }

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
    }
  },

  // Verificar se a loja está aberta
  async isStoreOpen(): Promise<boolean> {
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
  },
}

// Exportar funções individuais para facilitar o uso
export const getStoreConfig = StoreConfigService.getStoreConfig.bind(StoreConfigService)
export const saveStoreConfig = StoreConfigService.saveStoreConfig.bind(StoreConfigService)
export const isStoreOpen = StoreConfigService.isStoreOpen.bind(StoreConfigService)
