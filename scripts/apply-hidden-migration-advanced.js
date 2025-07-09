const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function applyHiddenMigration() {
  console.log('🔧 Aplicando migração da coluna hidden...')
  
  // Tentar ler variáveis de ambiente de diferentes fontes
  const envPaths = ['.env.local', '.env', '.env.production']
  let supabaseUrl, supabaseKey
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`📄 Lendo ${envPath}...`)
      const envContent = fs.readFileSync(envPath, 'utf8')
      const lines = envContent.split('\n')
      
      lines.forEach(line => {
        const [key, value] = line.split('=')
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
          supabaseUrl = value?.trim().replace(/['"]/g, '')
        }
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
          supabaseKey = value?.trim().replace(/['"]/g, '')
        }
      })
    }
  }
  
  // Fallback para variáveis de ambiente do sistema
  if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseKey) supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log(`🔗 URL: ${supabaseUrl ? 'Encontrada' : 'Não encontrada'}`)
  console.log(`🔑 Key: ${supabaseKey ? 'Encontrada' : 'Não encontrada'}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Credenciais não encontradas')
    console.log('💡 Soluções:')
    console.log('1. Aplique manualmente no Console Supabase')
    console.log('2. Configure as variáveis de ambiente')
    console.log('3. Use o arquivo SQL gerado: apply-hidden-migration.sql')
    
    // Criar arquivo SQL para aplicação manual
    const sqlContent = `
-- Migração: Adicionar coluna hidden à tabela products
-- Execute no Console do Supabase: SQL Editor

-- 1. Adiciona a coluna se não existir
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- 2. Atualiza produtos existentes para serem visíveis por padrão
UPDATE products SET hidden = FALSE WHERE hidden IS NULL;

-- 3. Verifica se a migração funcionou
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'hidden';

-- 4. Testa a funcionalidade
SELECT 
  id, 
  name, 
  active, 
  hidden,
  CASE 
    WHEN hidden = true THEN 'Produto Oculto'
    WHEN hidden = false THEN 'Produto Visível'
    ELSE 'Status Indefinido'
  END as status_visibilidade
FROM products 
LIMIT 5;
`
    
    fs.writeFileSync('apply-hidden-migration.sql', sqlContent)
    console.log('\n📄 Arquivo SQL criado: apply-hidden-migration.sql')
    console.log('🚀 Execute este arquivo no Console do Supabase')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('\n1. 🔍 Verificando conexão...')
    const { data: testData, error: testError } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro de conexão:', testError)
      return
    }
    
    console.log('✅ Conexão estabelecida')
    
    console.log('\n2. 🔍 Verificando se coluna hidden já existe...')
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .limit(1)
    
    if (products && products.length > 0) {
      const hasHiddenColumn = 'hidden' in products[0]
      console.log(`🗃️  Coluna hidden existe: ${hasHiddenColumn ? '✅' : '❌'}`)
      
      if (hasHiddenColumn) {
        console.log('✅ Migração já foi aplicada!')
        console.log('🎉 Funcionalidade de ocultar produtos está operacional')
        return
      }
    }
    
    console.log('\n3. ⚠️  Tentando diferentes abordagens...')
    
    // Método 1: Tentar usando RPC (se disponível)
    try {
      console.log('🔧 Tentativa 1: Usando RPC...')
      const { error: rpcError } = await supabase.rpc('exec', {
        query: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;'
      })
      
      if (!rpcError) {
        console.log('✅ Migração aplicada via RPC!')
        return
      }
    } catch (e) {
      console.log('❌ RPC não disponível')
    }
    
    // Método 2: Tentar usando função administrativa (se disponível)
    try {
      console.log('🔧 Tentativa 2: Função administrativa...')
      const { error: adminError } = await supabase
        .from('pg_stat_user_tables')
        .select('*')
        .limit(1)
      
      if (!adminError) {
        console.log('🔑 Acesso administrativo detectado')
        // Aqui poderíamos tentar outros métodos
      }
    } catch (e) {
      console.log('❌ Sem acesso administrativo')
    }
    
    console.log('\n🚫 Não foi possível aplicar a migração automaticamente')
    console.log('📋 Isso é normal por questões de segurança')
    console.log('\n✅ SOLUÇÃO RECOMENDADA:')
    console.log('1. Acesse o Console do Supabase')
    console.log('2. Vá em SQL Editor')
    console.log('3. Execute o arquivo: apply-hidden-migration.sql')
    
  } catch (error) {
    console.error('❌ Erro durante execução:', error)
    console.log('\n💡 Use a aplicação manual via Console Supabase')
  }
}

// Executar a migração
if (require.main === module) {
  applyHiddenMigration()
    .then(() => console.log('\n🏁 Script finalizado'))
    .catch(error => console.error('💥 Erro fatal:', error))
}

module.exports = { applyHiddenMigration } 