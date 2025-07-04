import { createSupabaseClient } from "../supabase-client"
import type { CartItem } from "../types"
import { v4 as uuidv4 } from "uuid"
import { cleanSizeDisplay } from "@/lib/utils"

// ID da loja padrão como UUID - usando o ID da "Loja Principal" que existe no banco
const DEFAULT_STORE_ID = "00000000-0000-0000-0000-000000000000"

// Função para obter o ID da sessão do carrinho
export function getCartSessionId(): string {
  if (typeof window === "undefined") {
    return ""
  }

  let sessionId = localStorage.getItem("cartSessionId")

  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem("cartSessionId", sessionId)
  }

  return sessionId
}

// Função para obter o ID da loja atual como UUID
export function getCurrentStoreId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_STORE_ID
  }

  // Verificar se há um ID de loja armazenado no localStorage
  const storedStoreId = localStorage.getItem("currentStoreId")

  // Se existir e for um UUID válido, retornar
  if (storedStoreId && isValidUUID(storedStoreId)) {
    return storedStoreId
  }

  // Caso contrário, usar o ID padrão e armazená-lo
  localStorage.setItem("currentStoreId", DEFAULT_STORE_ID)
  return DEFAULT_STORE_ID
}

// Função para validar se uma string é um UUID válido
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Função para obter itens do carrinho
export async function getCartItems(): Promise<CartItem[]> {
  const sessionId = getCartSessionId()
  if (!sessionId) return []

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  const { data, error } = await supabase.from("cart").select("*").eq("session_id", sessionId).eq("store_id", storeId)

  if (error) {
    console.error("Erro ao buscar itens do carrinho:", error)
    return []
  }

  return data.map((item: any): CartItem => {
    // Criar uma cópia do item com o tamanho modificado para exibição
    const displayItem: CartItem = {
      id: Number(item.id),
      productId: Number(item.product_id),
      name: String(item.name),
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: String(item.image || ""),
      // Armazenar o tamanho original para uso interno
      originalSize: String(item.size),
      // Limpar o tamanho para exibição
      size: cleanSizeDisplay(String(item.size)),
      additionals: Array.isArray(item.additionals) ? item.additionals : [],
      // Incluir informação se o produto precisa de colher
      needsSpoon: Boolean(item.needs_spoon),
    }

    return displayItem
  })
}

// Função para verificar se dois arrays de adicionais são iguais
function areAdditionalsEqual(additionals1: any[] = [], additionals2: any[] = []): boolean {
  // Garantir que estamos trabalhando com arrays
  if (!Array.isArray(additionals1)) additionals1 = []
  if (!Array.isArray(additionals2)) additionals2 = []

  // Se ambos estiverem vazios, são iguais
  if (additionals1.length === 0 && additionals2.length === 0) return true
  
  // Se apenas um estiver vazio, são diferentes
  if (additionals1.length !== additionals2.length) return false

  // Ordenar os arrays para garantir comparação consistente
  const sorted1 = [...additionals1].sort((a, b) => {
    // Verificar se os objetos têm a propriedade id
    const idA = a && typeof a === 'object' && 'id' in a ? a.id : 0
    const idB = b && typeof b === 'object' && 'id' in b ? b.id : 0
    return Number(idA) - Number(idB)
  })
  
  const sorted2 = [...additionals2].sort((a, b) => {
    const idA = a && typeof a === 'object' && 'id' in a ? a.id : 0
    const idB = b && typeof b === 'object' && 'id' in b ? b.id : 0
    return Number(idA) - Number(idB)
  })

  // Comparar cada adicional
  for (let i = 0; i < sorted1.length; i++) {
    const a1 = sorted1[i]
    const a2 = sorted2[i]

    // Verificar se os objetos são válidos e têm as propriedades necessárias
    if (!a1 || !a2 || typeof a1 !== 'object' || typeof a2 !== 'object') return false
    
    const id1 = 'id' in a1 ? Number(a1.id) : 0
    const id2 = 'id' in a2 ? Number(a2.id) : 0
    const qty1 = 'quantity' in a1 ? Number(a1.quantity) : 0
    const qty2 = 'quantity' in a2 ? Number(a2.quantity) : 0

    if (id1 !== id2 || qty1 !== qty2) {
      return false
    }
  }

  return true
}

