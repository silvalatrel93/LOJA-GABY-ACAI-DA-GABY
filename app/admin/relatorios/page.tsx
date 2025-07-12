'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMetrics } from '@/components/admin/dashboard-metrics'
import { SalesChart } from '@/components/admin/sales-chart'
import { TopProducts } from '@/components/admin/top-products'
import { PaymentMethods } from '@/components/admin/payment-methods'
import { RecentOrders } from '@/components/admin/recent-orders'
import { ReportsService, SalesReportData, ReportFilters } from '@/lib/services/reports-service'
import { OrderStatus } from '@/lib/types'

export default function RelatoriosPage() {
  // Estados
  const [reportData, setReportData] = useState<SalesReportData | null>({
    metrics: {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      totalDeliveryFees: 0
    },
    dailySales: [],
    topProducts: [],
    paymentMethods: [],
    recentOrders: []
  })
  const [quickStats, setQuickStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    weekSales: 0,
    monthSales: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    status: [],
    paymentMethod: []
  })

  // Predefinir datas padrão (desde janeiro de 2025 até dezembro de 2025)
  const getDefaultDateRange = () => {
    const start = new Date('2025-01-01')
    const end = new Date('2025-12-31')
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  // Formatar data sem problemas de timezone
  const formatDateSafe = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  // Carregar dados iniciais
  useEffect(() => {
    const defaultRange = getDefaultDateRange()
    setFilters(prev => ({
      ...prev,
      startDate: defaultRange.start,
      endDate: defaultRange.end
    }))
    
    loadReportData({
      startDate: defaultRange.start,
      endDate: defaultRange.end
    })
    loadQuickStats()
  }, [])

  // Carregar dados do relatório
  const loadReportData = async (filterData: ReportFilters) => {
    try {
      setLoading(true)
      console.log('🔍 Carregando relatório com filtros:', filterData)
      const data = await ReportsService.getSalesReport(filterData)
      console.log('📊 Dados do relatório carregados:', data)
      setReportData(data)
    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar estatísticas rápidas
  const loadQuickStats = async () => {
    try {
      console.log('📈 Carregando estatísticas rápidas...')
      const stats = await ReportsService.getQuickStats()
      console.log('✅ Estatísticas rápidas carregadas:', stats)
      setQuickStats(stats)
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas rápidas:', error)
    }
  }

  // Aplicar filtros
  const applyFilters = () => {
    loadReportData(filters)
  }

  // Resetar filtros
  const resetFilters = () => {
    const defaultRange = getDefaultDateRange()
    const newFilters = {
      startDate: defaultRange.start,
      endDate: defaultRange.end,
      status: [],
      paymentMethod: []
    }
    setFilters(newFilters)
    loadReportData(newFilters)
  }

  // Atualizar filtro de período rápido
  const setQuickPeriod = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    const newFilters = {
      ...filters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
    setFilters(newFilters)
    loadReportData(newFilters)
  }

  // Skeleton para carregamento
  const LoadingSkeleton = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Skeleton das métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 sm:pb-6">
              <Skeleton className="h-3 sm:h-4 w-16 sm:w-24" />
              <Skeleton className="h-2 sm:h-3 w-12 sm:w-16" />
            </CardHeader>
            <CardContent className="pt-2 sm:pt-6">
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Skeleton dos gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico principal - largura total */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 sm:h-64 w-full" />
          </CardContent>
        </Card>
        
        {/* Outros componentes */}
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 sm:h-64 w-full" />
            </CardContent>
          </Card>
        ))}
        
        {/* Pedidos recentes - largura total */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 sm:h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Header roxo responsivo */}
      <header className="bg-gradient-to-r from-purple-700 via-purple-800 to-purple-900 text-white p-3 sm:p-4 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={() => window.history.back()}
              className="mr-2 sm:mr-4 hover:bg-white/10 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="sm:hidden"
              >
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="hidden sm:block"
              >
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent truncate">
                <span className="hidden sm:inline">Dashboard de Relatórios</span>
                <span className="sm:hidden">Relatórios</span>
              </h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-0.5 truncate hidden xs:block">
                <span className="hidden sm:inline">Análise de vendas e histórico de pedidos</span>
                <span className="sm:hidden">Vendas e pedidos</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="bg-white/10 hover:bg-white/20 p-1.5 sm:p-2 rounded-lg transition-colors"
              title="Atualizar dados"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="sm:hidden"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="hidden sm:block"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-2 sm:p-4">

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
            <CardDescription className="text-sm">Configure os filtros para personalizar os relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Período rápido */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label className="text-sm font-medium">Período Rápido</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickPeriod(7)}
                    disabled={loading}
                    className="text-xs sm:text-sm"
                  >
                    7 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickPeriod(30)}
                    disabled={loading}
                    className="text-xs sm:text-sm"
                  >
                    30 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickPeriod(90)}
                    disabled={loading}
                    className="text-xs sm:text-sm"
                  >
                    90 dias
                  </Button>
                </div>
              </div>

              {/* Data início */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-medium">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  disabled={loading}
                  className="text-sm"
                />
              </div>

              {/* Data fim */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-medium">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  disabled={loading}
                  className="text-sm"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={filters.status?.[0] || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? [] : [value as OrderStatus] 
                  }))}
                  disabled={loading}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="preparing">Preparando</SelectItem>
                    <SelectItem value="delivering">Entregando</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mt-4 sm:mt-6">
              <div className="flex flex-wrap items-center gap-2">
                {filters.startDate && filters.endDate && (
                  <Badge variant="outline" className="text-xs">
                    {formatDateSafe(filters.startDate)} - {formatDateSafe(filters.endDate)}
                  </Badge>
                )}
                {filters.status && filters.status.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Status: {filters.status.join(', ')}
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  disabled={loading}
                  className="text-sm w-full sm:w-auto"
                >
                  Resetar
                </Button>
                <Button
                  onClick={applyFilters}
                  disabled={loading}
                  className="text-sm w-full sm:w-auto"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo principal */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Métricas principais */}
            <DashboardMetrics
              metrics={reportData?.metrics || {
                totalSales: 0,
                totalOrders: 0,
                averageOrderValue: 0,
                totalDeliveryFees: 0
              }}
              quickStats={quickStats}
            />

            {/* Gráficos e tabelas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Gráfico de vendas - largura total no mobile */}
              <div className="lg:col-span-2">
                <SalesChart dailySales={reportData?.dailySales || []} />
              </div>

              {/* Produtos mais vendidos */}
              <TopProducts topProducts={reportData?.topProducts || []} />

              {/* Métodos de pagamento */}
              <PaymentMethods paymentMethods={reportData?.paymentMethods || []} />

              {/* Pedidos recentes - largura total */}
              <div className="lg:col-span-2">
                <RecentOrders recentOrders={reportData?.recentOrders || []} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 