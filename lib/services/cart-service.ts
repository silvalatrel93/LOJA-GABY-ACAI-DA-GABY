import { createSupabaseClient } from "../supabase-client"
import type { CartItem } from "../types"
import { v4 as uuidv4 } from "uuid"

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
    size: item.size,
    additionals: item.additionals || [],
  }))
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

  // Verificar se o item já existe no carrinho
  const { data: existingItems } = await supabase
    .from("cart")
    .select("*")
    .eq("session_id", sessionId)
    .eq("product_id", item.productId)
    .eq("size", item.size)

  // Se o item já existe, atualizar a quantidade
  if (existingItems && existingItems.length > 0) {
    const existingItem = existingItems[0]

    // Verificar se os adicionais são iguais
    const existingAdditionals = JSON.stringify(existingItem.additionals || [])
    const newAdditionals = JSON.stringify(item.additionals || [])

    if (existingAdditionals === newAdditionals) {
      const { data, error } = await supabase
        .from("cart")
        .update({ quantity: existingItem.quantity + item.quantity })
        .eq("id", existingItem.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar item do carrinho:", error)
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
    }
  }

  // Adicionar novo item ao carrinho
  const { data, error } = await supabase
    .from("cart")
    .insert({
      session_id: sessionId,
      product_id: item.productId, // Garantir que product_id está sendo definido corretamente
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      size: item.size,
      additionals: item.additionals || [],
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao adicionar item ao carrinho:", error)
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
}

// Alias para addToCart para compatibilidade
export const addCartItem = addToCart

// Função para atualizar quantidade de um item
export async function updateCartItemQuantity(id: number, quantity: number): Promise<boolean> {
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
