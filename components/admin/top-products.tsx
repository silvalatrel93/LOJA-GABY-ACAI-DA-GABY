'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ProductSales } from '@/lib/services/reports-service'

interface TopProductsProps {
  topProducts: ProductSales[]
  title?: string
}

export const TopProducts: React.FC<TopProductsProps> = ({ 
  topProducts, 
  title = 'Produtos Mais Vendidos' 
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

  const getRankingEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `${index + 1}º`
    }
  }

  const getRankingColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900'
      case 1: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900'
      case 2: return 'bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900'
      default: return 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900'
    }
  }

  const hasData = topProducts.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">
          {hasData ? `Top ${topProducts.length} produtos` : 'Sem dados disponíveis'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">🏆</p>
              <p>Nenhum produto vendido</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div 
                key={product.productName}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
              >
                {/* Ranking e nome do produto */}
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankingColor(index)}`}>
                    {index < 3 ? getRankingEmoji(index) : index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {product.productName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {product.categoryName !== 'N/A' && `${product.categoryName} • `}
                      {formatNumber(product.orderCount)} pedidos
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(product.totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatNumber(product.totalQuantity)} vendidos
                  </div>
                </div>
              </div>
            ))}

            {/* Resumo */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(topProducts.reduce((sum, product) => sum + product.totalRevenue, 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Receita Total
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {formatNumber(topProducts.reduce((sum, product) => sum + product.totalQuantity, 0))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Unidades Vendidas
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