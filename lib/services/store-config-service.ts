import { createSupabaseClient, testSupabaseConnection } from "../supabase-client"
import type { StoreConfig, OperatingHours, SpecialDate, SupabaseStoreConfig } from "../types"
import type { RealtimeChannel } from '@supabase/supabase-js'

// Configuração padrão para usar como fallback
const DEFAULT_STORE_CONFIG: StoreConfig = {
  id: "main",
  name: "Heai Açai e Sorvetes",
  logoUrl: "",
  deliveryFee: 0,
  maringaDeliveryFee: 0, // Taxa de entrega específica para Maringá
  picoleDeliveryFee: 5.0, // Taxa de entrega específica para picolés
  minimumPicoleOrder: 20.0, // Valor mínimo para isenção da taxa de entrega de picolés
  moreninhaDeliveryFee: 5.0, // Taxa de entrega específica para moreninha
  minimumMoreninhaOrder: 17.0, // Valor mínimo para isenção da taxa de entrega de moreninha
  isOpen: true,
  carousel_initialized: false,
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
  pixKey: "09300021990",
  lastUpdated: new Date().toISOString(),
  maxPicolesPerOrder: 20
}

import { DEFAULT_STORE_ID } from "../constants"

// Serviço para gerenciar configurações da loja
export const StoreConfigService = {
  // Obter configurações da loja
  async getStoreConfig(): Promise<StoreConfig> {
    try {
      // Primeiro, testar a conectividade
      const isConnected = await testSupabaseConnection()
      if (!isConnected) {
        console.warn("Conexão com Supabase falhou, usando configuração padrão")
        return this.getDefaultConfig()
      }

      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from("store_config")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .maybeSingle()

      if (error) {
        console.warn("Erro ao buscar configurações da loja:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })

        // Se o erro for "PGRST116" (nenhum registro encontrado), tentar criar a configuração padrão
        if (error.code === 'PGRST116') {
          console.log("Nenhuma configuração encontrada, tentando criar configuração padrão...")
          const createdConfig = await this.createDefaultStoreConfig()
          if (createdConfig) {
            return createdConfig
          }
        }

        // Caso haja múltiplos registros, buscar o primeiro manualmente
        if (error.details && error.details.includes('multiple')) {
          console.log("Múltiplos registros encontrados, buscando o primeiro...")
          const { data: multipleData, error: limitError } = await supabase
            .from("store_config")
            .select("*")
            .eq("store_id", DEFAULT_STORE_ID)
            .limit(1)

          if (!limitError && multipleData && multipleData.length > 0) {
            const config = multipleData[0] as unknown as SupabaseStoreConfig
            return {
              id: typeof config.id === 'string' ? config.id : 'main',
              name: typeof config.name === 'string' ? config.name : 'Heai Açai e Sorvetes',
              logoUrl: typeof config.logo_url === 'string' ? config.logo_url : '',
              deliveryFee: typeof config.delivery_fee === 'number'
                ? config.delivery_fee
                : Number(config.delivery_fee) || 0,
              maringaDeliveryFee: typeof config.maringa_delivery_fee === 'number'
                ? config.maringa_delivery_fee
                : Number(config.maringa_delivery_fee) || 0,
              picoleDeliveryFee: typeof config.picole_delivery_fee === 'number'
                ? config.picole_delivery_fee
                : Number(config.picole_delivery_fee) || 5.0,
              minimumPicoleOrder: typeof config.minimum_picole_order === 'number'
                ? config.minimum_picole_order
                : Number(config.minimum_picole_order) || 20.0,
              moreninhaDeliveryFee: typeof config.moreninha_delivery_fee === 'number'
                ? config.moreninha_delivery_fee
                : Number(config.moreninha_delivery_fee) || 5.0,
              minimumMoreninhaOrder: typeof config.minimum_moreninha_order === 'number'
                ? config.minimum_moreninha_order
                : Number(config.minimum_moreninha_order) || 17.0,
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
              pixKey: typeof config.pix_key === 'string'
                ? config.pix_key
                : '09300021990',
              lastUpdated: typeof config.last_updated === 'string'
                ? config.last_updated
                : new Date().toISOString(),
              carousel_initialized: typeof config.carousel_initialized === 'boolean'
                ? config.carousel_initialized
                : false,
              maxPicolesPerOrder: typeof config.max_picoles_per_order === 'number'
                ? config.max_picoles_per_order
                : 20,
            }
          }
        }

        console.log("Retornando configuração padrão devido ao erro")
        return this.getDefaultConfig()
      }

      if (!data) {
        console.log("Nenhuma configuração de loja encontrada, tentando criar configuração padrão...")
        const createdConfig = await this.createDefaultStoreConfig()
        if (createdConfig) {
          return createdConfig
        }
        console.log("Retornando configuração padrão")
        return this.getDefaultConfig()
      }

      const config = data as unknown as SupabaseStoreConfig

      // Garantir que temos valores padrão para todos os campos obrigatórios
      return {
        id: typeof config.id === 'string' ? config.id : 'main',
        name: typeof config.name === 'string' ? config.name : 'Heai Açai e Sorvetes',
        logoUrl: typeof config.logo_url === 'string' ? config.logo_url : '',
        deliveryFee: typeof config.delivery_fee === 'number'
          ? config.delivery_fee
          : Number(config.delivery_fee) || 0,
        maringaDeliveryFee: typeof config.maringa_delivery_fee === 'number'
          ? config.maringa_delivery_fee
          : Number(config.maringa_delivery_fee) || 0,
        picoleDeliveryFee: typeof config.picole_delivery_fee === 'number'
          ? config.picole_delivery_fee
          : Number(config.picole_delivery_fee) || 5.0,
        minimumPicoleOrder: typeof config.minimum_picole_order === 'number'
          ? config.minimum_picole_order
          : Number(config.minimum_picole_order) || 20.0,
        moreninhaDeliveryFee: typeof config.moreninha_delivery_fee === 'number'
          ? config.moreninha_delivery_fee
          : Number(config.moreninha_delivery_fee) || 5.0,
        minimumMoreninhaOrder: typeof config.minimum_moreninha_order === 'number'
          ? config.minimum_moreninha_order
          : Number(config.minimum_moreninha_order) || 17.0,
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
        pixKey: typeof config.pix_key === 'string'
          ? config.pix_key
          : '09300021990',
        lastUpdated: typeof config.last_updated === 'string'
          ? config.last_updated
          : new Date().toISOString(),
        carousel_initialized: typeof config.carousel_initialized === 'boolean'
          ? config.carousel_initialized
          : false,
        maxPicolesPerOrder: typeof config.max_picoles_per_order === 'number'
          ? config.max_picoles_per_order
          : 20, // Valor padrão de 20 se não estiver definido
      }
    } catch (error) {
      console.error("Erro inesperado ao buscar configurações da loja:", {
        error: error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      })
      console.log("Retornando configuração padrão devido ao erro inesperado")
      return this.getDefaultConfig()
    }
  },

  // Cria a configuração padrão no banco de dados
  async createDefaultStoreConfig(): Promise<StoreConfig | null> {
    try {
      console.log("Criando/atualizando configuração padrão da loja no banco de dados...")
      const supabase = createSupabaseClient()

      const defaultConfigData = {
        id: 'main',
        store_id: DEFAULT_STORE_ID,
        name: DEFAULT_STORE_CONFIG.name,
        logo_url: DEFAULT_STORE_CONFIG.logoUrl,
        delivery_fee: DEFAULT_STORE_CONFIG.deliveryFee,
        maringa_delivery_fee: DEFAULT_STORE_CONFIG.maringaDeliveryFee,
        picole_delivery_fee: DEFAULT_STORE_CONFIG.picoleDeliveryFee,
        minimum_picole_order: DEFAULT_STORE_CONFIG.minimumPicoleOrder,
        moreninha_delivery_fee: DEFAULT_STORE_CONFIG.moreninhaDeliveryFee,
        minimum_moreninha_order: DEFAULT_STORE_CONFIG.minimumMoreninhaOrder,
        is_open: DEFAULT_STORE_CONFIG.isOpen,
        operating_hours: DEFAULT_STORE_CONFIG.operatingHours,
        special_dates: DEFAULT_STORE_CONFIG.specialDates,
        whatsapp_number: DEFAULT_STORE_CONFIG.whatsappNumber,
        pix_key: DEFAULT_STORE_CONFIG.pixKey,
        last_updated: new Date().toISOString(),
        carousel_initialized: DEFAULT_STORE_CONFIG.carousel_initialized,
        max_picoles_per_order: DEFAULT_STORE_CONFIG.maxPicolesPerOrder
      }

      const { data, error } = await supabase
        .from("store_config")
        .upsert(defaultConfigData)
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar configuração padrão:", {
          message: error.message,
          code: error.code,
          details: error.details
        })
        return null
      }

      if (data) {
        console.log("Configuração padrão criada/atualizada com sucesso!")
        return DEFAULT_STORE_CONFIG
      }

      return null
    } catch (error) {
      console.error("Erro ao criar configuração padrão da loja:", error)
      return null
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
        name: typeof config.name === 'string' && config.name.trim() ? config.name : 'Heai Açai e Sorvetes',
        logoUrl: typeof config.logoUrl === 'string' ? config.logoUrl : '',
        deliveryFee: typeof config.deliveryFee === 'number' ? config.deliveryFee : 0,
        maringaDeliveryFee: typeof config.maringaDeliveryFee === 'number' ? config.maringaDeliveryFee : 0,
        picoleDeliveryFee: typeof config.picoleDeliveryFee === 'number' ? config.picoleDeliveryFee : 5.0,
        minimumPicoleOrder: typeof config.minimumPicoleOrder === 'number' ? config.minimumPicoleOrder : 20.0,
        moreninhaDeliveryFee: typeof config.moreninhaDeliveryFee === 'number' ? config.moreninhaDeliveryFee : 5.0,
        minimumMoreninhaOrder: typeof config.minimumMoreninhaOrder === 'number' ? config.minimumMoreninhaOrder : 17.0,
        isOpen: Boolean(config.isOpen),
        maxPicolesPerOrder: typeof config.maxPicolesPerOrder === 'number' ? config.maxPicolesPerOrder : 20,
        operatingHours: config.operatingHours && typeof config.operatingHours === 'object'
          ? config.operatingHours
          : {},
        specialDates: Array.isArray(config.specialDates) ? config.specialDates : [],
        whatsappNumber: typeof config.whatsappNumber === 'string' ? config.whatsappNumber : '',
        pixKey: typeof config.pixKey === 'string' ? config.pixKey : '09300021990',
        lastUpdated: new Date().toISOString(),
        carousel_initialized: Boolean(config.carousel_initialized) ?? false,
      }

      console.log("Configurações validadas:", validatedConfig)

      // Preparar os dados para salvar no formato do Supabase
      const configData: Omit<SupabaseStoreConfig, 'store_id' | 'id'> = {
        name: validatedConfig.name,
        logo_url: validatedConfig.logoUrl || '', // Garante que seja string
        delivery_fee: validatedConfig.deliveryFee,
        maringa_delivery_fee: validatedConfig.maringaDeliveryFee,
        picole_delivery_fee: validatedConfig.picoleDeliveryFee,
        minimum_picole_order: validatedConfig.minimumPicoleOrder,
        moreninha_delivery_fee: validatedConfig.moreninhaDeliveryFee,
        minimum_moreninha_order: validatedConfig.minimumMoreninhaOrder,
        is_open: validatedConfig.isOpen,
        operating_hours: validatedConfig.operatingHours,
        special_dates: validatedConfig.specialDates || [], // Garante um array vazio se for undefined
        whatsapp_number: validatedConfig.whatsappNumber, // Pode ser undefined
        pix_key: validatedConfig.pixKey || '09300021990', // Adiciona a chave PIX
        last_updated: validatedConfig.lastUpdated || new Date().toISOString(), // Garante uma data válida
        carousel_initialized: validatedConfig.carousel_initialized ?? false, // Controle de inicialização do carrossel
        max_picoles_per_order: typeof config.maxPicolesPerOrder === 'number'
          ? config.maxPicolesPerOrder
          : 20, // Valor padrão de 20 se não estiver definido
      }


      // Usar o ID da configuração existente ou 'main' como fallback
      const configId = validatedConfig.id

      // Preparar dados finais para o upsert
      const finalData = {
        ...configData,
        id: configId,
        store_id: DEFAULT_STORE_ID
      };

      console.log("Dados finais para upsert:", { id: finalData.id, name: (finalData as any).name || 'N/A' })

      // Atualizar ou inserir os dados no Supabase
      const { data, error } = await supabase
        .from("store_config")
        .upsert(finalData)
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
        maringaDeliveryFee: typeof savedConfig.maringa_delivery_fee === 'number'
          ? savedConfig.maringa_delivery_fee
          : Number(savedConfig.maringa_delivery_fee) || 8.0,
        picoleDeliveryFee: typeof savedConfig.picole_delivery_fee === 'number'
          ? savedConfig.picole_delivery_fee
          : Number(savedConfig.picole_delivery_fee) || 5.0,
        minimumPicoleOrder: typeof savedConfig.minimum_picole_order === 'number'
          ? savedConfig.minimum_picole_order
          : Number(savedConfig.minimum_picole_order) || 20.0,
        moreninhaDeliveryFee: typeof savedConfig.moreninha_delivery_fee === 'number'
          ? savedConfig.moreninha_delivery_fee
          : Number(savedConfig.moreninha_delivery_fee) || 5.0,
        minimumMoreninhaOrder: typeof savedConfig.minimum_moreninha_order === 'number'
          ? savedConfig.minimum_moreninha_order
          : Number(savedConfig.minimum_moreninha_order) || 17.0,
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
        maxPicolesPerOrder: typeof savedConfig.max_picoles_per_order === 'number'
          ? savedConfig.max_picoles_per_order
          : 20, // Valor padrão de 20 se não estiver definido
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
        // Verificar se o status é de sucesso ou erro
        if (status === 'SUBSCRIBED') {
          console.log('Conexão em tempo real estabelecida com sucesso')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Erro na conexão em tempo real:', status)
          if (onError) {
            onError(new Error('Erro na conexão em tempo real'))
          }
        } else if (status === 'TIMED_OUT') {
          console.warn('Conexão em tempo real expirou')
        } else {
          console.log('Status da subscrição:', status)
        }
      })

      // Configurar o handler de erros do sistema
      channel.on('system', { event: 'error' }, (payload: any) => {
        // Verificar se é realmente um erro ou apenas uma mensagem informativa
        // Muitas vezes o Supabase envia mensagens de status que não são erros reais
        if (payload && payload.status === 'ok') {
          console.log('Evento do sistema recebido (não é um erro):', payload)
        } else if (payload) {
          console.warn('Mensagem do sistema recebida:', payload)
          // Não tratamos isso como erro, pois muitas vezes são apenas mensagens informativas
        }
      })

      return channel
    } catch (error) {
      console.error('Erro ao configurar subscrição de status da loja:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error('Erro desconhecido na subscrição'))
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
