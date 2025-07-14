const { createClient } = require('@supabase/supabase-js')

// Usar as credenciais corretas do Supabase
const supabaseUrl = 'https://trjjplrqxrfadtmuhpng.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyampwbHJxeHJmYWR0bXVocG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDEwNjYsImV4cCI6MjA2MjQ3NzA2Nn0._L2D90Vf7A6jhPobgztJUF4hT7eY_WfVMO_vLL-0zg0'

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTablePrices() {
  try {
    console.log('🔍 Testando consulta de produtos com preços de mesa...')
    console.log('Supabase URL:', supabaseUrl ? 'Configurado' : 'Não configurado')
    console.log('Supabase Key:', supabaseKey ? 'Configurado' : 'Não configurado')
    
    // Buscar produto específico com ID 199
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, sizes, table_sizes')
      .eq('id', 199)
      .single()
    
    if (error) {
      console.error('❌ Erro na consulta:', error)
      return
    }
    
    if (!product) {
      console.log('❌ Produto não encontrado')
      return
    }
    
    console.log('✅ Produto encontrado:')
    console.log('ID:', product.id)
    console.log('Nome:', product.name)
    console.log('Preços padrão:', JSON.stringify(product.sizes, null, 2))
    console.log('Preços de mesa:', JSON.stringify(product.table_sizes, null, 2))
    console.log('Tem preços de mesa?', !!product.table_sizes)
    
    // Testar a função getActiveProducts
    console.log('\n🔍 Testando função getActiveProducts...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        image,
        sizes,
        table_sizes,
        category_id,
        categories!products_category_id_fkey(name),
        active,
        hidden,
        allowed_additionals,
        additionals_limit,
        needs_spoon
      `)
      .eq('active', true)
      .eq('id', 199)
    
    if (productsError) {
      console.error('❌ Erro na consulta de produtos ativos:', productsError)
      return
    }
    
    if (products && products.length > 0) {
      const prod = products[0]
      console.log('✅ Produto via getActiveProducts:')
      console.log('table_sizes raw:', prod.table_sizes)
      console.log('table_sizes type:', typeof prod.table_sizes)
      console.log('table_sizes isArray:', Array.isArray(prod.table_sizes))
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testTablePrices()