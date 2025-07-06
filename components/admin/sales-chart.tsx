'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { PeriodSales } from '@/lib/services/reports-service'

interface SalesChartProps {
  dailySales: PeriodSales[]
  title?: string
}

export const SalesChart: React.FC<SalesChartProps> = ({ 
  dailySales, 
  title = 'Vendas Diárias' 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    // Formatação segura sem problemas de timezone
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}`
  }

  // Calcular valor máximo para escala do gráfico
  const maxValue = Math.max(...dailySales.map(item => item.sales))
  const hasData = dailySales.length > 0 && maxValue > 0

  // Pegar últimos 7 dias para visualização
  const lastWeekSales = dailySales.slice(-7)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {hasData ? `Últimos ${lastWeekSales.length} dias` : 'Sem dados disponíveis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">📊</p>
              <p>Nenhuma venda registrada</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gráfico de barras */}
            <div className="flex items-end justify-between h-48 px-2">
              {lastWeekSales.map((item, index) => {
                const heightPercentage = (item.sales / maxValue) * 100
                const isHighest = item.sales === maxValue
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group">
                    {/* Barra */}
                    <div 
                      className="w-full max-w-[40px] mx-1 rounded-t-md transition-all duration-300 cursor-pointer hover:opacity-80"
                      style={{ 
                        height: `${Math.max(heightPercentage, 8)}%`,
                        background: isHighest 
                          ? 'linear-gradient(to top, #10b981, #34d399)' 
                          : 'linear-gradient(to top, #3b82f6, #60a5fa)'
                      }}
                      title={`${formatDate(item.date)}: ${formatCurrency(item.sales)} (${item.orders} pedidos)`}
                    />
                    
                    {/* Valor */}
                    <div className="mt-2 text-xs font-medium text-gray-700 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.sales)}
                    </div>
                    
                    {/* Data */}
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {formatDate(item.date)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex justify-between items-center text-xs text-gray-600 pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ background: 'linear-gradient(to top, #3b82f6, #60a5fa)' }}
                  ></div>
                  <span>Vendas</span>
                </div>
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ background: 'linear-gradient(to top, #10b981, #34d399)' }}
                  ></div>
                  <span>Maior valor</span>
                </div>
              </div>
              <div className="text-right">
                <div>Máximo: {formatCurrency(maxValue)}</div>
                <div>Total: {formatCurrency(lastWeekSales.reduce((sum, item) => sum + item.sales, 0))}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 