// Script para verificar e aplicar a migração do campo additionals_limit
const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndApplyMigration() {
  try {
    console.log('🔍 Verificando se a coluna additionals_limit existe...')
    
    // Tentar fazer uma query que usa a coluna additionals_limit
    const { data, error } = await supabase
      .from('products')
      .select('id, additionals_limit')
      .limit(1)
    
    if (error) {
      if (error.message.includes('additionals_limit') || error.code === '42703') {
        console.log('❌ Coluna additionals_limit não existe. Aplicando migração...')
        
        // Aplicar a migração usando RPC (se você tiver uma função no banco)
        // Ou mostrar instruções para aplicar manualmente
        console.log(`
📋 INSTRUÇÕES PARA APLICAR A MIGRAÇÃO:

1. Acesse o Supabase Dashboard: ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql
2. Execute o seguinte SQL:

-- Adicionar coluna additionals_limit
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS additionals_limit INTEGER DEFAULT 5 CHECK (additionals_limit >= 0);

-- Adicionar comentário
COMMENT ON COLUMN products.additionals_limit IS 'Limite máximo de adicionais permitidos para este produto (0 = sem limite)';

-- Atualizar produtos existentes
UPDATE products 
SET additionals_limit = 5 
WHERE additionals_limit IS NULL;

-- Tornar a coluna NOT NULL
ALTER TABLE products 
ALTER COLUMN additionals_limit SET NOT NULL;

3. Após executar o SQL, teste novamente salvando um produto.
        `)
        
        return false
      } else {
        console.error('❌ Erro inesperado:', error)
        return false
      }
    }
    
    console.log('✅ Coluna additionals_limit existe!')
    console.log('📊 Dados encontrados:', data)
    
    // Verificar se todos os produtos têm o campo preenchido
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, additionals_limit')
    
    if (allError) {
      console.error('❌ Erro ao verificar produtos:', allError)
      return false
    }
    
    const productsWithoutLimit = allProducts.filter(p => p.additionals_limit === null || p.additionals_limit === undefined)
    
    if (productsWithoutLimit.length > 0) {
      console.log(`⚠️  Encontrados ${productsWithoutLimit.length} produtos sem limite definido:`)
      productsWithoutLimit.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id})`)
      })
      
      console.log('\n🔧 Atualizando produtos sem limite...')
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ additionals_limit: 5 })
        .in('id', productsWithoutLimit.map(p => p.id))
      
      if (updateError) {
        console.error('❌ Erro ao atualizar produtos:', updateError)
        return false
      }
      
      console.log('✅ Produtos atualizados com sucesso!')
    }
    
    console.log('🎉 Migração verificada e aplicada com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error)
    return false
  }
}

// Executar o script
checkAndApplyMigration()
  .then(success => {
    if (success) {
      console.log('\n✅ Script executado com sucesso!')
      process.exit(0)
    } else {
      console.log('\n❌ Script falhou. Verifique as instruções acima.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  }) 