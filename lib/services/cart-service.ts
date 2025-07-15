import { createSupabaseClient } from "../supabase-client"
import type { CartItem } from "../types"
import { v4 as uuidv4 } from "uuid"
import { cleanSizeDisplay } from "@/lib/utils"
import { DEFAULT_STORE_ID } from "../constants"

// Função para obter o ID da sessão do carrinho
export function getCartSessionId(): string {
  // Debug removido para limpar console

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
  // Verificar se DEFAULT_STORE_ID é válido
  if (!DEFAULT_STORE_ID || !isValidUUID(DEFAULT_STORE_ID)) {
    console.error("ERRO CRÍTICO: DEFAULT_STORE_ID inválido!", DEFAULT_STORE_ID)
    throw new Error("DEFAULT_STORE_ID inválido: " + DEFAULT_STORE_ID)
  }

  if (typeof window === "undefined") {
    return DEFAULT_STORE_ID
  }

  // CORREÇÃO: Sempre usar o store_id padrão para evitar problemas de FK
  // Limpar qualquer store_id incorreto do localStorage
  const storedStoreId = localStorage.getItem("currentStoreId")
  if (storedStoreId && storedStoreId !== DEFAULT_STORE_ID) {
    console.warn("Store ID incorreto encontrado no localStorage:", storedStoreId)
    console.warn("Corrigindo para o store_id padrão:", DEFAULT_STORE_ID)
    localStorage.setItem("currentStoreId", DEFAULT_STORE_ID)
  }

  // Sempre garantir que o localStorage tenha o ID correto
  localStorage.setItem("currentStoreId", DEFAULT_STORE_ID)
  return DEFAULT_STORE_ID
}

