import { createSupabaseClient } from "../supabase-client"
import type { CartItem } from "../types"
import { v4 as uuidv4 } from "uuid"
import { cleanSizeDisplay } from "@/lib/utils"

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

// Função para obter itens do carrinho
export async function getCartItems(): Promise<CartItem[]> {
  const sessionId = getCartSessionId()
  if (!sessionId) return []

  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("cart").select("*").eq("session_id", sessionId)

  if (error) {
    console.error("Erro ao buscar itens do carrinho:", error)
    return []
  }

  return data.map((item) => ({
    id: item.id,
    productId: item.product_id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    image: item.image || "",
    size: cleanSizeDisplay(item.size),
    additionals: item.additionals || [],
  }))
}

// Função para verificar se dois arrays de adicionais são iguais
function areAdditionalsEqual(additionals1: any[] = [], additionals2: any[] = []): boolean {
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

  try {
    // Buscar todos os itens do carrinho com o mesmo produto e tamanho
    const { data: existingItems, error: selectError } = await supabase
      .from("cart")
      .select("*")
      .eq("session_id", sessionId)
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
        .update({ quantity: matchingItem.quantity + item.quantity })
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
        size: data.size,
        additionals: data.additionals || [],
      }
    } else if (existingItems && existingItems.length > 0) {
      // Existe um item com o mesmo produto e tamanho, mas adicionais diferentes
      // Precisamos atualizar o item existente com um identificador único para os adicionais

      // Gerar um identificador único para o tamanho baseado nos adicionais
      const additionalIds = (item.additionals || [])
        .map((a) => a.id)
        .sort()
        .join("-")
      const uniqueSize = additionalIds ? `${item.size}#${additionalIds}` : item.size

      // Adicionar novo item com o tamanho modificado
      const { data, error: insertError } = await supabase
        .from("cart")
        .insert({
          session_id: sessionId,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: uniqueSize, // Usar o tamanho modificado para evitar conflito
          additionals: item.additionals || [],
        })
        .select()
        .single()

      if (insertError) {
        console.error("Erro ao adicionar item ao carrinho:", insertError)
        return null
      }

      return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        price: Number(data.price),
        quantity: data.quantity,
        image: data.image || "",
        size: data.size,
        additionals: item.additionals || [],
      }
    } else {
      // Não existe item com o mesmo produto e tamanho, adicionar novo
      const { data, error: insertError } = await supabase
        .from("cart")
        .insert({
          session_id: sessionId,
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
          additionals: item.additionals || [],
        })
        .select()
        .single()

      if (insertError) {
        console.error("Erro ao adicionar item ao carrinho:", insertError)
        return null
      }

      return {
        id: data.id,
        productId: data.product_id,
        name: data.name,
        price: Number(data.price),
        quantity: data.quantity,
        image: data.image || "",
        size: data.size,
        additionals: item.additionals || [],
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

  const { error } = await supabase.from("cart").update({ quantity }).eq("id", id)

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

  const { error } = await supabase.from("cart").delete().eq("session_id", sessionId)

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
      (item.additionals || []).reduce((sum, additional) => sum + additional.price, 0) * item.quantity

    return total + itemTotal + additionalsTotal
  }, 0)
}

// Função para obter quantidade total de itens no carrinho
export async function getCartItemCount(): Promise<number> {
  const items = await getCartItems()

  return items.reduce((count, item) => count + item.quantity, 0)
}
