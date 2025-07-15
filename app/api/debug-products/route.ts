import { NextResponse } from 'next/server'
import { ProductService } from '@/lib/services/product-service'

export async function GET() {
  try {
    const products = await ProductService.getActiveProducts()
    
    // Adicionar informações de debug
    const debugInfo = products.map(product => ({
      id: product.id,
      name: product.name,
      deliveryPrice: product.sizes?.[0]?.price || null,
      tablePrice: product.tableSizes?.[0]?.price || null,
      hasTablePrices: !!(product.tableSizes && product.tableSizes.length > 0),
      tableSizes: product.tableSizes || null,
      sizes: product.sizes || null
    }))
    
    const summary = {
      total: products.length,
      withTablePrices: debugInfo.filter(p => p.hasTablePrices).length,
      withoutTablePrices: debugInfo.filter(p => !p.hasTablePrices).length
    }
    
    return NextResponse.json({
      success: true,
      summary,
      products: debugInfo
    })
  } catch (error) {
    console.error('Erro ao buscar produtos para debug:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
} 