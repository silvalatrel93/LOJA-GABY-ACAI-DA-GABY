import { createSupabaseClient } from "../supabase-client"

export interface AdditionalCategory {
  id: number
  name: string
  order: number
  active: boolean
  selectionLimit?: number // Limite de seleção para esta categoria de adicionais
}

export const AdditionalCategoryService = {
  // Obter todas as categorias de adicionais
  async getAllAdditionalCategories(): Promise<AdditionalCategory[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar categorias de adicionais:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.display_order),
        active: Boolean(category.active),
        selectionLimit: category.selection_limit ? Number(category.selection_limit) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias de adicionais:", error)
      return []
    }
  },

  // Obter categorias ativas de adicionais
  async getActiveAdditionalCategories(): Promise<AdditionalCategory[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar categorias ativas de adicionais:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.display_order),
        active: Boolean(category.active),
        selectionLimit: category.selection_limit ? Number(category.selection_limit) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias ativas de adicionais:", error)
      return []
    }
  },

  // Obter categoria por ID
  async getAdditionalCategoryById(id: number): Promise<AdditionalCategory | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Erro ao buscar categoria de adicional ${id}:`, error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: Number(data.id),
        name: String(data.name),
        order: Number(data.display_order),
        active: Boolean(data.active),
        selectionLimit: data.selection_limit ? Number(data.selection_limit) : undefined,
      }
    } catch (error) {
      console.error(`Erro ao buscar categoria de adicional ${id}:`, error)
      return null
    }
  },

  // Salvar categoria de adicional
  async saveAdditionalCategory(category: AdditionalCategory): Promise<{ data: AdditionalCategory | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()

      if (category.id && category.id > 0) {
        // Atualizar categoria existente
        const { data, error } = await supabase
          .from("additional_categories")
          .update({
            name: category.name,
            display_order: category.order,
            active: category.active,
            selection_limit: category.selectionLimit || null,
          })
          .eq("id", category.id)
          .select()
          .single()

        if (error) {
          console.error("Erro ao atualizar categoria de adicional:", error)
          return { data: null, error: new Error(error.message) }
        }

        const result: AdditionalCategory = {
          id: Number(data.id),
          name: String(data.name),
          order: Number(data.display_order),
          active: Boolean(data.active),
          selectionLimit: data.selection_limit ? Number(data.selection_limit) : undefined,
        }

        return { data: result, error: null }
      } else {
        // Criar nova categoria
        const { data, error } = await supabase
          .from("additional_categories")
          .insert({
            name: category.name,
            display_order: category.order,
            active: category.active !== undefined ? category.active : true,
            selection_limit: category.selectionLimit || null,
          })
          .select()
          .single()

        if (error) {
          console.error("Erro ao criar categoria de adicional:", error)
          return { data: null, error: new Error(error.message) }
        }

        const result: AdditionalCategory = {
          id: Number(data.id),
          name: String(data.name),
          order: Number(data.display_order),
          active: Boolean(data.active),
          selectionLimit: data.selection_limit ? Number(data.selection_limit) : undefined,
        }

        return { data: result, error: null }
      }
    } catch (error) {
      console.error("Erro ao salvar categoria de adicional:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  },

  // Excluir categoria de adicional
  async deleteAdditionalCategory(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("additional_categories")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar categoria de adicional ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar categoria de adicional ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllAdditionalCategories = AdditionalCategoryService.getAllAdditionalCategories.bind(AdditionalCategoryService)
export const getActiveAdditionalCategories = AdditionalCategoryService.getActiveAdditionalCategories.bind(AdditionalCategoryService)
export const getAdditionalCategoryById = AdditionalCategoryService.getAdditionalCategoryById.bind(AdditionalCategoryService)
export const saveAdditionalCategory = AdditionalCategoryService.saveAdditionalCategory.bind(AdditionalCategoryService)
export const deleteAdditionalCategory = AdditionalCategoryService.deleteAdditionalCategory.bind(AdditionalCategoryService)
