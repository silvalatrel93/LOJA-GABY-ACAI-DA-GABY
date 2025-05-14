import { createSupabaseClient } from "../supabase-client"
import { DEFAULT_STORE_ID } from "../constants"
import { safelyGetRecordById } from "../supabase-utils"

// Interface para categoria de adicionais
export interface AdditionalCategory {
  id: number
  name: string
  order: number // Mantemos o nome 'order' na interface para compatibilidade
  active: boolean
}

// Serviço para gerenciar categorias de adicionais
export const AdditionalCategoryService = {
  // Obter todas as categorias de adicionais
  async getAllAdditionalCategories(): Promise<AdditionalCategory[]> {
    try {
      console.log("Iniciando getAllAdditionalCategories")
      console.log("DEFAULT_STORE_ID:", DEFAULT_STORE_ID)
      
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar categorias de adicionais:", JSON.stringify(error))
        return []
      }

      // Verificar se data existe
      if (!data || !Array.isArray(data)) {
        console.log("Nenhuma categoria de adicionais encontrada ou data não é um array")
        return []
      }

      console.log("Dados brutos de categorias de adicionais:", JSON.stringify(data))
      
      // Converter explicitamente os tipos para evitar erros de tipagem
      const result = data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        order: Number(item.display_order), // Mapear display_order para order na interface
        active: Boolean(item.active),
      }))
      
      console.log("Categorias de adicionais processadas:", JSON.stringify(result))
      return result
    } catch (error) {
      console.error("Erro ao buscar categorias de adicionais:", error)
      return []
    }
  },

  // Obter categorias de adicionais ativas
  async getActiveAdditionalCategories(): Promise<AdditionalCategory[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .eq("active", true)
        .eq("store_id", DEFAULT_STORE_ID)
        .order("display_order", { ascending: true })

      if (error) {
        console.error("Erro ao buscar categorias de adicionais ativas:", JSON.stringify(error))
        return []
      }

      // Verificar se data existe
      if (!data || !Array.isArray(data)) {
        return []
      }

      // Converter explicitamente os tipos para evitar erros de tipagem
      return data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        order: Number(item.display_order), // Mapear display_order para order na interface
        active: Boolean(item.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias de adicionais ativas:", error)
      return []
    }
  },

  // Obter categoria de adicional por ID
  async getAdditionalCategoryById(id: number): Promise<AdditionalCategory | null> {
    try {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from("additional_categories")
        .select("*")
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .maybeSingle()

      if (error) {
        console.error(`Erro ao buscar categoria de adicional com ID ${id}:`, JSON.stringify(error))
        return null
      }

      if (!data) {
        console.error(`Categoria de adicional ${id} não encontrada`)
        return null
      }

      // Converter explicitamente os tipos para evitar erros de tipagem
      return {
        id: Number(data.id),
        name: String(data.name),
        order: Number(data.display_order), // Mapear display_order para order na interface
        active: Boolean(data.active),
      }
    } catch (error) {
      console.error(`Erro ao buscar categoria de adicional ${id}:`, error)
      return null
    }
  },

  // Salvar categoria de adicional
  async saveAdditionalCategory(category: AdditionalCategory): Promise<AdditionalCategory | null> {
    try {
      const supabase = createSupabaseClient()
      console.log("Iniciando saveAdditionalCategory com dados:", JSON.stringify(category))
      console.log("DEFAULT_STORE_ID na função saveAdditionalCategory:", DEFAULT_STORE_ID)

      // Verificar se o ID é válido (se existir)
      if (category.id) {
        console.log("Verificando se a categoria de adicional com ID", category.id, "existe")
        const { data: existingData, error: checkError } = await supabase
          .from("additional_categories")
          .select("id")
          .eq("id", category.id)
          .eq("store_id", DEFAULT_STORE_ID)
          .maybeSingle()

        if (checkError) {
          console.error("Erro ao verificar categoria de adicional existente:", JSON.stringify(checkError))
          return null
        }

        // Se a categoria existir, atualizar
        if (existingData) {
          console.log("Atualizando categoria de adicional existente com ID:", category.id)
          
          // Preparar dados para atualização
          const categoryData = {
            name: category.name,
            display_order: category.order, // Mapear order da interface para display_order no banco
            active: category.active,
            store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000",
          }
          
          const { error: updateError } = await supabase
            .from("additional_categories")
            .update(categoryData)
            .eq("id", category.id)
            .eq("store_id", DEFAULT_STORE_ID)

          if (updateError) {
            console.error("Erro ao atualizar categoria de adicional:", JSON.stringify(updateError))
            return null
          }

          // Buscar os dados atualizados
          return this.getAdditionalCategoryById(category.id)
        }
      }
      
      // Se chegou aqui, é uma nova categoria ou o ID fornecido não existe
      console.log("Inserindo nova categoria de adicional")
      
      // Preparar dados para inserção - incluindo o ID para evitar violação de restrição not-null
      const categoryData = {
        id: category.id, // Incluir o ID para evitar valor nulo
        name: category.name,
        display_order: category.order, // Mapear order da interface para display_order no banco
        active: category.active,
        store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000",
      }
      
      console.log("Dados para inserção:", JSON.stringify(categoryData))
      
      const { data: insertData, error: insertError } = await supabase
        .from("additional_categories")
        .insert(categoryData)
        .select("id")

      if (insertError) {
        console.error("Erro ao inserir categoria de adicional:", JSON.stringify(insertError))
        return null
      }

      if (!insertData || !Array.isArray(insertData) || insertData.length === 0) {
        console.error("Nenhum dado retornado após inserção")
        return null
      }

      const newId = Number(insertData[0].id)
      console.log("Nova categoria de adicional inserida com ID:", newId)
      
      // Buscar os dados completos da nova categoria
      return this.getAdditionalCategoryById(newId)
    } catch (error) {
      console.error("Erro ao salvar categoria de adicional:", error)
      return null
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
        .eq("store_id", DEFAULT_STORE_ID)

      if (error) {
        console.error(`Erro ao excluir categoria de adicional ${id}:`, JSON.stringify(error))
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao excluir categoria de adicional ${id}:`, error)
      return false
    }
  }
}

// Exportar funções individuais para facilitar o uso
export const getAllAdditionalCategories = AdditionalCategoryService.getAllAdditionalCategories.bind(AdditionalCategoryService)
export const getActiveAdditionalCategories = AdditionalCategoryService.getActiveAdditionalCategories.bind(AdditionalCategoryService)
export const getAdditionalCategoryById = AdditionalCategoryService.getAdditionalCategoryById.bind(AdditionalCategoryService)
export const saveAdditionalCategory = AdditionalCategoryService.saveAdditionalCategory.bind(AdditionalCategoryService)
export const deleteAdditionalCategory = AdditionalCategoryService.deleteAdditionalCategory.bind(AdditionalCategoryService)

// O tipo AdditionalCategory já é exportado acima
