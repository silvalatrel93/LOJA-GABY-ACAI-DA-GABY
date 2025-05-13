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

  return data.map((item) => {
    // Criar uma cópia do item com o tamanho modificado para exibição
    const displayItem = {
      id: item.id,
      productId: item.product_id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image: item.image || "",
      // Armazenar o tamanho original para uso interno
      originalSize: item.size,
      // Limpar o tamanho para exibição
      size: cleanSizeDisplay(item.size),
      additionals: item.additionals || [],
    }

    return displayItem
  })
}

// Função para verificar se dois arrays de adicionais são iguais
function areAdditionalsEqual(additionals1: any[] = [], additionals2: any[] = []): boolean {
  if (!additionals1) additionals1 = []
  if (!additionals2) additionals2 = []

  if (additionals1.length !== additionals2.length) return false

  // Ordenar os arrays para garantir comparação consistente
  const sorted1 = [...additionals1].sort((a, b) => a.id - b.id)
  const sorted2 = [...additionals2].sort((a, b) => a.id - b.id)

  // Comparar cada adicional
  for (let i = 0; i < sorted1.length; i++) {
    const a1 = sorted1[i]
    const a2 = sorted2[i]

    if (a1.id !== a2.id || a1.quantity !== a2.quantity) {
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

    // Primeiro, vamos buscar todos os itens do carrinho com o mesmo produto e tamanho
    const { data: existingItems, error: selectError } = await supabase
      .from("cart")
      .select("*")
      .eq("session_id", sessionId)
      .eq("store_id", storeId)
      .eq("product_id", item.productId)
      .eq("size", item.size)

    if (selectError) {
      console.error("Erro ao verificar itens existentes no carrinho:", selectError)
      return null
    }

    // Verificar se existe um item com os mesmos adicionais
    const matchingItem = existingItems?.find((existingItem) =>
      areAdditionalsEqual(existingItem.additionals, item.additionals),
    )

    if (matchingItem) {
      // Item com mesmos adicionais existe, atualizar quantidade
      const { data, error: updateError } = await supabase
        .from("cart")
        .update({
          quantity: matchingItem.quantity + item.quantity,
          // Garantir que store_id esteja presente mesmo em atualizações
          store_id: storeId,
        })
        .eq("id", matchingItem.id)
        .select()
        .single()

      if (updateError) {
        console.error("Erro ao atualizar item do carrinho:", updateError)
        return null
      }

      return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        price: Number(data.price),
        quantity: data.quantity,
        image: data.image || "",
        size: cleanSizeDisplay(data.size), // Limpar o tamanho para exibição
        additionals: data.additionals || [],
      }
    } else {
      // Não encontramos um item com os mesmos adicionais
      // Vamos gerar um ID único para este item
      const itemId = uuidv4()

      // Vamos criar um novo item com um tamanho modificado para evitar conflitos
      // Adicionamos um sufixo único ao tamanho
      const uniqueSize = `${item.size}#${itemId.substring(0, 8)}`

      const { data, error: insertError } = await supabase
        .from("cart")
        .insert({
          session_id: sessionId,
          store_id: storeId, // Garantir que store_id esteja presente como UUID
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: uniqueSize, // Usar o tamanho com sufixo único
          additionals: item.additionals || [],
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
        })
        return null
      }

      return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        price: Number(data.price),
        quantity: data.quantity,
        image: data.image || "",
        size: cleanSizeDisplay(data.size), // Limpar o tamanho para exibição
        additionals: data.additionals || [],
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar item ao carrinho:", error)
    return null
  }
}

// Alias para addToCart para compatibilidade
export const addCartItem = addToCart

// Função para atualizar quantidade de um item
export async function updateCartItemQuantity(id: number, quantity: number): Promise<boolean> {
  // Verificar se id é um número válido
  if (isNaN(Number(id))) {
    console.error(`Erro: ID inválido ao atualizar quantidade: ${id}`)
    return false
  }

  const supabase = createSupabaseClient()
  const storeId = getCurrentStoreId()

  const { error } = await supabase
    .from("cart")
    .update({
      quantity,
      store_id: storeId, // Garantir que store_id esteja presente mesmo em atualizações
    })
    .eq("id", id)

  if (error) {
    console.error(`Erro ao atualizar quantidade do item ${id}:`, error)
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
