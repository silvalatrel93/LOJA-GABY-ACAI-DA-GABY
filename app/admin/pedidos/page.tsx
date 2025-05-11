"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, RefreshCw } from "lucide-react"
import { getAllOrders, markOrderAsPrinted, updateOrderStatus, type Order } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import OrderLabelPrinter from "@/components/order-label-printer"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false)

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const ordersList = await getAllOrders()
      // Ordenar por data, mais recentes primeiro
      ordersList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setOrders(ordersList)
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleStatusChange = async (orderId: number, status: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, status)
      // Atualizar a lista de pedidos
      loadOrders()
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error)
      alert("Erro ao atualizar status do pedido. Tente novamente.")
    }
  }

  const handlePrintLabel = (order: Order) => {
    setSelectedOrder(order)
    setIsPrinterModalOpen(true)
  }

  const handlePrintComplete = async () => {
    if (selectedOrder?.id) {
      try {
        await markOrderAsPrinted(selectedOrder.id)
        loadOrders()
      } catch (error) {
        console.error("Erro ao marcar pedido como impresso:", error)
      }
    }
    setIsPrinterModalOpen(false)
    setSelectedOrder(null)
  }

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-yellow-100 text-yellow-800"
      case "delivering":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "new":
        return "Novo"
      case "preparing":
        return "Em Preparo"
      case "delivering":
        return "Em Entrega"
      case "completed":
        return "Concluído"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-purple-900 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin" className="mr-4">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold">Gerenciar Pedidos</h1>
          </div>
          <button
            onClick={loadOrders}
            className="bg-white text-purple-900 px-4 py-2 rounded-md font-medium flex items-center"
          >
            <RefreshCw size={18} className="mr-1" />
            Atualizar
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Pedidos Recebidos</h2>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum pedido recebido ainda.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(order.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)} mr-2`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.printed ? (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Impresso</span>
                        ) : (
                          <button
                            onClick={() => handlePrintLabel(order)}
                            className="bg-purple-100 text-purple-800 p-1 rounded-full"
                            title="Imprimir Etiqueta"
                          >
                            <Printer size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Cliente</h4>
                      <p>
                        {order.customerName} • {order.customerPhone}
                      </p>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Endereço</h4>
                      <p>
                        {order.address.street}, {order.address.number} - {order.address.neighborhood}
                        {order.address.complement && ` (${order.address.complement})`}
                      </p>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-medium text-sm text-gray-700">Itens</h4>
                      <ul className="space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.name} ({item.size})
                            </span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de entrega</span>
                        <span>{formatCurrency(order.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm text-gray-600">
                          Pagamento: {order.paymentMethod === "pix" ? "PIX" : "Cartão na Entrega"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Atualizar Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusChange(order.id!, "new")}
                          className={`px-2 py-1 text-xs rounded-md ${
                            order.status === "new"
                              ? "bg-blue-600 text-white"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          Novo
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id!, "preparing")}
                          className={`px-2 py-1 text-xs rounded-md ${
                            order.status === "preparing"
                              ? "bg-yellow-600 text-white"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          Em Preparo
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id!, "delivering")}
                          className={`px-2 py-1 text-xs rounded-md ${
                            order.status === "delivering"
                              ? "bg-purple-600 text-white"
                              : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          }`}
                        >
                          Em Entrega
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id!, "completed")}
                          className={`px-2 py-1 text-xs rounded-md ${
                            order.status === "completed"
                              ? "bg-green-600 text-white"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          Concluído
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id!, "cancelled")}
                          className={`px-2 py-1 text-xs rounded-md ${
                            order.status === "cancelled"
                              ? "bg-red-600 text-white"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          Cancelado
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Impressão */}
      {isPrinterModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-purple-900">Imprimir Etiqueta</h2>
            </div>

            <div className="p-4">
              <OrderLabelPrinter order={selectedOrder} onPrintComplete={handlePrintComplete} />
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsPrinterModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
