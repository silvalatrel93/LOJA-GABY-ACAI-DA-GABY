"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getCartItems, addToCart, updateCartItemQuantity, removeFromCart, clearCart } from "@/lib/services/cart-service"
import type { CartItem } from "@/lib/types"

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, "id">) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemCount, setItemCount] = useState(0)

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

  // Atualizar quantidade de um item (com atualização otimista da UI)
  const handleUpdateQuantity = useCallback(
    async (id: number, quantity: number) => {
      try {
        // Atualização otimista da UI
        setCart((prevCart) => {
          const newCart = prevCart.map((item) => {
            if (item.id === id) {
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
        await updateCartItemQuantity(id, quantity)
      } catch (error) {
        console.error("Erro ao atualizar quantidade:", error)
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
        removeFromCart: handleRemoveFromCart,
        clearCart: handleClearCart,
        isLoading,
        itemCount,
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
