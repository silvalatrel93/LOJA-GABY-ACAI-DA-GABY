"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { useCart, CartProvider } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import { saveOrder } from "@/lib/services/order-service"
import { getStoreConfig } from "@/lib/services/store-config-service"
import { getStoreStatus } from "@/lib/store-utils"

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
function CheckoutPageContent() {
  const { cart, clearCart } = useCart()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    neighborhood: "",
    number: "",
    complement: "",
    paymentMethod: "pix",
  })
  const [deliveryFee, setDeliveryFee] = useState(5.0)
  const [storeConfig, setStoreConfig] = useState<{ name: string; delivery_fee: number } | null>(null)
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, statusText: "", statusClass: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar configurações da loja e status
  useEffect(() => {
    const loadStoreConfig = async () => {
      try {
        const config = await getStoreConfig()
        setStoreConfig(config)
        if (config && config.delivery_fee !== undefined) {
          setDeliveryFee(config.delivery_fee)
        }
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error)
      }
    }

    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreConfig()
    loadStoreStatus()
  }, [])

  // Calcular subtotal e total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + deliveryFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!storeStatus.isOpen) {
      alert("A loja está fechada no momento. Por favor, tente novamente quando estivermos abertos.")
      return
    }

    if (cart.length === 0) {
      alert("Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido.")
      return
    }

    setIsSubmitting(true)

    try {
      // Criar objeto do pedido
      const order = {
        customerName: formData.name,
        customerPhone: formData.phone,
        address: {
          street: formData.address,
          number: formData.number,
          neighborhood: formData.neighborhood,
          complement: formData.complement,
        },
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          price: item.price,
          quantity: item.quantity,
          additionals: item.additionals,
        })),
        subtotal,
        deliveryFee,
        total,
        paymentMethod: formData.paymentMethod,
        status: "new",
        date: new Date(),
        printed: false,
      }

      // Salvar pedido no banco de dados
      await saveOrder(order)

      // Formatar mensagem para WhatsApp
      let message = `*Novo Pedido de Açaí*\n\n`
      message += `*Cliente:* ${formData.name}\n`
      message += `*Telefone:* ${formData.phone}\n\n`

      message += `*Endereço de Entrega:*\n`
      message += `${formData.address}, ${formData.number}\n`
      message += `Bairro: ${formData.neighborhood}\n`
      if (formData.complement) message += `Complemento: ${formData.complement}\n\n`

      message += `*Itens do Pedido:*\n`
      cart.forEach((item) => {
        message += `- ${item.quantity}x ${item.name} (${item.size}) - ${formatCurrency(item.price * item.quantity)}\n`

        // Adicionar adicionais ao pedido
        if (item.additionals && item.additionals.length > 0) {
          message += `  *Adicionais:*\n`
          item.additionals.forEach((additional) => {
            message += `  • ${additional.quantity}x ${additional.name} - ${formatCurrency(additional.price * additional.quantity)}\n`
          })
        }
      })

      message += `\n*Subtotal:* ${formatCurrency(subtotal)}\n`
      message += `*Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n`
      message += `*Total:* ${formatCurrency(total)}\n\n`

      message += `*Forma de Pagamento:* ${formData.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}`

      // Codificar mensagem para URL do WhatsApp
      const encodedMessage = encodeURIComponent(message)

      // Número do WhatsApp da loja (substitua pelo número real)
      const whatsappNumber = "5511999999999"

      // Criar URL do WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

      // Limpar carrinho
      await clearCart()

      // Abrir WhatsApp
      window.open(whatsappUrl, "_blank")

      // Redirecionar para a página inicial
      router.push("/")
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error)
      alert("Ocorreu um erro ao finalizar o pedido. Por favor, tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-purple-900 text-white p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center">
            <Link href="/" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Checkout</h1>
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
        <div className="container mx-auto flex items-center">
          <Link href="/carrinho" className="mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold">Finalizar Pedido</h1>
        </div>
      </header>

      {!storeStatus.isOpen && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock size={20} className="text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                A loja está fechada no momento. Você não poderá finalizar o pedido até que a loja esteja aberta.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 container mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Informações Pessoais</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  inputMode="tel"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Endereço de Entrega</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Rua
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    id="neighborhood"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="complement" className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento (opcional)
                </label>
                <input
                  type="text"
                  id="complement"
                  name="complement"
                  value={formData.complement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Forma de Pagamento</h2>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="pix"
                  name="paymentMethod"
                  value="pix"
                  checked={formData.paymentMethod === "pix"}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="pix" className="ml-2 block text-sm text-gray-700">
                  PIX
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleChange}
                  className="h-5 w-5 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="card" className="ml-2 block text-sm text-gray-700">
                  Cartão na Entrega
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Resumo do Pedido</h2>

            <div className="space-y-2">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}`} className="mb-2">
                  <ItemRow
                    name={`${item.quantity}x ${item.name} (${item.size})`}
                    value={formatCurrency(item.price * item.quantity)}
                  />

                  {/* Mostrar adicionais se houver */}
                  {item.additionals && item.additionals.length > 0 && (
                    <div className="ml-4 text-sm text-gray-600 mt-1">
                      {item.additionals.map((additional, index) => (
                        <ItemRow
                          key={index}
                          name={`+ ${additional.quantity}x ${additional.name}`}
                          value={formatCurrency(additional.price * additional.quantity)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <ItemRow name="Subtotal" value={formatCurrency(subtotal)} />
                <ItemRow name="Taxa de entrega" value={deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"} />
                <div className="font-bold text-lg pt-2 mt-2 border-t">
                  <ItemRow name="Total" value={formatCurrency(total)} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!storeStatus.isOpen || isSubmitting}
            className={`w-full ${
              storeStatus.isOpen && !isSubmitting ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            } text-white py-3 rounded-lg font-semibold flex items-center justify-center sticky bottom-4 shadow-lg`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                Processando...
              </>
            ) : storeStatus.isOpen ? (
              "Finalizar e Enviar pelo WhatsApp"
            ) : (
              "Loja Fechada - Não é possível finalizar"
            )}
          </button>
        </form>
      </div>
      <footer className="bg-purple-900 text-white p-4 mt-auto">
        <div className="text-center">
          <p>
            © {new Date().getFullYear()} {storeConfig?.name || "Açaí Delícia"} - Todos os direitos reservados
          </p>
          <p className="text-sm mt-2">Horário de funcionamento: 10h às 22h</p>
        </div>
      </footer>
    </div>
  )
}

// Componente principal que envolve o conteúdo com o CartProvider
export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutPageContent />
    </CartProvider>
  )
}
