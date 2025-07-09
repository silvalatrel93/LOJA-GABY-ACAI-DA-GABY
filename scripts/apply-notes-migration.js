const fs = require('fs')
const path = require('path')

console.log('🚀 MIGRAÇÃO NECESSÁRIA: Coluna "notes" na tabela "cart"')
console.log('=' .repeat(60))
console.log()

console.log('Para que o campo de observações funcione, você precisa adicionar a coluna "notes" à tabela "cart".')
console.log()

console.log('📋 INSTRUÇÕES:')
console.log()
console.log('1. Acesse o Dashboard do Supabase (https://supabase.com)')
console.log('2. Selecione seu projeto')
console.log('3. Vá para "SQL Editor"')
console.log('4. Execute o seguinte SQL:')
console.log()
console.log('   ALTER TABLE cart ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT \'\';')
console.log('   NOTIFY pgrst, \'reload schema\';')
console.log()

console.log('✅ VERIFICAÇÃO:')
console.log()
console.log('Para verificar se funcionou, execute:')
console.log()
console.log('   SELECT column_name FROM information_schema.columns')
console.log('   WHERE table_name = \'cart\' AND column_name = \'notes\';')
console.log()

console.log('🔧 COMPATIBILIDADE:')
console.log()
console.log('O código já foi preparado para funcionar com ou sem a coluna "notes".')
console.log('Se a coluna não existir, as observações serão ignoradas silenciosamente.')
console.log()

console.log('📱 TESTE:')
console.log()
console.log('Após aplicar a migração:')
console.log('1. Adicione um produto ao carrinho')
console.log('2. Clique em "Adicionar observações"')
console.log('3. Digite uma observação')
console.log('4. Finalize um pedido')
console.log('5. Verifique se aparece na etiqueta')
console.log()

console.log('📄 Instruções detalhadas em: APLICAR-MIGRACAO-NOTES.md')
console.log('=' .repeat(60))

// Verificar se o arquivo de migração existe
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_notes_column_to_cart.sql')
if (fs.existsSync(migrationPath)) {
  console.log('✅ Arquivo de migração encontrado:', migrationPath)
} else {
  console.log('⚠️  Arquivo de migração não encontrado:', migrationPath)
}

console.log()
console.log('🚀 Pronto! O sistema já está preparado para usar observações.')
console.log('   Aplique a migração no Supabase para ativar a funcionalidade.') 