import { createSupabaseClient, isSupabaseAvailable } from "@/lib/supabase-client"

// Modos de persistência
export type PersistenceMode = "supabase" | "indexeddb" | "unknown"

// Estado global de persistência
let currentMode: PersistenceMode = "unknown"
let isInitialized = false
let initializationPromise: Promise<PersistenceMode> | null = null

// Inicializar o gerenciador de persistência
export async function initializePersistenceManager(): Promise<PersistenceMode> {
  // Se já inicializado, retornar o modo atual
  if (isInitialized) {
    return currentMode
  }

  // Se já está inicializando, retornar a promessa existente
  if (initializationPromise) {
    return initializationPromise
  }

  // Iniciar o processo de inicialização
  initializationPromise = (async () => {
    try {
      // Verificar se o modo já está armazenado no localStorage
      if (typeof window !== "undefined") {
        const storedMode = localStorage.getItem("persistence_mode")
        if (storedMode === "supabase") {
          console.log("Modo de persistência encontrado no localStorage: supabase")

          // Verificar se o Supabase ainda está disponível
          const supabaseAvailable = await isSupabaseAvailable()
          if (supabaseAvailable) {
            currentMode = "supabase"
            isInitialized = true
            return currentMode
          } else {
            console.warn("Supabase não está mais disponível, usando IndexedDB como fallback")
          }
        }
      }

      // Verificar se o Supabase está disponível
      console.log("Verificando disponibilidade do Supabase...")
      const supabaseAvailable = await isSupabaseAvailable()

      if (supabaseAvailable) {
        console.log("Supabase está disponível")

        try {
          // Verificar se existem dados no Supabase
          const supabase = createSupabaseClient()
          const { data: categories, error } = await supabase.from("categories").select("id").limit(1)

          if (error) {
            if (error.code === "42P01") {
              // Tabela não existe
              console.log("Tabela 'categories' não existe no Supabase, usando IndexedDB temporariamente")
              currentMode = "indexeddb"
            } else {
              console.warn("Erro ao verificar dados no Supabase:", error.message)
              currentMode = "indexeddb"
            }
          } else if (categories && categories.length > 0) {
            console.log("Dados encontrados no Supabase, usando como fonte primária")
            currentMode = "supabase"

            // Armazenar no localStorage para futuras verificações
            if (typeof window !== "undefined") {
              localStorage.setItem("persistence_mode", "supabase")
            }
          } else {
            console.log("Supabase disponível, mas sem dados. Usando IndexedDB temporariamente.")
            currentMode = "indexeddb"
          }
        } catch (error) {
          console.warn("Erro ao verificar dados no Supabase:", error)
          currentMode = "indexeddb"
        }
      } else {
        console.log("Supabase não disponível. Usando IndexedDB como fallback.")
        currentMode = "indexeddb"
      }

      isInitialized = true
      return currentMode
    } catch (error) {
      console.error("Erro ao inicializar gerenciador de persistência:", error)
      currentMode = "indexeddb"
      isInitialized = true
      return currentMode
    } finally {
      initializationPromise = null
    }
  })()

  return initializationPromise
}

// Obter o modo de persistência atual
export function getPersistenceMode(): PersistenceMode {
  // Se ainda não inicializado, verificar o localStorage
  if (!isInitialized && typeof window !== "undefined") {
    const storedMode = localStorage.getItem("persistence_mode")
    if (storedMode === "supabase") {
      currentMode = "supabase"
      isInitialized = true
    }
  }

  return currentMode
}

// Definir o modo de persistência
export function setPersistenceMode(mode: PersistenceMode): void {
  currentMode = mode
  isInitialized = true

  if (typeof window !== "undefined") {
    localStorage.setItem("persistence_mode", mode)
  }
}

// Verificar se deve usar o Supabase
export function shouldUseSupabase(): boolean {
  return getPersistenceMode() === "supabase"
}

// Migrar para o Supabase
export function migrateToSupabase(): void {
  setPersistenceMode("supabase")
}
