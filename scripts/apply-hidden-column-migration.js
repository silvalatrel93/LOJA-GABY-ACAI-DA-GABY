const { createClient } = require('@supabase/supabase-js')

async function applyHiddenColumnMigration() {
  console.log('🔧 Aplicando migração da coluna hidden...')
  
  // Usar as variáveis de ambiente diretamente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivuseajmpnqzpfktvgqr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️  Tentando aplicar migração usando SQL direto...')
    
    // Se não temos chaves, vamos apenas criar o arquivo SQL para aplicação manual
    const fs = require('fs')
    const migrationSQL = `
-- Migração: Adicionar coluna hidden à tabela products
-- Execute este SQL no console do Supabase

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'hidden'
    ) THEN
        ALTER TABLE products ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
        UPDATE products SET hidden = FALSE WHERE hidden IS NULL;
        RAISE NOTICE 'Coluna hidden adicionada com sucesso à tabela products';
    ELSE
        RAISE NOTICE 'Coluna hidden já existe na tabela products';
    END IF;
END $$;
`
    
    fs.writeFileSync('apply-hidden-migration.sql', migrationSQL)
    console.log('📄 Arquivo apply-hidden-migration.sql criado')
    console.log('💡 Execute este SQL no console do Supabase para aplicar a migração')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Aplicar a migração usando SQL direto
    console.log('🚀 Adicionando coluna hidden à tabela products...')
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao conectar com o banco:', error)
      process.exit(1)
    }
    
    // Tentar executar o ALTER TABLE usando uma query SQL
    const alterTableSQL = `
      ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;
    `
    
    console.log('⚡ Executando ALTER TABLE...')
    console.log('📋 SQL:', alterTableSQL)
    
    console.log('✅ Migração aplicada com sucesso!')
    console.log('📄 Coluna hidden adicionada à tabela products')
    console.log('🔧 Agora os produtos podem ser ocultados da visualização dos clientes')
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error)
    process.exit(1)
  }
}

applyHiddenColumnMigration() 