// Função para adicionar item ao carrinho
export async function addToCart(item: Omit<CartItem, "id">): Promise<CartItem | null> {
  const sessionId = getCartSessionId()
  if (!sessionId) return null

  // Verificar se productId está definido
  if (!item.productId) {
    console.error("Erro: productId não definido ao adicionar item ao carrinho", item)
    return null
  }

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  try {
    // Log para debug
    console.log("Adicionando item ao carrinho com store_id:", storeId, "tipo:", typeof storeId)

    // Primeiro, vamos buscar todos os itens do carrinho com o mesmo produto
    const { data: existingItems, error: selectError } = await supabase
      .from("cart")
      .select("*")
      .eq("session_id", sessionId)
      .eq("store_id", storeId)
      .eq("product_id", item.productId)

    if (selectError) {
      console.error("Erro ao verificar itens existentes no carrinho:", selectError)
      return null
    }

    // Verificar se existe um item com o mesmo tamanho e adicionais
    console.log("Verificando itens existentes no carrinho:", existingItems?.length || 0, "itens encontrados")
    
    // Verificar se existe um item com os mesmos adicionais e tamanho similar
    // Ignoramos os sufixos únicos que podem ter sido adicionados ao tamanho
    const matchingItem = existingItems?.find((existingItem: any) => {
      // Verificar se o tamanho base (sem o sufixo único) é o mesmo
      const existingSizeBase = String(existingItem.size).split('#')[0]
      const newSizeBase = String(item.size).split('#')[0]
      const isSameSizeBase = existingSizeBase === newSizeBase
      
      // Verificar se os adicionais são os mesmos
      const isEqual = areAdditionalsEqual(existingItem.additionals, item.additionals)
      
      console.log(
        `Comparando item - ID: ${existingItem.id}, ` +
        `Produto: ${existingItem.product_id}, ` +
        `Tamanho original: ${existingItem.size}, ` +
        `Tamanho base: ${existingSizeBase}, ` +
        `Novo tamanho base: ${newSizeBase}, ` +
        `Tamanhos iguais: ${isSameSizeBase ? 'SIM' : 'NÃO'}, ` +
        `Adicionais iguais: ${isEqual ? 'SIM' : 'NÃO'}`
      )
      
      // O item é considerado o mesmo se o tamanho base e os adicionais forem iguais
      return isSameSizeBase && isEqual
    })

    if (matchingItem) {
      console.log("Item encontrado no carrinho, atualizando quantidade", matchingItem.id)
      
      // Item com mesmos adicionais existe, atualizar quantidade
      const { data, error: updateError } = await supabase
        .from("cart")
        .update({
          quantity: Number(matchingItem.quantity) + item.quantity,
          // Garantir que store_id esteja presente mesmo em atualizações
          store_id: storeId,
        })
        .eq("id", Number(matchingItem.id))
        .select()
        .single()

      if (updateError) {
        console.error("Erro ao atualizar item do carrinho:", updateError)
        return null
      }

      const typedData = data as any
      return {
        id: Number(typedData.id),
        productId: Number(typedData.product_id),
        name: String(typedData.name),
        price: Number(typedData.price),
        quantity: Number(typedData.quantity),
        image: String(typedData.image || ""),
        size: cleanSizeDisplay(String(typedData.size)), // Limpar o tamanho para exibição
        additionals: Array.isArray(typedData.additionals) ? typedData.additionals : [],
        needsSpoon: Boolean(typedData.needs_spoon), // Incluir informação se o produto precisa de colher
      }
    } else {
      // Não encontramos um item com os mesmos adicionais
      // Vamos gerar um ID único para este item
      const itemId = uuidv4()

      // Garantir que o tamanho não ultrapasse o limite do campo no banco de dados
      // e que o sufixo único seja sempre preservado
      const maxSizeLength = 20; // Tamanho máximo do campo no banco de dados
      const suffix = `#${itemId.substring(0, 8)}`; // Sufixo único para o tamanho
      
      // Calcular quanto espaço temos para o tamanho original
      const availableSpace = maxSizeLength - suffix.length;
      
      // Truncar o tamanho original se necessário e adicionar o sufixo
      const originalSize = String(item.size).trim();
      const truncatedSize = originalSize.substring(0, availableSpace);
      const uniqueSize = truncatedSize + suffix;
      
      console.log("Gerando tamanho único para o item:", {
        originalSize,
        truncatedSize,
        suffix,
        uniqueSize,
        length: uniqueSize.length
      });

      // Inserir novo item com o tamanho único
      const { data, error: insertError } = await supabase
        .from("cart")
        .insert({
          session_id: sessionId,
          store_id: storeId,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
          size: uniqueSize, // Usar o tamanho único gerado com sufixo garantido
          additionals: item.additionals || [],
          needs_spoon: item.needsSpoon // Incluir informação se o produto precisa de colher
        })
        .select()
        .single()

      if (insertError) {
        console.error("Erro ao adicionar item ao carrinho:", insertError)
        console.error("Detalhes do erro:", insertError.details)
        console.error("Hint:", insertError.hint)
        console.error("Dados tentando inserir:", {
          session_id: sessionId,
          store_id: storeId,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: uniqueSize,
          additionals: item.additionals?.length || 0
        })
        return null
      }

      const typedInsertData = data as any
      return {
        id: Number(typedInsertData.id),
        productId: Number(typedInsertData.product_id),
        name: String(typedInsertData.name),
        price: Number(typedInsertData.price),
        quantity: Number(typedInsertData.quantity),
        image: String(typedInsertData.image || ""),
        size: cleanSizeDisplay(String(originalSize)), // Mostrar o tamanho original para o usuário
        originalSize: String(typedInsertData.size), // Manter o tamanho com sufixo internamente
        additionals: Array.isArray(typedInsertData.additionals) ? typedInsertData.additionals : [],
        needsSpoon: Boolean(typedInsertData.needs_spoon), // Incluir informação se o produto precisa de colher
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar item ao carrinho:", error)
    return null
  }
}

// Alias para addToCart para compatibilidade
export const addCartItem = addToCart

// Função para atualizar quantidade de um item e outros campos opcionais
export async function updateCartItemQuantity(id: number, quantity: number, updatedFields?: Partial<CartItem>): Promise<boolean> {
  // Verificar se id é um número válido
  if (isNaN(Number(id))) {
    console.error(`Erro: ID inválido ao atualizar quantidade: ${id}`)
    return false
  }

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  // Criar objeto de atualização com os campos básicos
  const updateData: any = {
    quantity,
    store_id: storeId, // Garantir que store_id esteja presente mesmo em atualizações
  }

  // Adicionar campos adicionais se fornecidos
  if (updatedFields) {
    // Adicionar apenas campos permitidos para atualização
    if (updatedFields.needsSpoon !== undefined) {
      updateData.needs_spoon = updatedFields.needsSpoon
    }
    // Adicionar outros campos conforme necessário no futuro
  }

  const { error } = await supabase
    .from("cart")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error(`Erro ao atualizar item ${id}:`, error)
    return false
  }

  return true
}

// Função para remover item do carrinho
export async function removeFromCart(id: number): Promise<boolean> {
  const supabase = createSupabaseClient()

  const { error } = await supabase.from("cart").delete().eq("id", id)

  if (error) {
    console.error(`Erro ao remover item ${id} do carrinho:`, error)
    return false
  }

  return true
}

// Função para limpar carrinho
export async function clearCart(): Promise<boolean> {
  const sessionId = getCartSessionId()
  if (!sessionId) return false

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  const { error } = await supabase.from("cart").delete().eq("session_id", sessionId).eq("store_id", storeId)

  if (error) {
    console.error("Erro ao limpar carrinho:", error)
    return false
  }

  return true
}

// Função para obter total do carrinho
export async function getCartTotal(): Promise<number> {
  const items = await getCartItems()

  return items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity
    const additionalsTotal =
      (item.additionals || []).reduce((sum, additional) => sum + additional.price * (additional.quantity || 1), 0) *
      item.quantity

    return total + itemTotal + additionalsTotal
  }, 0)
}

// Função para obter quantidade total de itens no carrinho
export async function getCartItemCount(): Promise<number> {
  const items = await getCartItems()

  return items.reduce((count, item) => count + item.quantity, 0)
}

// Função para obter as lojas disponíveis
export async function getAvailableStores() {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("stores").select("id, name, logo_url").eq("is_active", true)

  if (error) {
    console.error("Erro ao buscar lojas disponíveis:", error)
    return []
  }

  return data
}

// Função para definir a loja atual
export function setCurrentStore(storeId: string) {
  if (typeof window === "undefined") return

  if (isValidUUID(storeId)) {
    localStorage.setItem("currentStoreId", storeId)
  }
}
