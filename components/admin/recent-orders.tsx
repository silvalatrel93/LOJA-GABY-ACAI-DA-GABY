'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Order, OrderStatus } from '@/lib/types'

interface RecentOrdersProps {
  recentOrders: Order[]
  title?: string
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ 
  recentOrders, 
  title = 'Pedidos Recentes' 
}) => {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date | string) => {
    // Formatação segura sem problemas de timezone
    let dateObj: Date
    
    if (typeof date === 'string') {
      // Se for string, criar Date evitando problemas de timezone
      const [datePart, timePart] = date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      
      if (timePart) {
        const [hour, minute] = timePart.split(':').map(Number)
        dateObj = new Date(year, month - 1, day, hour, minute)
      } else {
        dateObj = new Date(year, month - 1, day)
      }
    } else {
      dateObj = date
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivering': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Novo'
      case 'preparing': return 'Preparando'
      case 'delivering': return 'Entregando'
      case 'delivered': return 'Entregue'
      case 'cancelled': return 'Cancelado'
      default: return 'Desconhecido'
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'new': return '🆕'
      case 'preparing': return '👨‍🍳'
      case 'delivering': return '🚚'
      case 'delivered': return '✅'
      case 'cancelled': return '❌'
      default: return '❓'
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix': return '💰'
      case 'money': return '💵'
      case 'card': return '💳'
      default: return '📊'
    }
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'pix': return 'PIX'
      case 'money': return 'Dinheiro'
      case 'card': return 'Cartão'
      default: return 'Outros'
    }
  }

  const hasData = recentOrders.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-gray-600">
          {hasData ? `${recentOrders.length} pedidos mais recentes` : 'Sem dados disponíveis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-48 sm:h-64 text-gray-500">
            <div className="text-center">
              <p className="text-base sm:text-lg mb-2">📋</p>
              <p className="text-sm sm:text-base">Nenhum pedido encontrado</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentOrders.map((order) => (
              <div 
                key={order.id}
                className="rounded-lg border overflow-hidden"
              >
                {/* Cabeçalho do pedido - clicável */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors gap-3 sm:gap-0"
                  onClick={() => toggleOrderExpansion(order.id)}
                >
                  {/* Info do pedido - layout mobile */}
                  <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1">
                    {/* Status */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} shrink-0`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      <span className="hidden sm:inline">{getStatusText(order.status)}</span>
                    </div>
                    
                    {/* Detalhes */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        #{order.id} - {order.customerName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(order.date)} • {order.items.length} item(s)
                      </div>
                      <div className="text-xs text-gray-500 mt-1 sm:hidden">
                        {order.customerPhone}
                      </div>
                    </div>
                  </div>

                  {/* Valor e seta - layout mobile */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center sm:justify-end">
                        <span className="mr-1">{getPaymentMethodIcon(order.paymentMethod)}</span>
                        <span className="hidden sm:inline">{formatPaymentMethod(order.paymentMethod)}</span>
                        <span className="sm:hidden">{formatPaymentMethod(order.paymentMethod).slice(0, 3)}</span>
                      </div>
                      {order.deliveryFee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          + {formatCurrency(order.deliveryFee)} entrega
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400 text-lg">
                      {expandedOrder === order.id ? '▼' : '▶'}
                    </div>
                  </div>
                  
                  {/* Telefone apenas no desktop */}
                  <div className="hidden sm:block text-xs text-gray-500 ml-4">
                    {order.customerPhone}
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {expandedOrder === order.id && (
                  <div className="border-t bg-gray-50 p-3 sm:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      
                      {/* Itens do pedido */}
                      <div className="order-1">
                        <h4 className="font-semibold text-gray-900 text-sm mb-2 sm:mb-3">📋 Itens do Pedido</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-start bg-white p-2 sm:p-3 rounded border gap-2 sm:gap-0">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-900">
                                  {item.name}
                                </div>
                                {item.size && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Tamanho: {item.size}
                                  </div>
                                )}
                                {item.additionals && item.additionals.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Adicionais: {item.additionals.map(add => add.name).join(', ')}
                                  </div>
                                )}
                                {item.needsSpoon && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    🥄 Precisa de colher
                                  </div>
                                )}
                              </div>
                              <div className="text-left sm:text-right sm:ml-4 shrink-0">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.quantity}x {formatCurrency(item.price)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  = {formatCurrency(item.quantity * item.price)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Informações de entrega e pagamento */}
                      <div className="space-y-3 sm:space-y-4 order-2">
                        {/* Endereço */}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">🏠 Endereço de Entrega</h4>
                          <div className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm">
                            {order.address ? (
                              <div className="space-y-1">
                                <div className="font-medium">{order.address.street}, {order.address.number}</div>
                                {order.address.complement && (
                                  <div className="text-gray-500">{order.address.complement}</div>
                                )}
                                <div className="text-gray-500">
                                  {order.address.neighborhood} - {order.address.city}
                                </div>
                                {order.address.zipCode && (
                                  <div className="text-gray-500">CEP: {order.address.zipCode}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500 font-medium">Retirada no local</div>
                            )}
                          </div>
                        </div>

                        {/* Pagamento */}
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm mb-2">💳 Pagamento</h4>
                          <div className="bg-white p-2 sm:p-3 rounded border text-xs sm:text-sm">
                            <div className="flex justify-between items-center">
                              <span>Método:</span>
                              <span className="font-medium">
                                {getPaymentMethodIcon(order.paymentMethod)} {formatPaymentMethod(order.paymentMethod)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(order.total - order.deliveryFee)}</span>
                            </div>
                            {order.deliveryFee > 0 && (
                              <div className="flex justify-between items-center mt-1">
                                <span>Taxa de entrega:</span>
                                <span>{formatCurrency(order.deliveryFee)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t font-semibold">
                              <span>Total:</span>
                              <span>{formatCurrency(order.total)}</span>
                            </div>
                            {order.paymentChange && (
                              <div className="flex justify-between items-center mt-1 text-green-600">
                                <span>Troco para:</span>
                                <span>{formatCurrency(Number(order.paymentChange))}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Resumo */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(recentOrders.reduce((sum, order) => sum + order.total, 0))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total Vendido
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {recentOrders.reduce((sum, order) => sum + order.items.length, 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Total Itens
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900 text-sm sm:text-base">
                    {formatCurrency(recentOrders.reduce((sum, order) => sum + order.deliveryFee, 0))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Taxa Entrega
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 