import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Singleton para o cliente Supabase
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function createSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Variáveis de ambiente do Supabase não estão configuradas corretamente")
    throw new Error("Variáveis de ambiente do Supabase não estão configuradas corretamente")
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Cliente Supabase para uso no lado do servidor
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase URL e Service Role Key são necessários")
    throw new Error("Supabase URL e Service Role Key são necessários")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Verificar se o Supabase está disponível
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Variáveis de ambiente do Supabase não estão configuradas")
      return false
    }

    // Criar cliente com timeout mais curto para verificação rápida
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (url, options) => {
          const controller = new AbortController()
          const { signal } = controller

          // Definir um timeout de 5 segundos
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          return fetch(url, { ...options, signal })
            .then((response) => {
              clearTimeout(timeoutId)
              return response
            })
            .catch((error) => {
              clearTimeout(timeoutId)
              throw error
            })
        },
      },
    })

    // Tentar uma consulta simples para verificar a conexão
    const { error } = await supabase.from("categories").select("id").limit(1)

    if (error) {
      // Se o erro for relacionado à tabela não existir, ainda podemos considerar o Supabase disponível
      if (error.code === "42P01") {
        // Código para "relation does not exist"
        console.log("Tabela 'categories' não existe, mas o Supabase está disponível")
        return true
      }

      console.warn("Erro ao verificar disponibilidade do Supabase:", error.message)
      return false
    }

    return true
  } catch (error) {
    console.warn("Erro ao verificar disponibilidade do Supabase:", error)
    return false
  }
}
