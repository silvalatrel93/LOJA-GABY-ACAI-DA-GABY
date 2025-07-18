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
        order: Number(category.display_order || 0),
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
        order: Number(category.display_order || 0),
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
        .maybeSingle()

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
        order: Number(data.display_order || 0),
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
        // Verificar se a categoria existe antes de tentar atualizar
        const { data: existingCategory, error: fetchError } = await supabase
          .from("additional_categories")
          .select("*")
          .eq("id", category.id)
          .maybeSingle()

        if (fetchError) {
          console.error("Erro ao verificar categoria de adicional existente:", fetchError)
          return { data: null, error: new Error(`Erro ao verificar categoria: ${fetchError.message}`) }
        }

        if (!existingCategory) {
          console.log(`Categoria de adicional com ID ${category.id} não encontrada. Criando nova categoria.`)
          // Se a categoria não existe, trata como uma nova categoria
          category.id = 0
        } else {
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
            .maybeSingle()

          if (error) {
            console.error("Erro ao atualizar categoria de adicional:", error)
            return { data: null, error: new Error(error.message) }
          }

          if (!data) {
            return { data: null, error: new Error("Nenhum dado retornado ao atualizar categoria") }
          }

          const result: AdditionalCategory = {
            id: Number(data.id),
            name: String(data.name),
            order: Number(data.display_order || 0),
            active: Boolean(data.active),
            selectionLimit: data.selection_limit ? Number(data.selection_limit) : undefined,
          }

          return { data: result, error: null }
        }
      }

      // Criar nova categoria (quando ID é 0 ou não existe)
      if (!category.id || category.id <= 0) {
        // Corrigir sequência antes de inserir
        console.log('Corrigindo sequência de additional_categories antes da inserção...')
        const { error: sequenceError } = await supabase.rpc('fix_additional_categories_sequence')
        if (sequenceError) {
          console.warn('Aviso: Não foi possível corrigir a sequência:', sequenceError)
        }

        // Criar nova categoria
        const insertData = {
          name: category.name,
          display_order: category.order,
          active: category.active,
          selection_limit: category.selectionLimit || null,
        }

        // Remover explicitamente qualquer propriedade id
        delete (insertData as any).id

        console.log('Inserindo nova categoria de adicional:', insertData)

        const { data, error } = await supabase
          .from("additional_categories")
          .insert(insertData)
          .select()
          .maybeSingle()

        if (error) {
          console.error("Erro ao criar categoria de adicional:", error)
          return { data: null, error: new Error(error.message) }
        }

        if (!data) {
          return { data: null, error: new Error("Nenhum dado retornado ao criar categoria") }
        }

        const result: AdditionalCategory = {
          id: Number(data.id),
          name: String(data.name),
          order: Number(data.display_order || 0),
          active: Boolean(data.active),
          selectionLimit: data.selection_limit ? Number(data.selection_limit) : undefined,
        }

        return { data: result, error: null }
      }

      // Fallback - não deveria chegar aqui
      return { data: null, error: new Error("Erro inesperado ao processar categoria") }
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
