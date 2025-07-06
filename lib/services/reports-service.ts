import { supabase } from './supabase-client'
import { Order, OrderStatus } from '../types'

// Interfaces para relatórios
export interface SalesMetrics {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  totalDeliveryFees: number
}

export interface PeriodSales {
  date: string
  sales: number
  orders: number
}

export interface ProductSales {
  productName: string
  categoryName: string
  totalQuantity: number
  totalRevenue: number
  orderCount: number
}

export interface PaymentMethodStats {
  method: string
  count: number
  percentage: number
  totalAmount: number
}

export interface SalesReportData {
  metrics: SalesMetrics
  dailySales: PeriodSales[]
  topProducts: ProductSales[]
  paymentMethods: PaymentMethodStats[]
  recentOrders: Order[]
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  status?: OrderStatus[]
  paymentMethod?: string[]
}

export const ReportsService = {
  // Obter relatório completo de vendas
  async getSalesReport(filters: ReportFilters = {}): Promise<SalesReportData> {
    try {
      
      // Construir filtros de data
      const { startDate, endDate, status, paymentMethod } = filters
      let query = supabase
        .from('orders')
        .select('*')
      
      // Aplicar filtros
      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }
      if (status && status.length > 0) {
        query = query.in('status', status)
      }
      if (paymentMethod && paymentMethod.length > 0) {
        query = query.in('payment_method', paymentMethod)
      }

      // Excluir pedidos cancelados por padrão
      if (!status || !status.includes('cancelled')) {
        query = query.neq('status', 'cancelled')
      }

      const { data: orders, error } = await query.order('date', { ascending: false })

      if (error) {
        console.error('Erro ao buscar pedidos para relatório:', error)
        throw error
      }

      // Processar dados
      const processedOrders = orders || []
      
      // Calcular métricas gerais
      const metrics = this.calculateMetrics(processedOrders)
      
      // Vendas por dia
      const dailySales = this.calculateDailySales(processedOrders)
      
      // Produtos mais vendidos
      const topProducts = this.calculateTopProducts(processedOrders)
      
      // Métodos de pagamento
      const paymentMethods = this.calculatePaymentMethods(processedOrders)
      
      // Pedidos recentes (últimos 10)
      const recentOrders = processedOrders
        .slice(0, 10)
        .map(order => this.formatOrder(order))

      return {
        metrics,
        dailySales,
        topProducts,
        paymentMethods,
        recentOrders
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error)
      throw error
    }
  },

  // Calcular métricas gerais
  calculateMetrics(orders: any[]): SalesMetrics {
    const totalSales = orders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
    const totalDeliveryFees = orders.reduce((sum: number, order: any) => sum + (Number(order.delivery_fee) || 0), 0)

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      totalDeliveryFees
    }
  },

  // Calcular vendas por dia
  calculateDailySales(orders: any[]): PeriodSales[] {
    const salesByDate: Record<string, { sales: number; orders: number }> = {}

    orders.forEach((order: any) => {
      const date = new Date(order.date).toISOString().split('T')[0]
      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, orders: 0 }
      }
      salesByDate[date].sales += Number(order.total) || 0
      salesByDate[date].orders += 1
    })

    return Object.entries(salesByDate)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  // Calcular produtos mais vendidos
  calculateTopProducts(orders: any[]): ProductSales[] {
    const productStats: Record<string, {
      categoryName: string
      totalQuantity: number
      totalRevenue: number
      orderCount: Set<number>
    }> = {}

    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const key = item.name || 'Produto sem nome'
          if (!productStats[key]) {
            productStats[key] = {
              categoryName: 'N/A',
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: new Set()
            }
          }
          
          productStats[key].totalQuantity += item.quantity || 0
          productStats[key].totalRevenue += (item.price || 0) * (item.quantity || 0)
          productStats[key].orderCount.add(order.id)
        })
      }
    })

    return Object.entries(productStats)
      .map(([productName, stats]) => ({
        productName,
        categoryName: stats.categoryName,
        totalQuantity: stats.totalQuantity,
        totalRevenue: stats.totalRevenue,
        orderCount: stats.orderCount.size
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  },

  // Calcular estatísticas de métodos de pagamento
  calculatePaymentMethods(orders: any[]): PaymentMethodStats[] {
    const methodStats: Record<string, { count: number; totalAmount: number }> = {}
    const totalOrders = orders.length

    orders.forEach((order: any) => {
      const method = order.payment_method || 'unknown'
      if (!methodStats[method]) {
        methodStats[method] = { count: 0, totalAmount: 0 }
      }
      methodStats[method].count += 1
      methodStats[method].totalAmount += Number(order.total) || 0
    })

    return Object.entries(methodStats)
      .map(([method, stats]) => ({
        method: this.formatPaymentMethod(method),
        count: stats.count,
        percentage: totalOrders > 0 ? (stats.count / totalOrders) * 100 : 0,
        totalAmount: stats.totalAmount
      }))
      .sort((a, b) => b.count - a.count)
  },

  // Formatar método de pagamento
  formatPaymentMethod(method: string): string {
    switch (method) {
      case 'pix': return 'PIX'
      case 'money': return 'Dinheiro'
      case 'card': return 'Cartão'
      default: return 'Outros'
    }
  },

  // Formatar pedido para exibição
  formatOrder(order: any): Order {
    return {
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      address: {
        street: order.address?.street || '',
        number: order.address?.number || '',
        neighborhood: order.address?.neighborhood || '',
        complement: order.address?.complement || '',
        addressType: order.address?.addressType || '',
        city: order.address?.city || '',
        state: order.address?.state || '',
        zipCode: order.address?.zipCode || '',
        reference: order.address?.reference || ''
      },
      items: order.items?.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        additionals: item.additionals || [],
        needsSpoon: item.needsSpoon,
        spoonQuantity: item.spoonQuantity,
        notes: item.notes
      })) || [],
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      paymentMethod: order.payment_method,
      paymentChange: order.payment_change,
      status: order.status as OrderStatus,
      date: new Date(order.date),
      printed: order.printed || false,
      notified: order.notified || false
    }
  },

  // Obter estatísticas rápidas para dashboard
  async getQuickStats(): Promise<{
    todaySales: number
    todayOrders: number
    weekSales: number
    monthSales: number
    pendingOrders: number
  }> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Vendas de hoje
      const { data: todayData } = await supabase
        .from('orders')
        .select('total')
        .gte('date', today)
        .neq('status', 'cancelled')

      // Vendas da semana
      const { data: weekData } = await supabase
        .from('orders')
        .select('total')
        .gte('date', weekAgo)
        .neq('status', 'cancelled')

      // Vendas do mês
      const { data: monthData } = await supabase
        .from('orders')
        .select('total')
        .gte('date', monthAgo)
        .neq('status', 'cancelled')

      // Pedidos pendentes
      const { data: pendingData } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['new', 'preparing', 'delivering'])

      return {
        todaySales: todayData?.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0) || 0,
        todayOrders: todayData?.length || 0,
        weekSales: weekData?.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0) || 0,
        monthSales: monthData?.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0) || 0,
        pendingOrders: pendingData?.length || 0
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas rápidas:', error)
      return {
        todaySales: 0,
        todayOrders: 0,
        weekSales: 0,
        monthSales: 0,
        pendingOrders: 0
      }
    }
  }
} 