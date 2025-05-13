import { createClient } from "@supabase/supabase-js"

// Singleton para o cliente Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function createSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL e Anon Key são necessários. Verifique as variáveis de ambiente.")
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)

  return supabaseInstance
}
