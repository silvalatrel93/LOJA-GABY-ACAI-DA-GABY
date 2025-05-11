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
function ItemRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center w-full">
      <div className="flex-grow">{name}</div>
      <div className="flex-shrink-0 w-16 text-right tabular-nums">{value}</div>
    </div>
  )
}

// Componente interno que usa o hook useCart
function CartPageContent() {
  const { cart, removeFromCart, updateQuantity, isLoading } = useCart()
  const router = useRouter()
  const [deliveryFee, setDeliveryFee] = useState(5.0)

  // Calcular subtotal e total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + deliveryFee

  // Carregar taxa de entrega da configuração da loja
  useEffect(() => {
    const loadDeliveryFee = async () => {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig && storeConfig.delivery_fee !== undefined) {
          setDeliveryFee(storeConfig.delivery_fee)
        }
      } catch (error) {
        console.error("Erro ao carregar taxa de entrega:", error)
      }
    }

    loadDeliveryFee()
  }, [])

  const handleQuantityChange = async (id: number, size: string, newQuantity: number) => {
    if (newQuantity < 1) return
    await updateQuantity(id, size, newQuantity)
  }

  const handleRemoveItem = async (id: number, size: string) => {
    await removeFromCart(id, size)
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

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-purple-900">Itens do Carrinho</h2>
          </div>

          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={`${item.id}-${item.size}`} className="p-4">
                <div className="flex items-start">
                  {item.image && (
                    <div className="w-16 h-16 relative flex-shrink-0 mr-4">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <ItemRow
                      name={`${item.quantity}x ${item.name} (${item.size})`}
                      value={formatCurrency(item.price * item.quantity)}
                    />

                    {/* Adicionais */}
                    {item.additionals && item.additionals.length > 0 && (
                      <div className="mt-1 ml-4">
                        <p className="text-xs text-gray-500 mb-1">Adicionais:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {item.additionals.map((additional, index) => (
                            <li key={index}>
                              <ItemRow
                                name={`+ ${additional.quantity}x ${additional.name}`}
                                value={formatCurrency(additional.price * additional.quantity)}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex items-center border rounded-md mr-4">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.size, item.quantity - 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.size, item.quantity + 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.size)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center"
                      >
                        <Trash2 size={14} className="mr-1" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Resumo do Pedido</h2>

          <div className="space-y-2">
            <ItemRow name="Subtotal" value={formatCurrency(subtotal)} />
            <ItemRow name="Taxa de entrega" value={formatCurrency(deliveryFee)} />
            <div className="pt-2 mt-2 border-t">
              <ItemRow name="Total" value={formatCurrency(total)} />
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Link href="/" className="flex-1">
            <button className="w-full border border-purple-700 text-purple-700 py-3 rounded-lg font-semibold">
              Continuar Comprando
            </button>
          </Link>
          <Link href="/checkout" className="flex-1">
            <button className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-semibold">
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
