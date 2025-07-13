import { checkTablePermissions } from "../lib/utils/rls-utils";

/**
 * Script para verificar as permissões da tabela de categorias
 */
async function main() {
  try {
    console.log('=== Verificando permissões da tabela categories ===');
    
    // Verificar permissões
    const result = await checkTablePermissions('categories');
    
    console.log('\n=== Resultado da verificação ===');
    console.log(JSON.stringify(result, null, 2));
    
    // Verificar se há permissão de INSERT
    if (!result.permissions.INSERT) {
      console.error('\n❌ Acesso negado para INSERIR na tabela categories');
      console.log('\nPossíveis soluções:');
      console.log('1. Verifique se o RLS (Row Level Security) está habilitado na tabela');
      console.log('2. Verifique se existem políticas que permitam a inserção');
      console.log('3. Verifique se o usuário atual tem as permissões necessárias');
    } else {
      console.log('\n✅ Permissões de INSERT estão habilitadas');
    }
    
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
  }
}

// Executar o script
main().catch(console.error);
