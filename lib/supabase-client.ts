import { createClient } from "@supabase/supabase-js"

// Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Valores de fallback para desenvolvimento local
  const fallbackUrl = 'https://xyzcompany.supabase.co';
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdGt4cXBrYnp3YnZpaWZwcXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU2MjA3MDMsImV4cCI6MjAzMTE5NjcwM30.dummy-key-for-development';

  // Usar valores de fallback apenas em desenvolvimento
  const isDevelopment = process.env.NODE_ENV === 'development';
  const usingFallback = !supabaseUrl || !supabaseAnonKey;

  const finalUrl = supabaseUrl || (isDevelopment ? fallbackUrl : undefined);
  const finalKey = supabaseAnonKey || (isDevelopment ? fallbackKey : undefined);

  if (!finalUrl || !finalKey) {
    console.error("Erro: Supabase URL e Anon Key são necessários. Verifique as variáveis de ambiente.")
    throw new Error("Supabase URL e Anon Key são necessários. Verifique as variáveis de ambiente.")
  }

  try {
    supabaseInstance = createClient(finalUrl, finalKey)
    return supabaseInstance
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error)
    throw error
  }
}

// Função para testar a conectividade com o Supabase
export async function testSupabaseConnection() {
  try {
    const supabase = createSupabaseClient()

    // Tentar uma consulta simples para verificar a conectividade
    const { data, error } = await supabase
      .from('store_config')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Erro na conexão com Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return false
    }

    return true
  } catch (error) {
    console.error('Erro inesperado ao testar conexão:', error)
    return false
  }
}
