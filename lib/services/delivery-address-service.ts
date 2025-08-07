import { createClient } from '@supabase/supabase-js'

// Função para criar cliente administrativo do Supabase
function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas para admin')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface DeliveryAddress {
  id: number
  address: string
  number: string | null
  neighborhood: string | null
  city: string
  delivery_fee: number
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateDeliveryAddressData {
  address: string
  number?: string
  neighborhood?: string
  city: string
  delivery_fee: number
  is_active?: boolean
  notes?: string
}

export interface UpdateDeliveryAddressData extends Partial<CreateDeliveryAddressData> {
  id: number
}

/**
 * Busca um endereço de entrega pelo endereço exato
 * @param address - Endereço para buscar
 * @returns Endereço encontrado ou null
 */
export async function findDeliveryAddressByAddress(address: string): Promise<DeliveryAddress | null> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('address', address.trim())
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum resultado encontrado
        return null
      }
      console.error('Erro ao buscar endereço:', error)
      throw new Error('Erro ao buscar endereço de entrega')
    }

    return data
  } catch (error) {
    console.error('Erro inesperado ao buscar endereço:', error)
    throw error
  }
}

/**
 * Busca um endereço de entrega por rua, número e bairro
 * @param street - Nome da rua
 * @param number - Número da residência
 * @param neighborhood - Bairro
 * @returns Endereço encontrado ou null
 */
export async function findDeliveryAddressByComponents(street: string, number: string, neighborhood: string): Promise<DeliveryAddress | null> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('address', street.trim())
      .eq('number', number.trim())
      .eq('neighborhood', neighborhood.trim())
      .eq('is_active', true)
      .limit(1)

    if (error) {
      console.error('Erro ao buscar endereço por componentes:', error)
      throw new Error('Erro ao buscar endereço de entrega')
    }

    // Retorna o primeiro resultado ou null se não houver resultados
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Erro inesperado ao buscar endereço por componentes:', error)
    throw error
  }
}

/**
 * Busca endereços de entrega por termo de pesquisa (endereço, bairro ou cidade)
 * @param searchTerm - Termo para buscar
 * @param limit - Limite de resultados (padrão: 10)
 * @returns Lista de endereços encontrados
 */
export async function searchDeliveryAddresses(searchTerm: string, limit: number = 10): Promise<DeliveryAddress[]> {
  try {
    const supabase = createAdminSupabaseClient()
    const search = searchTerm.trim().toLowerCase()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('is_active', true)
      .or(`address.ilike.%${search}%,neighborhood.ilike.%${search}%,city.ilike.%${search}%`)
      .order('address')
      .limit(limit)

    if (error) {
      console.error('Erro ao buscar endereços:', error)
      throw new Error('Erro ao buscar endereços de entrega')
    }

    return data || []
  } catch (error) {
    console.error('Erro inesperado ao buscar endereços:', error)
    throw error
  }
}

/**
 * Lista todos os endereços de entrega ativos
 * @returns Lista de endereços ativos
 */
export async function getActiveDeliveryAddresses(): Promise<DeliveryAddress[]> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('is_active', true)
      .order('address')

    if (error) {
      console.error('Erro ao listar endereços ativos:', error)
      throw new Error('Erro ao listar endereços de entrega')
    }

    return data || []
  } catch (error) {
    console.error('Erro inesperado ao listar endereços:', error)
    throw error
  }
}

/**
 * Lista todos os endereços de entrega (ativos e inativos)
 * @returns Lista de todos os endereços
 */
export async function getAllDeliveryAddresses(): Promise<DeliveryAddress[]> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .order('address')

    if (error) {
      console.error('Erro ao listar todos os endereços:', error)
      throw new Error('Erro ao listar endereços de entrega')
    }

    return data || []
  } catch (error) {
    console.error('Erro inesperado ao listar endereços:', error)
    throw error
  }
}

/**
 * Cria um novo endereço de entrega
 * @param addressData - Dados do endereço
 * @returns Endereço criado
 */
export async function createDeliveryAddress(addressData: CreateDeliveryAddressData): Promise<DeliveryAddress> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .insert([
        {
          address: addressData.address.trim(),
          number: addressData.number?.trim() || null,
          neighborhood: addressData.neighborhood?.trim() || null,
          city: addressData.city.trim(),
          delivery_fee: addressData.delivery_fee,
          is_active: addressData.is_active ?? true,
          notes: addressData.notes?.trim() || null
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar endereço:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        addressData
      })
      if (error.code === '23505') {
        throw new Error('Este endereço já existe')
      }
      throw new Error(`Erro ao criar endereço de entrega: ${error.message || 'Erro desconhecido'}`)
    }

    return data
  } catch (error) {
    console.error('Erro inesperado ao criar endereço:', error)
    throw error
  }
}

/**
 * Atualiza um endereço de entrega existente
 * @param addressData - Dados do endereço com ID
 * @returns Endereço atualizado
 */
export async function updateDeliveryAddress(addressData: UpdateDeliveryAddressData): Promise<DeliveryAddress> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const updateData: any = {}
    
    if (addressData.address !== undefined) {
      updateData.address = addressData.address.trim()
    }
    if (addressData.number !== undefined) {
      updateData.number = addressData.number?.trim() || null
    }
    if (addressData.neighborhood !== undefined) {
      updateData.neighborhood = addressData.neighborhood?.trim() || null
    }
    if (addressData.city !== undefined) {
      updateData.city = addressData.city.trim()
    }
    if (addressData.delivery_fee !== undefined) {
      updateData.delivery_fee = addressData.delivery_fee
    }
    if (addressData.is_active !== undefined) {
      updateData.is_active = addressData.is_active
    }
    if (addressData.notes !== undefined) {
      updateData.notes = addressData.notes?.trim() || null
    }
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .update(updateData)
      .eq('id', addressData.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar endereço:', error)
      if (error.code === '23505') {
        throw new Error('Este endereço já existe')
      }
      throw new Error('Erro ao atualizar endereço de entrega')
    }

    return data
  } catch (error) {
    console.error('Erro inesperado ao atualizar endereço:', error)
    throw error
  }
}

/**
 * Exclui um endereço de entrega
 * @param id - ID do endereço
 */
export async function deleteDeliveryAddress(id: number): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { error } = await supabase
      .from('delivery_addresses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao excluir endereço:', error)
      throw new Error('Erro ao excluir endereço de entrega')
    }
  } catch (error) {
    console.error('Erro inesperado ao excluir endereço:', error)
    throw error
  }
}

/**
 * Ativa ou desativa um endereço de entrega
 * @param id - ID do endereço
 * @param isActive - Status ativo/inativo
 * @returns Endereço atualizado
 */
export async function toggleDeliveryAddressStatus(id: number, isActive: boolean): Promise<DeliveryAddress> {
  try {
    const supabase = createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('delivery_addresses')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao alterar status do endereço:', error)
      throw new Error('Erro ao alterar status do endereço')
    }

    return data
  } catch (error) {
    console.error('Erro inesperado ao alterar status:', error)
    throw error
  }
}

// Exportação como objeto para compatibilidade
export const DeliveryAddressService = {
  findDeliveryAddressByAddress,
  findDeliveryAddressByComponents,
  searchDeliveryAddresses,
  getActiveDeliveryAddresses,
  getAllDeliveryAddresses,
  createDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  toggleDeliveryAddressStatus
}