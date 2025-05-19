import { createClient } from '@supabase/supabase-js';

// Obter as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não estão definidas corretamente:', {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'Definido' : 'Não definido',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Definido' : 'Não definido'
  });
}

// Criar e exportar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para testar a conexão com o Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Tentar uma operação simples para verificar a conexão
    const { data, error } = await supabase.from('admin_settings').select('count').limit(1);
    
    if (error) {
      console.error('Erro ao testar conexão com o Supabase:', error);
      return false;
    }
    
    console.log('Conexão com o Supabase bem-sucedida');
    return true;
  } catch (error) {
    console.error('Exceção ao testar conexão com o Supabase:', error);
    return false;
  }
}
