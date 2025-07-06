'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { SalesMetrics } from '@/lib/services/reports-service'

interface DashboardMetricsProps {
  metrics: SalesMetrics
  quickStats: {
    todaySales: number
    todayOrders: number
    weekSales: number
    monthSales: number
    pendingOrders: number
  }
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, quickStats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {/* Vendas de Hoje */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-800">Vendas Hoje</CardTitle>
          <CardDescription className="text-xs text-blue-600 hidden sm:block">
            {formatNumber(quickStats.todayOrders)} pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 sm:pt-6">
          <div className="text-lg sm:text-2xl font-bold text-blue-900">
            {formatCurrency(quickStats.todaySales)}
          </div>
          <div className="text-xs text-blue-600 sm:hidden mt-1">
            {formatNumber(quickStats.todayOrders)} pedidos
          </div>
        </CardContent>
      </Card>

      {/* Vendas da Semana */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-800">Vendas da Semana</CardTitle>
          <CardDescription className="text-xs text-green-600 hidden sm:block">
            Últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 sm:pt-6">
          <div className="text-lg sm:text-2xl font-bold text-green-900">
            {formatCurrency(quickStats.weekSales)}
          </div>
          <div className="text-xs text-green-600 sm:hidden mt-1">
            7 dias
          </div>
        </CardContent>
      </Card>

      {/* Vendas do Mês */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-purple-800">Vendas do Mês</CardTitle>
          <CardDescription className="text-xs text-purple-600 hidden sm:block">
            Últimos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 sm:pt-6">
          <div className="text-lg sm:text-2xl font-bold text-purple-900">
            {formatCurrency(quickStats.monthSales)}
          </div>
          <div className="text-xs text-purple-600 sm:hidden mt-1">
            30 dias
          </div>
        </CardContent>
      </Card>

      {/* Pedidos Pendentes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-orange-800">Pedidos Pendentes</CardTitle>
          <CardDescription className="text-xs text-orange-600 hidden sm:block">
            Aguardando processamento
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 sm:pt-6">
          <div className="text-lg sm:text-2xl font-bold text-orange-900">
            {formatNumber(quickStats.pendingOrders)}
          </div>
          <div className="text-xs text-orange-600 sm:hidden mt-1">
            Pendentes
          </div>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card className="border-indigo-200 bg-indigo-50 col-span-2 md:col-span-1">
        <CardHeader className="pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-indigo-800">Ticket Médio</CardTitle>
          <CardDescription className="text-xs text-indigo-600 hidden sm:block">
            Valor médio por pedido
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1 sm:pt-6">
          <div className="text-lg sm:text-2xl font-bold text-indigo-900">
            {formatCurrency(metrics.averageOrderValue)}
          </div>
          <div className="text-xs text-indigo-600 sm:hidden mt-1">
            Média por pedido
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 