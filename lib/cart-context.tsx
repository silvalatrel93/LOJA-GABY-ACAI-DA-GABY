"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  getCart,
  addToCart as dbAddToCart,
  removeFromCart as dbRemoveFromCart,
  updateCartItemQuantity,
  clearCart as dbClearCart,
  type CartItem,
} from "@/lib/db"

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => Promise<void>
  removeFromCart: (id: number, size: string) => Promise<void>
  updateQuantity: (id: number, size: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
}

interface CartProviderProps {
  children: ReactNode
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Carregar carrinho do IndexedDB na inicialização
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartItems = await getCart()
        setCart(cartItems)
      } catch (error) {
        console.error("Erro ao carregar o carrinho:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [])

  const addToCart = async (item: CartItem) => {
    try {
      await dbAddToCart(item)
      // Atualizar o estado local após a operação no banco de dados
      const updatedCart = await getCart()
      setCart(updatedCart)
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error)
    }
  }

  const removeFromCart = async (id: number, size: string) => {
    try {
      await dbRemoveFromCart(id, size)
      // Atualizar o estado local após a operação no banco de dados
      const updatedCart = await getCart()
      setCart(updatedCart)
    } catch (error) {
      console.error("Erro ao remover do carrinho:", error)
    }
  }

  const updateQuantity = async (id: number, size: string, quantity: number) => {
    try {
      await updateCartItemQuantity(id, size, quantity)
      // Atualizar o estado local após a operação no banco de dados
      const updatedCart = await getCart()
      setCart(updatedCart)
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error)
    }
  }

  const clearCart = async () => {
    try {
      await dbClearCart()
      setCart([])
    } catch (error) {
      console.error("Erro ao limpar o carrinho:", error)
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider")
  }
  return context
}
