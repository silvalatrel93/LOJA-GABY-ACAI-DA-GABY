import { createSupabaseClient, createSupabaseClientWithStoreContext } from "../supabase-client"
import type { Category } from "../types"

// Serviço para gerenciar categorias
export const CategoryService = {
  // Obter todas as categorias
  async getAllCategories(storeId?: string): Promise<Category[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("categories").select("*").order("order")

      if (error) {
        console.error("Erro ao buscar categorias:", error)
        return []
      }

      return data.map((category: any) => ({
        id: category.id,
        name: category.name,
        order: category.order,
        active: category.active,
        storeId: category.store_id,
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }
  },

  // Obter categorias ativas
  async getActiveCategories(storeId?: string): Promise<Category[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("order")

      if (error) {
        console.error("Erro ao buscar categorias ativas:", error)
        return []
      }

      return data.map((category: any) => ({
        id: category.id,
        name: category.name,
        order: category.order,
        active: category.active,
        storeId: category.store_id,
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias ativas:", error)
      return []
    }
  },

  // Obter categoria por ID
  async getCategoryById(id: number, storeId?: string): Promise<Category | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

      if (error) {
        console.error(`Erro ao buscar categoria ${id}:`, error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        order: data.order,
        active: data.active,
        storeId: data.store_id,
      }
    } catch (error) {
      console.error(`Erro ao buscar categoria ${id}:`, error)
      return null
    }
  },

  // Salvar categoria
  async saveCategory(category: Category, storeId?: string): Promise<Category | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase
        .from("categories")
        .upsert({
          id: category.id || undefined,
          name: category.name,
          order: category.order,
          active: category.active,
          store_id: storeId || category.storeId,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao salvar categoria:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        order: data.order,
        active: data.active,
        storeId: data.store_id,
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      return null
    }
  },

  // Excluir categoria
  async deleteCategory(id: number, storeId?: string): Promise<boolean> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) {
        console.error(`Erro ao excluir categoria ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para compatibilidade com código existente
export const getAllCategories = CategoryService.getAllCategories.bind(CategoryService)
export const getActiveCategories = CategoryService.getActiveCategories.bind(CategoryService)
export const getCategoryById = CategoryService.getCategoryById.bind(CategoryService)
export const saveCategory = CategoryService.saveCategory.bind(CategoryService)
export const deleteCategory = CategoryService.deleteCategory.bind(CategoryService)
