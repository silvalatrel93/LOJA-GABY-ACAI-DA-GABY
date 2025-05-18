"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react"
import { useCart, CartProvider } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import { getStoreConfig } from "@/lib/services/store-config-service"

// Componente para exibir um item com nome à esquerda e valor à direita
function ItemRow({ name, value, className }: { name: string; value: string; className?: string }) {
  return (
    <div className={`flex items-center w-full ${className || ''}`}>
      <div className="flex-grow">{name}</div>
      <div className="flex-shrink-0 w-20 text-right tabular-nums">{value}</div>
    </div>
  )
}

// Componente interno que usa o hook useCart
function CartPageContent() {
  const { cart, removeFromCart, updateQuantity, isLoading } = useCart()
  const router = useRouter()
  const [deliveryFee, setDeliveryFee] = useState(5.0)
  const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({})

  // Calcular subtotal e total
  const subtotal = cart.reduce((sum, item) => {
    // Usar o preço original (já com adicionais) se disponível, senão calcular
    if (item.originalPrice) {
      return sum + (item.originalPrice * item.quantity)
    }
    
    // Cálculo para compatibilidade com itens antigos
    const itemTotal = item.price * item.quantity
    const additionalsTotal = (item.additionals || []).reduce(
      (sum, additional) => sum + additional.price * (additional.quantity || 1), 
      0
    )
    
    return sum + (itemTotal + additionalsTotal)
  }, 0)
  const total = subtotal + deliveryFee

  // Carregar taxa de entrega da configuração da loja
  useEffect(() => {
    const loadDeliveryFee = async () => {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig && storeConfig.deliveryFee !== undefined) {
          setDeliveryFee(storeConfig.deliveryFee)
        }
      } catch (error) {
        console.error("Erro ao carregar taxa de entrega:", error)
      }
    }

    loadDeliveryFee()
  }, [])

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return

    // Marcar este item como atualizando
    setIsUpdating((prev) => ({ ...prev, [id]: true }))

    try {
      await updateQuantity(id, newQuantity)
    } finally {
      // Desmarcar este item como atualizando
      setIsUpdating((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleRemoveItem = async (id: number) => {
    await removeFromCart(id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
        </header>
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6 text-center">Adicione alguns produtos antes de finalizar o pedido</p>
          <Link href="/">
            <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-full">
              Ver produtos
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Carrinho</h1>
          </div>
          <div>
            <span className="text-sm bg-white text-purple-900 px-2 py-1 rounded-full">
              {cart.length} {cart.length === 1 ? "item" : "itens"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-3 sm:p-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold text-purple-900">Itens do Carrinho</h2>
          </div>

          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={`${item.id}`} className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start">
                  {/* Primeira linha: imagem e informações principais */}
                  <div className="flex w-full mb-3 sm:mb-0">
                    {item.image && (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex-shrink-0 mr-3 sm:mr-4">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        {/* Nome do produto e preço base */}
                        <div className="flex justify-between">
                          <span className="font-medium text-sm sm:text-base truncate pr-2">
                            {item.quantity}x {item.name} <span className="text-xs text-gray-500">({item.size})</span>
                          </span>
                          <span className="text-sm sm:text-base whitespace-nowrap">{formatCurrency(item.price)}</span>
                        </div>
                        
                        {/* Lista de adicionais */}
                        {item.additionals && item.additionals.length > 0 && (
                          <div className="ml-2 sm:ml-4">
                            <ul className="text-xs text-gray-600 space-y-1">
                              {item.additionals.map((additional, index) => (
                                <li key={index} className="flex justify-between">
                                  <span className="truncate pr-2">+ {additional.quantity}x {additional.name}</span>
                                  <span className="whitespace-nowrap">{additional.price === 0 ? "Grátis" : `+ ${formatCurrency(additional.price * (additional.quantity || 1))}`}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Subtotal do item */}
                        <div className="pt-2 border-t border-gray-100 mt-2">
                          <div className="flex justify-between font-medium text-sm">
                            <span>Subtotal:</span>
                            <span>
                              {formatCurrency(
                                item.originalPrice 
                                  ? item.originalPrice * item.quantity 
                                  : (item.price + (item.additionals?.reduce((sum, a) => sum + (a.price * (a.quantity || 1)), 0) || 0)) * item.quantity
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Segunda linha: controles de quantidade e botão remover */}
                  <div className="flex items-center justify-between sm:justify-start sm:mt-2 w-full sm:w-auto">
                    <div className="flex items-center border rounded-md h-8">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 h-full w-8 flex items-center justify-center"
                        disabled={isUpdating[item.id]}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-2 sm:px-3 py-1 min-w-[1.5rem] sm:min-w-[2rem] text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 h-full w-8 flex items-center justify-center"
                        disabled={isUpdating[item.id]}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex items-center ml-4"
                      disabled={isUpdating[item.id]}
                      aria-label="Remover item"
                    >
                      <Trash2 size={14} className="mr-1" /> 
                      <span className="hidden xs:inline">Remover</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-purple-900 mb-3 sm:mb-4">Resumo do Pedido</h2>

          <div className="space-y-2">
            <ItemRow name="Subtotal" value={formatCurrency(subtotal)} />
            <ItemRow name="Taxa de entrega" value={formatCurrency(deliveryFee)} />
            <div className="pt-2 mt-2 border-t">
              <ItemRow 
                name="Total" 
                value={formatCurrency(total)} 
                className="text-base sm:text-lg font-bold text-purple-900"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
          <Link href="/" className="sm:flex-1 order-2 sm:order-1">
            <button className="w-full border-2 border-purple-700 text-purple-700 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200">
              Continuar Comprando
            </button>
          </Link>
          <Link href="/checkout" className="sm:flex-1 order-1 sm:order-2">
            <button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-3 rounded-lg font-semibold shadow-md transition-all duration-200 hover:shadow-lg">
              Finalizar Pedido
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Componente principal que envolve o conteúdo com CartProvider
export default function CartPage() {
  return (
    <CartProvider>
      <CartPageContent />
    </CartProvider>
  )
}
