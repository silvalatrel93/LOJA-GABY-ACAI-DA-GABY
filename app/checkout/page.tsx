"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { formatCurrency } from "@/lib/utils"
import { saveOrder, getStoreConfig } from "@/lib/db"
import { getStoreStatus } from "@/lib/store-utils"
import { ArrowLeft, Clock } from "lucide-react"

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    neighborhood: "",
    number: "",
    complement: "",
    paymentMethod: "pix",
  })

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

    const loadStoreStatus = async () => {
      const status = await getStoreStatus()
      setStoreStatus(status)
    }

    loadStoreStatus()
  }, [])

  // Atualizar o cálculo do total
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal + deliveryFee

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Salvar o pedido no IndexedDB
    try {
      // Atualizar o objeto de pedido para usar a taxa de entrega dinâmica
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

      await saveOrder(order)
    } catch (error) {
      console.error("Erro ao salvar pedido:", error)
    }

    // Format the order message for WhatsApp
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
    // Atualizar a mensagem do WhatsApp
    message += `*Taxa de Entrega:* ${formatCurrency(deliveryFee)}\n`
    message += `*Total:* ${formatCurrency(total)}\n\n`

    message += `*Forma de Pagamento:* ${formData.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}`

    // Encode the message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message)

    // Replace with your actual WhatsApp business number
    const whatsappNumber = "5511999999999"

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

    // Clear cart and redirect to WhatsApp
    clearCart()
    window.open(whatsappUrl, "_blank")
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
                <div key={`${item.id}-${item.size}`} className="flex flex-col">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name} ({item.size})
                    </span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>

                  {/* Mostrar adicionais se houver */}
                  {item.additionals && item.additionals.length > 0 && (
                    <div className="ml-4 text-sm text-gray-600">
                      {item.additionals.map((additional, index) => (
                        <div key={index} className="flex justify-between">
                          <span>
                            + {additional.quantity}x {additional.name}
                          </span>
                          <span>{formatCurrency(additional.price * additional.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!storeStatus.isOpen}
            className={`w-full ${
              storeStatus.isOpen ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
            } text-white py-3 rounded-lg font-semibold flex items-center justify-center sticky bottom-4 shadow-lg`}
            onClick={(e) => {
              if (!storeStatus.isOpen) {
                e.preventDefault()
                alert("A loja está fechada no momento. Por favor, tente novamente quando estivermos abertos.")
              }
            }}
          >
            {storeStatus.isOpen ? "Finalizar e Enviar pelo WhatsApp" : "Loja Fechada - Não é possível finalizar"}
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
