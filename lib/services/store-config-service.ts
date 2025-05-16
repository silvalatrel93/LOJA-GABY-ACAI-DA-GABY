import { createSupabaseClient } from "../supabase-client"
import type { StoreConfig, OperatingHours, SpecialDate } from "../types"
import type { RealtimeChannel } from '@supabase/supabase-js'

// Interface para tipar os dados do Supabase
interface SupabaseStoreConfig {
  id: string
  store_id: string
  name: string
  logo_url: string | null
  delivery_fee: number
  is_open: boolean
  operating_hours: OperatingHours
  special_dates: SpecialDate[]
  whatsapp_number: string | null
  last_updated: string
}

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
  whatsappNumber: "5511999999999",
  lastUpdated: new Date().toISOString()
}

// ID da loja padrão (Loja Principal)
const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000000"

// Serviço para gerenciar configurações da loja
export const StoreConfigService = {
  // Obter configurações da loja
  async getStoreConfig(): Promise<StoreConfig> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("store_config")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .single()

      if (error) {
        console.error("Erro ao buscar configurações da loja:", error)
        return this.getDefaultConfig()
      }

      if (!data) {
        console.log("Nenhuma configuração de loja encontrada, retornando padrão")
        return this.getDefaultConfig()
      }

      const config = data as unknown as SupabaseStoreConfig
      
      // Garantir que temos valores padrão para todos os campos obrigatórios
      return {
        id: typeof config.id === 'string' ? config.id : 'main',
        name: typeof config.name === 'string' ? config.name : 'Loja',
        logoUrl: typeof config.logo_url === 'string' ? config.logo_url : '',
        deliveryFee: typeof config.delivery_fee === 'number' 
          ? config.delivery_fee 
          : Number(config.delivery_fee) || 0,
        isOpen: Boolean(config.is_open),
        operatingHours: config.operating_hours && typeof config.operating_hours === 'object'
          ? config.operating_hours 
          : {},
        specialDates: Array.isArray(config.special_dates) 
          ? config.special_dates 
          : [],
        whatsappNumber: typeof config.whatsapp_number === 'string' 
          ? config.whatsapp_number 
          : '5511999999999',
        lastUpdated: typeof config.last_updated === 'string' 
          ? config.last_updated 
          : new Date().toISOString(),
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
  async saveStoreConfig(config: Partial<StoreConfig>): Promise<StoreConfig | null> {
    try {
      console.log("Iniciando salvamento das configurações da loja:", config)
      const supabase = createSupabaseClient()

      // Validar e padronizar os dados de entrada
      const validatedConfig: StoreConfig = {
        id: typeof config.id === 'string' && config.id.trim() ? config.id : 'main',
        name: typeof config.name === 'string' && config.name.trim() ? config.name : 'Loja',
        logoUrl: typeof config.logoUrl === 'string' ? config.logoUrl : '/acai-logo.png',
        deliveryFee: typeof config.deliveryFee === 'number' ? config.deliveryFee : 0,
        isOpen: Boolean(config.isOpen),
        operatingHours: config.operatingHours && typeof config.operatingHours === 'object' 
          ? config.operatingHours 
          : {},
        specialDates: Array.isArray(config.specialDates) ? config.specialDates : [],
        whatsappNumber: typeof config.whatsappNumber === 'string' ? config.whatsappNumber : '',
        lastUpdated: new Date().toISOString()
      }

      console.log("Configurações validadas:", validatedConfig)

      // Preparar os dados para salvar no formato do Supabase
      const configData: Omit<SupabaseStoreConfig, 'store_id' | 'id'> = {
        name: validatedConfig.name,
        logo_url: validatedConfig.logoUrl || null, // Pode ser undefined no StoreConfig
        delivery_fee: validatedConfig.deliveryFee,
        is_open: validatedConfig.isOpen,
        operating_hours: validatedConfig.operatingHours,
        special_dates: validatedConfig.specialDates || [], // Garante um array vazio se for undefined
        whatsapp_number: validatedConfig.whatsappNumber || null, // Garante que seja string | null
        last_updated: validatedConfig.lastUpdated || new Date().toISOString(), // Garante uma data válida
      }


      // Usar o ID da configuração existente ou 'main' como fallback
      const configId = validatedConfig.id

      // Atualizar ou inserir os dados no Supabase
      const { data, error } = await supabase
        .from("store_config")
        .upsert({ 
          ...configData, 
          id: configId,
          store_id: DEFAULT_STORE_ID 
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao salvar configurações da loja:", error)
        throw error
      }

      if (!data) {
        console.error("Nenhum dado retornado ao salvar configurações da loja")
        return null
      }

      // Converter os dados do formato do Supabase para o formato da aplicação
      const savedConfig = data as unknown as SupabaseStoreConfig
      
      // Garantir que temos valores padrão para todos os campos obrigatórios
      const result: StoreConfig = {
        id: typeof savedConfig.id === 'string' ? savedConfig.id : 'main',
        name: typeof savedConfig.name === 'string' ? savedConfig.name : 'Loja',
        logoUrl: typeof savedConfig.logo_url === 'string' ? savedConfig.logo_url : '',
        deliveryFee: typeof savedConfig.delivery_fee === 'number' 
          ? savedConfig.delivery_fee 
          : Number(savedConfig.delivery_fee) || 0,
        isOpen: Boolean(savedConfig.is_open),
        operatingHours: savedConfig.operating_hours && typeof savedConfig.operating_hours === 'object'
          ? savedConfig.operating_hours 
          : {},
        specialDates: Array.isArray(savedConfig.special_dates) 
          ? savedConfig.special_dates 
          : [],
        whatsappNumber: typeof savedConfig.whatsapp_number === 'string' 
          ? savedConfig.whatsapp_number 
          : '',
        lastUpdated: typeof savedConfig.last_updated === 'string' 
          ? savedConfig.last_updated 
          : new Date().toISOString(),
      }

      return result
    } catch (error) {
      console.error("Erro ao salvar configurações da loja:", error)
      return null
    }
  },

  // Verificar se a loja está aberta
  async isStoreOpen(): Promise<boolean> {
    try {
      const config = await this.getStoreConfig()
      
      // Se não houver configuração ou a loja estiver fechada, retornar falso
      if (!config || !config.isOpen) {
        console.log('Loja fechada: sem configuração ou isOpen = false')
        return false
      }

      // Verificar horário de funcionamento
      const now = new Date()
      const dayOfWeek = now.toLocaleDateString("pt-BR", { 
        weekday: "long",
        timeZone: 'America/Sao_Paulo' // Garantir o fuso horário correto
      }).toLowerCase()

      // Verificar configuração do dia da semana
      const dayConfig = config.operatingHours && typeof config.operatingHours === 'object'
        ? config.operatingHours[dayOfWeek]
        : null
      
      if (!dayConfig || !dayConfig.open) {
        console.log(`Loja fechada: sem configuração para ${dayOfWeek} ou dia fechado`)
        return false
      }

      // Verificar se o formato das horas está correto
      if (typeof dayConfig.hours !== 'string') {
        console.log('Formato de horas inválido:', dayConfig.hours)
        return false
      }

      const hours = dayConfig.hours.split(" - ")
      if (hours.length !== 2) {
        console.log('Formato de horário inválido. Esperado: "HH:MM - HH:MM"')
        return false
      }

      const [openTime, closeTime] = hours
      
      // Converter horários para minutos
      const parseTime = (timeStr: string): number | null => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return null
        }
        return hours * 60 + minutes
      }

      const openTimeInMinutes = parseTime(openTime)
      const closeTimeInMinutes = parseTime(closeTime)
      
      if (openTimeInMinutes === null || closeTimeInMinutes === null) {
        console.log('Horário de funcionamento inválido')
        return false
      }

      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute

      // Verificar se o horário atual está dentro do horário de funcionamento
      const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes <= closeTimeInMinutes
      
      if (!isOpen) {
        console.log(`Fora do horário de funcionamento. Aberto das ${openTime} às ${closeTime}`)
      }
      
      return isOpen
    } catch (error) {
      console.error("Erro ao verificar status da loja:", error)
      return true // Em caso de erro, assume que a loja está aberta para não impedir vendas
    }
  },

  // Subscrição em tempo real para status da loja
  subscribeToStoreStatus(
    onStatusChange: (isOpen: boolean) => void,
    onError?: (error: Error) => void
  ): RealtimeChannel | null {
    try {
      const supabase = createSupabaseClient()
      
      // Configurar o canal para escutar mudanças no status da loja
      const channel = supabase.channel('store_status')
      
      // Configurar o handler para mudanças no banco de dados
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_config',
          filter: `store_id=eq.${DEFAULT_STORE_ID}`
        },
        (payload: any) => {
          console.log('Change received!', payload)
          const newStatus = payload.new?.is_open
          if (typeof newStatus === 'boolean') {
            onStatusChange(newStatus)
          }
        }
      )
      
      // Inscrever no canal
      channel.subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'CHANNEL_ERROR' && onError) {
          onError(new Error('Erro na conexão em tempo real'))
        }
      })
      
      // Configurar o handler de erros do sistema
      channel.on('system', { event: 'error' }, (payload: any) => {
        console.error('Erro no canal:', payload)
        if (onError) {
          onError(new Error(`Erro no canal: ${payload.message || 'Erro desconhecido'}`))
        }
      })

      return channel
    } catch (error) {
      console.error('Erro ao se inscrever para atualizações de status da loja:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)))
      }
      return null
    }
  },

  // Desinscrever do canal em tempo real
  unsubscribeFromStoreStatus(channel: RealtimeChannel | null | undefined): void {
    try {
      // Verificar se o canal é válido antes de tentar desinscrever
      if (!channel) {
        console.warn('Tentativa de desinscrever de um canal nulo ou indefinido')
        return
      }

      // Verificar se o canal tem o método unsubscribe
      if (typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
        console.log('Desinscrito das atualizações de status da loja')
      } else {
        console.warn('O objeto do canal não possui um método unsubscribe válido')
      }
    } catch (error) {
      console.error('Erro ao desinscrever do canal:', error)
      // Em ambiente de desenvolvimento, podemos relançar o erro para depuração
      if (process.env.NODE_ENV === 'development') {
        throw error
      }
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getStoreConfig = StoreConfigService.getStoreConfig.bind(StoreConfigService)
export const saveStoreConfig = StoreConfigService.saveStoreConfig.bind(StoreConfigService)
export const isStoreOpen = StoreConfigService.isStoreOpen.bind(StoreConfigService)
export const subscribeToStoreStatus = StoreConfigService.subscribeToStoreStatus.bind(StoreConfigService)
export const unsubscribeFromStoreStatus = StoreConfigService.unsubscribeFromStoreStatus.bind(StoreConfigService)

// Exportar tipos para uso externo
export type { StoreConfig, OperatingHours, SpecialDate } from "../types"
