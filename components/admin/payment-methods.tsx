'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { PaymentMethodStats } from '@/lib/services/reports-service'

interface PaymentMethodsProps {
  paymentMethods: PaymentMethodStats[]
  title?: string
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ 
  paymentMethods, 
  title = 'Métodos de Pagamento' 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'PIX': return '💰'
      case 'Dinheiro': return '💵'
      case 'Cartão': return '💳'
      default: return '📊'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'PIX': return 'bg-green-500'
      case 'Dinheiro': return 'bg-blue-500'
      case 'Cartão': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const hasData = paymentMethods.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {hasData ? 'Distribuição por método' : 'Sem dados disponíveis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">💳</p>
              <p>Nenhum pagamento registrado</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico de pizza visual */}
            <div className="relative">
              <div className="w-48 h-48 mx-auto relative">
                {/* Círculo de fundo */}
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                
                {/* Segmentos do gráfico */}
                {paymentMethods.map((method, index) => {
                  const percentage = method.percentage
                  const rotation = paymentMethods
                    .slice(0, index)
                    .reduce((sum, prev) => sum + prev.percentage, 0) * 3.6
                  
                  return (
                    <div
                      key={method.method}
                      className={`absolute inset-0 rounded-full border-8 ${getMethodColor(method.method)}`}
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${
                          percentage >= 50 
                            ? '100% 0%, 100% 100%, 0% 100%, 0% 0%' 
                            : `${50 + 50 * Math.sin((percentage * 3.6) * Math.PI / 180)}% ${50 - 50 * Math.cos((percentage * 3.6) * Math.PI / 180)}%`
                        })`,
                        transform: `rotate(${rotation}deg)`,
                        zIndex: paymentMethods.length - index
                      }}
                    />
                  )
                })}
                
                {/* Centro do gráfico */}
                <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {formatNumber(paymentMethods.reduce((sum, method) => sum + method.count, 0))}
                    </div>
                    <div className="text-xs text-gray-500">
                      Transações
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de métodos */}
            <div className="space-y-2">
              {paymentMethods.map((method, index) => (
                <div 
                  key={method.method}
                  className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${getMethodColor(method.method)}`}></div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getMethodIcon(method.method)}</span>
                      <span className="font-medium text-gray-900">{method.method}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">
                      {method.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatNumber(method.count)} pedidos
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo financeiro */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-1 gap-4 text-sm">
                {paymentMethods.map((method) => (
                  <div key={method.method} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getMethodColor(method.method)}`}></div>
                      <span className="font-medium">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(method.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 