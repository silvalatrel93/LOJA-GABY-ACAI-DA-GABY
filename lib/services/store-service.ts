import { createSupabaseClient } from "../supabase-client"

// Função para obter todas as lojas
export async function getAllStores() {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("stores").select("*").order("name")

  if (error) {
    console.error("Erro ao buscar lojas:", error)
    return []
  }

  return data
}

// Função para obter uma loja pelo ID
export async function getStoreById(id: string) {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from("stores").select("*").eq("id", id).single()

  if (error) {
    console.error(`Erro ao buscar loja com ID ${id}:`, error)
    return null
  }

  return data
}

// Função para obter a loja padrão
export async function getDefaultStore() {
  const supabase = createSupabaseClient()

  // Primeiro tenta buscar a loja com ID zero (loja padrão)
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single()

  if (!error && data) {
    return data
  }

  // Se não encontrar, busca a primeira loja ativa
  const { data: activeStore, error: activeError } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (activeError) {
    console.error("Erro ao buscar loja padrão:", activeError)
    return null
  }

  return activeStore
}

// Função para verificar se uma loja existe
export async function storeExists(id: string): Promise<boolean> {
  const supabase = createSupabaseClient()

  const { count, error } = await supabase.from("stores").select("*", { count: "exact", head: true }).eq("id", id)

  if (error) {
    console.error(`Erro ao verificar existência da loja ${id}:`, error)
    return false
  }

  return count ? count > 0 : false
}
