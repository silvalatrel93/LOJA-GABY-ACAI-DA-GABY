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

// Opções para o cliente Supabase
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'x-application-name': 'heai-acai-admin',
    },
  },
};

// Criar e exportar o cliente Supabase com opções aprimoradas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Verificar se o cliente foi inicializado corretamente
if (!supabase) {
  console.error('Falha ao inicializar o cliente Supabase');
} else {
  console.log('Cliente Supabase inicializado com sucesso');
}

// Função para testar a conexão com o Supabase
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Cliente Supabase não inicializado');
      return false;
    }
    
    console.log('Testando conexão com o Supabase...');
    
    // Verificar se as variáveis de ambiente estão definidas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Variáveis de ambiente do Supabase ausentes');
      return false;
    }
    
    // Tentar uma operação simples para verificar a conexão
    const { data, error } = await supabase.from('admin_settings').select('count').limit(1);
    
    if (error) {
      console.error('Erro ao testar conexão com o Supabase:', error);
      
      // Verificar tipos específicos de erro para diagnóstico
      if (error.code === 'PGRST301') {
        console.error('Erro de autenticação: verifique a chave anônima');
      } else if (error.code === 'PGRST401') {
        console.error('Erro de permissão: verifique as permissões da tabela');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        console.error('Erro de conexão de rede: verifique a URL do Supabase e a conexão com a internet');
      }
      
      return false;
    }
    
    console.log('Conexão com o Supabase bem-sucedida');
    return true;
  } catch (error) {
    console.error('Exceção ao testar conexão com o Supabase:', error);
    return false;
  }
}

// Função para reconectar ao Supabase
export async function reconnectSupabase(): Promise<boolean> {
  try {
    console.log('Tentando reconectar ao Supabase...');
    
    // Forçar uma nova conexão
    const isConnected = await testSupabaseConnection();
    
    if (isConnected) {
      console.log('Reconexão com o Supabase bem-sucedida');
      return true;
    } else {
      console.error('Falha na reconexão com o Supabase');
      return false;
    }
  } catch (error) {
    console.error('Erro durante a reconexão com o Supabase:', error);
    return false;
  }
}
