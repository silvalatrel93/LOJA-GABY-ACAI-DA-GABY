"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, ArrowLeft, ShoppingBag, Clock } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
// Adicionar importação do getStoreConfig
import { getStoreConfig } from "@/lib/db"
import { getStoreStatus } from "@/lib/store-utils"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const [total, setTotal] = useState(0)
  // Adicionar estado para a taxa de entrega
  const [deliveryFee, setDeliveryFee] = useState(5.0)
  const [storeConfig, setStoreConfig] = useState<{ name: string; deliveryFee: number } | null>(null)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })

  // Adicionar useEffect para carregar a taxa de entrega e o nome da loja
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setDeliveryFee(config.deliveryFee)
        setStoreConfig(config)
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      }
    }

    loadStoreConfig()
  }, [])

  useEffect(() => {
    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  // Atualizar o cálculo do total
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    setTotal(newTotal)
  }, [cart])

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
          <ShoppingBag size={64} className="text-purple-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6 text-center">Adicione alguns produtos deliciosos para continuar</p>
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
        <div className="container mx-auto flex items-center">
          <Link href="/" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Carrinho</h1>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        {!storeStatus.isOpen && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock size={20} className="text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  A loja está fechada no momento. Você pode visualizar seu carrinho, mas não poderá finalizar o pedido
                  até que a loja esteja aberta.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Itens do Carrinho</h2>

          <div className="divide-y">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="py-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 relative mr-4">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">Tamanho: {item.size}</p>
                    <div className="flex items-center mt-1">
                      <button
                        className="w-8 h-8 bg-purple-100 text-purple-900 rounded-l-md flex items-center justify-center"
                        onClick={() => updateQuantity(item.id, item.size, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <span className="w-8 h-8 bg-purple-50 flex items-center justify-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        className="w-8 h-8 bg-purple-100 text-purple-900 rounded-r-md flex items-center justify-center"
                        onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right mt-6">
                    <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    <button
                      className="text-red-500 mt-1 p-2"
                      onClick={() => removeFromCart(item.id, item.size)}
                      aria-label="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Mostrar adicionais se houver */}
                {item.additionals && item.additionals.length > 0 && (
                  <div className="mt-2 ml-20 bg-purple-50 p-2 rounded-md">
                    <p className="text-xs font-medium text-purple-900 mb-1">Adicionais:</p>
                    <ul className="space-y-1">
                      {item.additionals.map((additional, index) => (
                        <li key={index} className="flex justify-between text-xs text-gray-700">
                          <span>
                            {additional.quantity}x {additional.name}
                          </span>
                          <span>{formatCurrency(additional.price * additional.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Taxa de entrega</span>
            <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
            <span>Total</span>
            <span>{formatCurrency(total + deliveryFee)}</span>
          </div>
        </div>

        <Link href={storeStatus.isOpen ? "/checkout" : "#"}>
          <button
            className={`w-full ${
              storeStatus.isOpen ? "bg-purple-700 hover:bg-purple-800" : "bg-gray-400 cursor-not-allowed"
            } text-white py-3 rounded-lg font-semibold`}
            disabled={!storeStatus.isOpen}
            onClick={(e) => {
              if (!storeStatus.isOpen) {
                e.preventDefault()
                alert("A loja está fechada no momento. Por favor, tente novamente quando estivermos abertos.")
              }
            }}
          >
            {storeStatus.isOpen ? "Finalizar Pedido" : "Loja Fechada - Não é possível finalizar"}
          </button>
        </Link>
      </div>
      <footer className="bg-purple-900 text-white p-4 mt-auto">
        <div className="text-center">
          <p>
            © {new Date().getFullYear()} {storeConfig?.name || "Açaí Delícia"} - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
