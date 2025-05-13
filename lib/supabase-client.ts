import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Criar cliente Supabase básico
export function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL e Anon Key são necessários. Verifique as variáveis de ambiente.")
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}

// Criar cliente Supabase com contexto de loja
export async function createSupabaseClientWithStoreContext(storeId: string) {
  const supabase = createSupabaseClient()

  // Definir o contexto da loja
  if (storeId) {
    try {
      await supabase.rpc("set_store_context", { store_id: storeId })
    } catch (error) {
      console.error("Erro ao definir contexto da loja:", error)
    }
  }

  return supabase
}
