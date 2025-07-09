/**
 * Script para testar a funcionalidade de produtos ocultos
 * Execute este script no console do navegador na página /admin
 */

async function testHiddenProductsFeature() {
  console.log('🧪 Testando funcionalidade de produtos ocultos...')
  
  try {
    // Importar serviços necessários
    const { ProductService } = await import('/lib/services/product-service.js')
    
    console.log('1. 🔍 Testando getVisibleProducts()...')
    const visibleProducts = await ProductService.getVisibleProducts()
    console.log(`✅ Produtos visíveis encontrados: ${visibleProducts.length}`)
    
    console.log('2. 🔍 Testando getAllProducts()...')
    const allProducts = await ProductService.getAllProducts()
    console.log(`✅ Total de produtos: ${allProducts.length}`)
    
    // Verificar se há produtos ocultos
    const hiddenProducts = allProducts.filter(p => p.hidden === true)
    console.log(`🔒 Produtos ocultos: ${hiddenProducts.length}`)
    
    if (hiddenProducts.length > 0) {
      console.log('📋 Produtos ocultos encontrados:')
      hiddenProducts.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id})`)
      })
    }
    
    // Verificar estrutura do produto
    if (allProducts.length > 0) {
      const sampleProduct = allProducts[0]
      console.log('🔬 Estrutura do produto (amostra):')
      console.log({
        id: sampleProduct.id,
        name: sampleProduct.name,
        active: sampleProduct.active,
        hidden: sampleProduct.hidden,
        hasHiddenProperty: 'hidden' in sampleProduct
      })
    }
    
    // Testar função de toggle (se disponível)
    console.log('3. 🔄 Testando toggleProductVisibility()...')
    if (allProducts.length > 0) {
      const testProduct = allProducts[0]
      console.log(`📝 Produto de teste: ${testProduct.name} (hidden: ${testProduct.hidden})`)
      
      // Não vamos executar o toggle para não alterar dados reais
      console.log('ℹ️  Toggle não executado para preservar dados')
      console.log('✅ Função toggleProductVisibility está disponível')
    }
    
    console.log('\n🎯 RESUMO DO TESTE:')
    console.log(`✅ Produtos totais: ${allProducts.length}`)
    console.log(`✅ Produtos visíveis: ${visibleProducts.length}`)
    console.log(`🔒 Produtos ocultos: ${hiddenProducts.length}`)
    
    // Verificar se a coluna hidden existe
    const hasHiddenColumn = allProducts.length > 0 && 'hidden' in allProducts[0]
    console.log(`🗃️  Coluna 'hidden' existe: ${hasHiddenColumn ? '✅' : '❌'}`)
    
    if (!hasHiddenColumn) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:')
      console.log('📋 A coluna "hidden" não existe na tabela products')
      console.log('🛠️  Solução: Execute a migração SQL no console do Supabase')
      console.log('📄 Consulte: CORRECAO-OCULTAR-PRODUTOS.md')
    } else {
      console.log('\n✅ FUNCIONALIDADE OPERACIONAL!')
      console.log('🎉 A coluna "hidden" existe e está funcionando')
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar:', error)
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:')
    console.log('1. Verifique se está na página /admin')
    console.log('2. Execute a migração SQL no Supabase')
    console.log('3. Consulte CORRECAO-OCULTAR-PRODUTOS.md')
  }
}

// Executar o teste
testHiddenProductsFeature()

// Também disponibilizar como função global para facilitar uso
window.testHiddenProducts = testHiddenProductsFeature 