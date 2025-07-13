import { createSupabaseClient } from "../supabase-client";

/**
 * Lista todas as políticas RLS de uma tabela
 */
export async function listTablePolicies(tableName: string) {
  try {
    const supabase = createSupabaseClient();
    
    // Consulta para obter as políticas RLS da tabela
    const { data, error } = await supabase
      .rpc('get_rls_policies', { _table_name: tableName });

    if (error) {
      console.error(`Erro ao listar políticas RLS para a tabela ${tableName}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Erro inesperado ao listar políticas RLS para a tabela ${tableName}:`, error);
    return [];
  }
}

/**
 * Verifica se o usuário atual tem permissão para executar uma operação
 */
export async function checkRLSPermission(tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') {
  try {
    const supabase = createSupabaseClient();
    
    // Consulta para verificar permissões RLS
    const { data, error } = await supabase
      .rpc('check_rls_permission', { 
        _table_name: tableName,
        _operation: operation
      });

    if (error) {
      console.error(`Erro ao verificar permissão RLS para ${operation} na tabela ${tableName}:`, error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error(`Erro inesperado ao verificar permissão RLS para ${operation} na tabela ${tableName}:`, error);
    return false;
  }
}

/**
 * Função auxiliar para verificar permissões de uma tabela
 */
export async function checkTablePermissions(tableName: string) {
  console.log(`=== Verificando permissões para a tabela: ${tableName} ===`);
  
  // Verificar permissões para cada operação
  const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as const;
  
  for (const op of operations) {
    const hasPermission = await checkRLSPermission(tableName, op);
    console.log(`Permissão para ${op}:`, hasPermission ? '✅ Permitido' : '❌ Negado');
  }
  
  // Listar políticas RLS
  const policies = await listTablePolicies(tableName);
  console.log(`Políticas RLS para ${tableName}:`, policies);
  
  return {
    tableName,
    policies,
    permissions: Object.fromEntries(
      await Promise.all(
        operations.map(async (op) => [op, await checkRLSPermission(tableName, op)])
      )
    )
  };
}