// Função para validar se uma string é um UUID válido
function isValidUUID(uuid: string): boolean {
  // Regex mais flexível que aceita qualquer UUID válido, incluindo nil UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
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
      // Incluir informação sobre colheres
      needsSpoon: item.needs_spoon !== null ? Boolean(item.needs_spoon) : undefined,
      spoonQuantity: Number(item.spoon_quantity) || undefined,
      // Incluir observações do cliente (se a coluna existir)
      notes: String(item.notes || ""),
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
  // Log detalhado do item recebido
  // Debug removido para limpar console

  // Verificação específica para objeto vazio
  if (Object.keys(item || {}).length === 0) {
    console.error("ERRO CRÍTICO: Item recebido está vazio!")
    console.error("Dados tentando inserir:", JSON.stringify(item))
    return null
  }

  const sessionId = getCartSessionId()
  if (!sessionId) {
    console.error("Erro: sessionId não encontrado")
    return null
  }

  // Verificar se o item é válido
  if (!item || typeof item !== 'object') {
    console.error("Erro: item inválido ou não é um objeto", item)
    return null
  }

  // Verificar se productId está definido
  if (!item.productId) {
    console.error("Erro: productId não definido ao adicionar item ao carrinho", item)
    return null
  }

  // Verificar se campos obrigatórios estão presentes
  if (!item.name || item.price === undefined || !item.size || item.quantity === undefined) {
    console.error("Erro: campos obrigatórios ausentes", {
      name: item.name,
      price: item.price,
      size: item.size,
      quantity: item.quantity
    })
    return null
  }

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  try {
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

    // Verificar se existe um item com os mesmos adicionais, tamanho e escolha de colher
    // Ignoramos os sufixos únicos que podem ter sido adicionados ao tamanho
    const matchingItem = existingItems?.find((existingItem: any) => {
      // Verificar se o tamanho base (sem o sufixo único) é o mesmo
      const existingSizeBase = String(existingItem.size).split('#')[0]
      const newSizeBase = String(item.size).split('#')[0]
      const isSameSizeBase = existingSizeBase === newSizeBase

      // Verificar se os adicionais são os mesmos
      const areAdditionalsEquivalent = areAdditionalsEqual(existingItem.additionals, item.additionals)

      // Verificar se a escolha de colher é a mesma
      const existingNeedsSpoon = existingItem.needs_spoon
      const newNeedsSpoon = item.needsSpoon
      const isSameSpoonChoice = existingNeedsSpoon === newNeedsSpoon

      // Verificar se a quantidade de colheres é a mesma (se ambos precisam de colher)
      const existingSpoonQty = existingItem.spoon_quantity || 1
      const newSpoonQty = item.spoonQuantity || 1
      const isSameSpoonQuantity = (existingNeedsSpoon !== true && newNeedsSpoon !== true) || existingSpoonQty === newSpoonQty

      // Comparação de itens removida para limpar console

      // O item é considerado o mesmo se tamanho base, adicionais, escolha de colher e quantidade de colheres forem iguais
      return isSameSizeBase && areAdditionalsEquivalent && isSameSpoonChoice && isSameSpoonQuantity
    })

    if (matchingItem) {
      // Item encontrado no carrinho, atualizando quantidade

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
        needsSpoon: typedData.needs_spoon !== null ? Boolean(typedData.needs_spoon) : undefined,
        spoonQuantity: Number(typedData.spoon_quantity) || undefined,
        notes: String(typedData.notes || ""), // Incluir observações do cliente
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

      // Gerando tamanho único para o item

      // Validar dados antes da inserção
      if (!isValidUUID(storeId)) {
        throw new Error(`store_id inválido: ${storeId}`)
      }

      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error(`session_id inválido: ${sessionId}`)
      }

      if (!item.productId || typeof item.productId !== 'number') {
        throw new Error(`product_id inválido: ${item.productId}`)
      }

      // Inserir novo item com o tamanho único
      const insertData: any = {
        session_id: sessionId,
        store_id: storeId,
        product_id: Number(item.productId),
        name: String(item.name) || '',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || null,
        size: uniqueSize, // Usar o tamanho único gerado com sufixo garantido
        additionals: Array.isArray(item.additionals) ? item.additionals : [],
        needs_spoon: Boolean(item.needsSpoon),
        spoon_quantity: item.needsSpoon === true ? Number(item.spoonQuantity || 1) : null,
      }

      // Incluir notes apenas se a propriedade existir no item (para compatibilidade)
      if (item.notes !== undefined) {
        insertData.notes = String(item.notes) || ""
      }



      // Log temporário para debug
      console.log("=== DEBUG INSERÇÃO CARRINHO ===")
      console.log("insertData completo:", JSON.stringify(insertData, null, 2))
      console.log("store_id específico:", insertData.store_id, "tipo:", typeof insertData.store_id)
      console.log("session_id:", insertData.session_id, "tipo:", typeof insertData.session_id)
      console.log("product_id:", insertData.product_id, "tipo:", typeof insertData.product_id)

      const { data, error: insertError } = await supabase
        .from("cart")
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        console.log("=== ERRO NA INSERÇÃO ===")
        console.log("Erro completo:", JSON.stringify(insertError, null, 2))
        console.log("Código do erro:", insertError.code)
        console.log("Mensagem:", insertError.message)
        console.log("Detalhes:", insertError.details)
      }

      if (insertError) {
        console.error("Erro ao adicionar item ao carrinho:", insertError.message)

        // Se o erro for sobre coluna inexistente (notes), tenta sem a coluna
        if (insertError.message?.includes('column "notes" of relation "cart" does not exist')) {
          const { notes, ...insertDataWithoutNotes } = insertData

          const { data: retryData, error: retryError } = await supabase
            .from("cart")
            .insert(insertDataWithoutNotes)
            .select()
            .single()

          if (retryError) {
            console.error("Erro na segunda tentativa:", retryError)
            return null
          }

          // Usar os dados da segunda tentativa
          const typedRetryData = retryData as any
          return {
            id: Number(typedRetryData.id),
            productId: Number(typedRetryData.product_id),
            name: String(typedRetryData.name),
            price: Number(typedRetryData.price),
            quantity: Number(typedRetryData.quantity),
            image: String(typedRetryData.image || ""),
            size: cleanSizeDisplay(String(originalSize)),
            originalSize: String(typedRetryData.size),
            additionals: Array.isArray(typedRetryData.additionals) ? typedRetryData.additionals : [],
            needsSpoon: typedRetryData.needs_spoon !== null ? Boolean(typedRetryData.needs_spoon) : undefined,
            spoonQuantity: Number(typedRetryData.spoon_quantity) || undefined,
            notes: "", // Usar string vazia se a coluna não existir
          }
        }

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
        needsSpoon: typedInsertData.needs_spoon !== null ? Boolean(typedInsertData.needs_spoon) : undefined,
        spoonQuantity: Number(typedInsertData.spoon_quantity) || undefined,
        notes: String(typedInsertData.notes || ""), // Incluir observações do cliente
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
    if (updatedFields.spoonQuantity !== undefined) {
      updateData.spoon_quantity = updatedFields.needsSpoon === true ? updatedFields.spoonQuantity : null
    }
    if (updatedFields.notes !== undefined) {
      updateData.notes = updatedFields.notes
    }
    // Adicionar outros campos conforme necessário no futuro
  }

  const { error } = await supabase
    .from("cart")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error(`Erro ao atualizar item ${id}:`, error.message)

    // Se o erro for sobre coluna inexistente (notes), tenta sem a coluna
    if (error.message?.includes('column "notes" of relation "cart" does not exist')) {
      const { notes, ...updateDataWithoutNotes } = updateData

      const { error: retryError } = await supabase
        .from("cart")
        .update(updateDataWithoutNotes)
        .eq("id", id)

      if (retryError) {
        console.error(`Erro na segunda tentativa ao atualizar item ${id}:`, retryError)
        return false
      }

      return true
    }

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
