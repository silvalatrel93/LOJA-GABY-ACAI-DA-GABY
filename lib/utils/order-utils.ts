import type { OrderItem } from '@/lib/types'

/**
 * Função utilitária para garantir que order.items seja sempre um array válido
 * @param items - Os items do pedido que podem estar como string JSON ou array
 * @returns Array de OrderItem válido
 */
export const ensureOrderItemsArray = (items: any): OrderItem[] => {
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(items) ? items : []
}

/**
 * Função utilitária para verificar se um pedido contém apenas produtos de uma categoria específica
 * @param items - Items do pedido
 * @param categoryNames - Nomes das categorias a verificar
 * @returns true se todos os items pertencem às categorias especificadas
 */
export const isOrderOnlyFromCategories = (items: any, categoryNames: string[]): boolean => {
  const safeItems = ensureOrderItemsArray(items)
  return safeItems.every(item => 
    categoryNames.some(category => 
      item.name?.toLowerCase().includes(category.toLowerCase())
    )
  )
}
