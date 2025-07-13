import { createSupabaseClient } from "../supabase-client"
import type { Category } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

// Serviço para gerenciar categorias
export const CategoryService = {
  // Obter todas as categorias
  async getAllCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      let query = supabase.from("categories").select("*").eq("store_id", DEFAULT_STORE_ID).order("order")

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar categorias:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }
  },

  // Obter categorias ativas
  async getActiveCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .eq("active", true)
        .order("order")

      if (error) {
        console.error("Erro ao buscar categorias ativas:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias ativas:", error)
      return []
    }
  },

  // Obter categoria por ID
  async getCategoryById(id: number): Promise<Category | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .single()

      if (error) {
        console.error(`Erro ao buscar categoria ${id}:`, error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: Number(data.id),
        name: String(data.name),
        order: Number(data.order),
        active: Boolean(data.active),
      }
    } catch (error) {
      console.error(`Erro ao buscar categoria ${id}:`, error)
      return null
    }
  },

  // Salvar categoria
  async saveCategory(category: Category): Promise<{ data: Category | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()

      if (category.id && category.id > 0) {
        // Atualizar categoria existente
        const { data, error } = await supabase
          .from("categories")
          .update({
            name: category.name,
            order: category.order,
            active: category.active,
            store_id: DEFAULT_STORE_ID,
          })
          .eq("id", category.id)
          .eq("store_id", DEFAULT_STORE_ID)
          .select()

        if (error) {
          console.error("Erro ao atualizar categoria:", error)
          return { data: null, error: new Error(error.message) }
        }

        if (!data || data.length === 0) {
          return { data: null, error: new Error("Categoria não encontrada") }
        }

        const updatedCategory = data[0]
        const result: Category = {
          id: Number(updatedCategory.id),
          name: String(updatedCategory.name),
          order: Number(updatedCategory.order),
          active: Boolean(updatedCategory.active),
        }

        return { data: result, error: null }
      } else {
        // Criar nova categoria
        const { data, error } = await supabase
          .from("categories")
          .insert({
            name: category.name,
            order: category.order,
            active: category.active !== undefined ? category.active : true,
            store_id: DEFAULT_STORE_ID,
          })
          .select()

        if (error) {
          console.error("Erro ao criar categoria:", error)
          return { data: null, error: new Error(error.message) }
        }

        if (!data || data.length === 0) {
          return { data: null, error: new Error("Falha ao criar categoria") }
        }

        const newCategory = data[0]
        const result: Category = {
          id: Number(newCategory.id),
          name: String(newCategory.name),
          order: Number(newCategory.order),
          active: Boolean(newCategory.active),
        }

        return { data: result, error: null }
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  },

  // Excluir categoria
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar categoria ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar categoria ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllCategories = CategoryService.getAllCategories.bind(CategoryService)
export const getActiveCategories = CategoryService.getActiveCategories.bind(CategoryService)
export const getCategoryById = CategoryService.getCategoryById.bind(CategoryService)
export const saveCategory = CategoryService.saveCategory.bind(CategoryService)
export const deleteCategory = CategoryService.deleteCategory.bind(CategoryService)
