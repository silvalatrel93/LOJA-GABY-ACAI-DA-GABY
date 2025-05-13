import { createSupabaseClient } from "../supabase-client"
import type { Store } from "../types"

export const StoreService = {
  // Obter todas as lojas do usuário
  async getUserStores(): Promise<Store[]> {
    try {
      const supabase = createSupabaseClient()

      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar lojas do usuário:", error)
        return []
      }

      return data.map((store: any) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        logoUrl: store.logo_url,
        themeColor: store.theme_color,
        isActive: store.is_active,
        ownerId: store.owner_id,
        createdAt: new Date(store.created_at),
        updatedAt: new Date(store.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar lojas do usuário:", error)
      return []
    }
  },

  // Obter loja por slug
  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase.from("stores").select("*").eq("slug", slug).single()

      if (error) {
        console.error(`Erro ao buscar loja com slug ${slug}:`, error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        themeColor: data.theme_color,
        isActive: data.is_active,
        ownerId: data.owner_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error(`Erro ao buscar loja com slug ${slug}:`, error)
      return null
    }
  },

  // Obter loja por ID
  async getStoreById(id: string): Promise<Store | null> {
    try {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase.from("stores").select("*").eq("id", id).single()

      if (error) {
        console.error(`Erro ao buscar loja com ID ${id}:`, error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        themeColor: data.theme_color,
        isActive: data.is_active,
        ownerId: data.owner_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error(`Erro ao buscar loja com ID ${id}:`, error)
      return null
    }
  },

  // Criar nova loja
  async createStore(store: Omit<Store, "id" | "createdAt" | "updatedAt">): Promise<Store | null> {
    try {
      const supabase = createSupabaseClient()

      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se o slug já existe
      const { data: existingStore } = await supabase.from("stores").select("slug").eq("slug", store.slug).maybeSingle()

      if (existingStore) {
        throw new Error("Este nome de URL já está em uso. Por favor, escolha outro.")
      }

      const { data, error } = await supabase
        .from("stores")
        .insert({
          name: store.name,
          slug: store.slug,
          logo_url: store.logoUrl,
          theme_color: store.themeColor || "#6B21A8", // Cor padrão: roxo
          is_active: store.isActive !== undefined ? store.isActive : true,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar loja:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        themeColor: data.theme_color,
        isActive: data.is_active,
        ownerId: data.owner_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao criar loja:", error)
      throw error
    }
  },

  // Atualizar loja
  async updateStore(store: Store): Promise<Store | null> {
    try {
      const supabase = createSupabaseClient()

      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se o usuário é o proprietário da loja
      const { data: existingStore } = await supabase.from("stores").select("owner_id").eq("id", store.id).single()

      if (!existingStore || existingStore.owner_id !== user.id) {
        throw new Error("Você não tem permissão para atualizar esta loja")
      }

      // Verificar se o slug já existe (se estiver sendo alterado)
      if (store.slug !== existingStore.slug) {
        const { data: slugExists } = await supabase
          .from("stores")
          .select("slug")
          .eq("slug", store.slug)
          .neq("id", store.id)
          .maybeSingle()

        if (slugExists) {
          throw new Error("Este nome de URL já está em uso. Por favor, escolha outro.")
        }
      }

      const { data, error } = await supabase
        .from("stores")
        .update({
          name: store.name,
          slug: store.slug,
          logo_url: store.logoUrl,
          theme_color: store.themeColor,
          is_active: store.isActive,
        })
        .eq("id", store.id)
        .select()
        .single()

      if (error) {
        console.error(`Erro ao atualizar loja ${store.id}:`, error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logoUrl: data.logo_url,
        themeColor: data.theme_color,
        isActive: data.is_active,
        ownerId: data.owner_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error(`Erro ao atualizar loja:`, error)
      throw error
    }
  },

  // Excluir loja
  async deleteStore(id: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      // Verificar se o usuário está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar se o usuário é o proprietário da loja
      const { data: existingStore } = await supabase.from("stores").select("owner_id").eq("id", id).single()

      if (!existingStore || existingStore.owner_id !== user.id) {
        throw new Error("Você não tem permissão para excluir esta loja")
      }

      const { error } = await supabase.from("stores").delete().eq("id", id)

      if (error) {
        console.error(`Erro ao excluir loja ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao excluir loja ${id}:`, error)
      throw error
    }
  },

  // Verificar se um slug está disponível
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      let query = supabase.from("stores").select("slug").eq("slug", slug)

      if (excludeId) {
        query = query.neq("id", excludeId)
      }

      const { data } = await query

      return !data || data.length === 0
    } catch (error) {
      console.error(`Erro ao verificar disponibilidade do slug ${slug}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para compatibilidade com código existente
export const getUserStores = StoreService.getUserStores.bind(StoreService)
export const getStoreBySlug = StoreService.getStoreBySlug.bind(StoreService)
export const getStoreById = StoreService.getStoreById.bind(StoreService)
export const createStore = StoreService.createStore.bind(StoreService)
export const updateStore = StoreService.updateStore.bind(StoreService)
export const deleteStore = StoreService.deleteStore.bind(StoreService)
export const isSlugAvailable = StoreService.isSlugAvailable.bind(StoreService)
