"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import { Trash2, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { createSafeKey } from "@/lib/key-utils"

// Função para limpar a exibição do tamanho
function cleanSizeDisplay(size: string): string {
  return size.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, isLoading } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdatingItemId(id)

    try {
      await updateQuantity(id, newQuantity)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRemoveItem = async (id: number) => {
    setUpdatingItemId(id)

    try {
      await removeFromCart(id)
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setIsProcessing(true)
    router.push("/checkout")
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      item.price * item.quantity +
      (item.additionals?.reduce((addSum, add) => addSum + add.price * (add.quantity || 1), 0) || 0),
    0,
  )

  const deliveryFee = 5.0 // Valor fixo para exemplo
  const total = subtotal + deliveryFee

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Seu Carrinho</h1>

      {cart.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">Seu carrinho está vazio.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Continuar Comprando
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Itens do Carrinho</h2>
              </div>

              <ul className="divide-y divide-gray-200">
                {cart.map((item) => {
                  // Limpar o tamanho para exibição
                  const displaySize = cleanSizeDisplay(item.size)

                  return (
                    <li key={createSafeKey(item.id)} className="p-4">
                      <div className="flex items-center">
                        {item.image && (
                          <div className="relative h-16 w-16 flex-shrink-0">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        )}

                        <div className="ml-4 flex-grow">
                          <h3 className="text-sm font-medium text-gray-800">{item.name}</h3>
                          <p className="text-sm text-gray-600">Tamanho: {displaySize}</p>

                          {item.additionals && item.additionals.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-500">Adicionais:</p>
                              <ul className="text-xs text-gray-600">
                                {item.additionals.map((add, addIndex) => (
                                  <li key={createSafeKey(`${item.id}-${addIndex}`)}>
                                    {add.name} (x{add.quantity || 1}) {add.price === 0 ? "- Grátis" : `- R$ ${(add.price * (add.quantity || 1)).toFixed(2)}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          <div className="flex items-center border rounded-md mr-4">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
                              disabled={updatingItemId === item.id}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-2 py-1 text-sm min-w-[24px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-gray-600 hover:bg-gray-100 w-8 h-8 flex items-center justify-center"
                              disabled={updatingItemId === item.id}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center mt-1"
                              disabled={updatingItemId === item.id}
                            >
                              <Trash2 size={14} className="mr-1" /> Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="p-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push("/")}
                      className="text-purple-700 hover:underline flex items-center"
                    >
                      Continuar comprando
                    </button>
                  </div>
                  <button
                    onClick={() => clearCart()}
                    className="text-red-500 hover:underline"
                    data-testid="clear-cart"
                  >
                    Limpar carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Pedido</h2>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-800">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de Entrega</span>
                  <span className="text-gray-800">R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-purple-700">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-medium mt-4 disabled:opacity-50"
              >
                {isProcessing ? "Processando..." : "Finalizar Pedido"}
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full text-purple-600 hover:text-purple-800 text-center py-2 mt-2 text-sm"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
