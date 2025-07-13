"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getCartItems, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from "@/lib/services/cart-service"
import type { CartItem } from "@/lib/types"

interface TableInfo {
  id: number
  number: number
  name: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>
  updateQuantity: (id: number, quantity: number, updatedFields?: Partial<CartItem>) => Promise<void>
  updateNotes: (id: number, notes: string) => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
  itemCount: number
  tableInfo: TableInfo | null
  isTableOrder: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemCount, setItemCount] = useState(0)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [isTableOrder, setIsTableOrder] = useState(false)

  // Carregar itens do carrinho
  const loadCart = useCallback(async () => {
    try {
      setIsLoading(true)
      const items = await getCartItems()
      setCart(items)
      setItemCount(items.reduce((count, item) => count + item.quantity, 0))
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Verificar se estamos em uma mesa
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mesaAtual = localStorage.getItem('mesa_atual')
      if (mesaAtual) {
        try {
          const mesa = JSON.parse(mesaAtual) as TableInfo
          setTableInfo(mesa)
          setIsTableOrder(true)
        } catch (error) {
          console.error('Erro ao ler informações da mesa:', error)
        }
      } else {
        setTableInfo(null)
        setIsTableOrder(false)
      }
    }
  }, [])

  // Carregar carrinho ao iniciar
  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Adicionar item ao carrinho
  const handleAddToCart = useCallback(
    async (item: Omit<CartItem, "id">) => {
      try {
        await addToCart(item)
        await loadCart()
      } catch (error) {
        console.error("Erro ao adicionar item ao carrinho:", error)
      }
    },
    [loadCart],
  )

  // Atualizar quantidade e outros campos de um item (com atualização otimista da UI)
  const handleUpdateQuantity = useCallback(
    async (id: number, quantity: number, updatedFields?: Partial<CartItem>) => {
      try {
        // Atualização otimista da UI
        setCart((prevCart) => {
          const newCart = prevCart.map((item) => {
            if (item.id === id) {
              // Aplicar atualizações adicionais se fornecidas
              if (updatedFields) {
                return { ...item, quantity, ...updatedFields }
              }
              return { ...item, quantity }
            }
            return item
          })

          // Atualizar contagem de itens
          const newItemCount = newCart.reduce((count, item) => count + item.quantity, 0)
          setItemCount(newItemCount)

          return newCart
        })

        // Atualizar no banco de dados
        await updateCartItemQuantity(id, quantity, updatedFields)
      } catch (error) {
        console.error("Erro ao atualizar item do carrinho:", error)
        // Em caso de erro, recarregar o carrinho para garantir consistência
        await loadCart()
      }
    },
    [loadCart],
  )

  // Remover item do carrinho (com atualização otimista da UI)
  const handleRemoveFromCart = useCallback(
    async (id: number) => {
      try {
        // Atualização otimista da UI
        setCart((prevCart) => {
          const newCart = prevCart.filter((item) => item.id !== id)

          // Atualizar contagem de itens
          const newItemCount = newCart.reduce((count, item) => count + item.quantity, 0)
          setItemCount(newItemCount)

          return newCart
        })

        // Remover do banco de dados
        await removeFromCart(id)
      } catch (error) {
        console.error("Erro ao remover item:", error)
        // Em caso de erro, recarregar o carrinho para garantir consistência
        await loadCart()
      }
    },
    [loadCart],
  )

  // Atualizar observações de um item
  const handleUpdateNotes = useCallback(
    async (id: number, notes: string) => {
      try {
        // Atualização otimista da UI
        setCart((prevCart) => {
          return prevCart.map((item) => {
            if (item.id === id) {
              return { ...item, notes }
            }
            return item
          })
        })

        // Atualizar no banco de dados - passar a quantidade atual do item
        const currentItem = cart.find(item => item.id === id)
        if (currentItem) {
          await updateCartItemQuantity(id, currentItem.quantity, { notes })
        }
      } catch (error) {
        console.error("Erro ao atualizar observações do item:", error)
        // Em caso de erro, recarregar o carrinho para garantir consistência
        await loadCart()
      }
    },
    [loadCart, cart],
  )

  // Limpar carrinho
  const handleClearCart = useCallback(async () => {
    try {
      setCart([])
      setItemCount(0)
      await clearCart()
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error)
      await loadCart()
    }
  }, [loadCart])

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart: handleAddToCart,
        updateQuantity: handleUpdateQuantity,
        updateNotes: handleUpdateNotes,
        removeFromCart: handleRemoveFromCart,
        clearCart: handleClearCart,
        isLoading,
        itemCount,
        tableInfo,
        isTableOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart deve ser usado dentro de um CartProvider")
  }
  return context
}
