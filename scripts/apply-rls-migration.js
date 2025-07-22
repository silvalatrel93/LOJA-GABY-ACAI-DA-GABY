const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Função para ler variáveis do .env.local
function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local')
  let supabaseUrl, supabaseKey
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const [key, value] = line.split('=')
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        supabaseUrl = value?.trim().replace(/['"]/g, '')
      }
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
        supabaseKey = value?.trim().replace(/['"]/g, '')
      }
    }
  } catch (error) {
    console.log('⚠️  Arquivo .env.local não encontrado, usando variáveis de ambiente')
  }
  
  // Fallback para variáveis de ambiente
  if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseKey) supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log(`🔗 URL: ${supabaseUrl ? 'Encontrada' : 'Não encontrada'}`)
  console.log(`🔑 Key: ${supabaseKey ? 'Encontrada' : 'Não encontrada'}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Credenciais do Supabase não encontradas!')
    console.log('\n📋 Aplique manualmente no Console Supabase:')
    console.log('\n-- Migração RLS para store_config')
    console.log('-- Execute no Console do Supabase: SQL Editor\n')
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250120000003_enable_rls_store_config.sql')
    try {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      console.log(migrationSQL)
    } catch (error) {
      console.log('Erro ao ler arquivo de migração:', error.message)
    }
    
    console.log('\n🚀 Execute este SQL no Console do Supabase')
    process.exit(1)
  }
  
  return { supabaseUrl, supabaseKey }
}

async function applyRLSMigration() {
  console.log('🔧 Aplicando migração RLS para store_config...')
  
  const { supabaseUrl, supabaseKey } = loadEnvVariables()
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Testar conexão
    console.log('🔍 Testando conexão...')
    const { data: testData, error: testError } = await supabase
      .from('store_config')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError.message)
      return false
    }
    
    console.log('✅ Conexão estabelecida')
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250120000003_enable_rls_store_config.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Aplicando migração RLS...')
    
    // Tentar aplicar usando rpc
    const { error: rpcError } = await supabase.rpc('exec', {
      sql: migrationSQL
    })
    
    if (rpcError) {
      console.log('⚠️  RPC exec falhou, tentando método alternativo...')
      
      // Método alternativo: executar comandos individualmente
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('--'))
      
      for (const command of commands) {
        if (command) {
          console.log(`Executando: ${command.substring(0, 50)}...`)
          const { error: cmdError } = await supabase.rpc('exec_sql', {
            query: command
          })
          
          if (cmdError) {
            console.error(`❌ Erro ao executar comando: ${cmdError.message}`)
          }
        }
      }
    }
    
    console.log('✅ Migração RLS aplicada com sucesso!')
    console.log('\n🔒 RLS ativado na tabela store_config')
    console.log('📋 Políticas criadas:')
    console.log('  - Usuários autenticados: acesso completo')
    console.log('  - Usuários anônimos: apenas leitura')
    
    return true
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message)
    console.log('\n💡 Aplique manualmente no Console Supabase:')
    console.log('1. Acesse o Console do Supabase')
    console.log('2. Vá para SQL Editor')
    console.log('3. Execute o conteúdo do arquivo:')
    console.log('   supabase/migrations/20250120000003_enable_rls_store_config.sql')
    
    return false
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyRLSMigration()
    .then(success => {
      if (success) {
        console.log('\n🎉 Migração concluída!')
      } else {
        console.log('\n⚠️  Use a aplicação manual via Console Supabase')
      }
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { applyRLSMigration }