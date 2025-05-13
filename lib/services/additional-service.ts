import { createSupabaseClient } from "../supabase-client"
import type { Additional } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

console.log("DEFAULT_STORE_ID carregado:", DEFAULT_STORE_ID)

// Serviço para gerenciar adicionais
export const AdditionalService = {
  // Obter todos os adicionais
  async getAllAdditionals(): Promise<Additional[]> {
    try {
      console.log("Iniciando getAllAdditionals")
      console.log("DEFAULT_STORE_ID:", DEFAULT_STORE_ID)
      
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("store_id", DEFAULT_STORE_ID)
        .order("name")

      if (error) {
        console.error("Erro ao buscar adicionais:", JSON.stringify(error))
        return []
      }

      // Verificar se data existe
      if (!data || !Array.isArray(data)) {
        console.log("Nenhum dado de adicionais encontrado ou data não é um array")
        return []
      }

      console.log("Dados brutos de adicionais:", JSON.stringify(data))
      
      // Converter explicitamente os tipos para evitar erros de tipagem
      const result = data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        price: Number(item.price),
        categoryId: Number(item.category_id),
        categoryName: item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String((item.category as any).name) : "",
        active: Boolean(item.active),
        image: item.image ? String(item.image) : "",
      }))
      
      console.log("Adicionais processados:", JSON.stringify(result))
      return result
    } catch (error) {
      console.error("Erro ao buscar adicionais:", error)
      return []
    }
  },

  // Obter adicionais ativos
  async getActiveAdditionals(): Promise<Additional[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("active", true)
        .eq("store_id", DEFAULT_STORE_ID)
        .order("name")

      if (error) {
        console.error("Erro ao buscar adicionais ativos:", JSON.stringify(error))
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
        price: Number(item.price),
        categoryId: Number(item.category_id),
        categoryName: item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String((item.category as any).name) : "",
        active: Boolean(item.active),
        image: item.image ? String(item.image) : "",
      }))
    } catch (error) {
      console.error("Erro ao buscar adicionais ativos:", error)
      return []
    }
  },

  // Obter adicionais ativos por produto
  async getActiveAdditionalsByProduct(productId: number): Promise<Additional[]> {
    try {
      const supabase = createSupabaseClient()

      // Primeiro, buscar o produto para obter a lista de IDs de adicionais permitidos
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("allowed_additionals")
        .eq("id", productId)
        .eq("store_id", DEFAULT_STORE_ID)
        .single()

      if (productError) {
        console.error(`Erro ao buscar produto ${productId}:`, JSON.stringify(productError))
        return []
      }

      // Se o produto não tiver adicionais permitidos ou for um array vazio, retornar todos os adicionais ativos
      if (!productData || !productData.allowed_additionals || !Array.isArray(productData.allowed_additionals) || productData.allowed_additionals.length === 0) {
        return this.getActiveAdditionals()
      }

      // Buscar apenas os adicionais permitidos para este produto
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("active", true)
        .eq("store_id", DEFAULT_STORE_ID)
        .in("id", productData.allowed_additionals)
        .order("name")

      if (error) {
        console.error(`Erro ao buscar adicionais para o produto ${productId}:`, JSON.stringify(error))
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
        price: Number(item.price),
        categoryId: Number(item.category_id),
        categoryName: item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String((item.category as any).name) : "",
        active: Boolean(item.active),
        image: item.image ? String(item.image) : "",
      }))
    } catch (error) {
      console.error(`Erro ao buscar adicionais para o produto ${productId}:`, error)
      return []
    }
  },

  // Obter adicional por ID
  async getAdditionalById(id: number): Promise<Additional | null> {
    try {
      const supabase = createSupabaseClient()

      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)
        .maybeSingle()

      if (error) {
        console.error(`Erro ao buscar adicional com ID ${id}:`, JSON.stringify(error))
        return null
      }

      if (!data) {
        console.error(`Adicional ${id} não encontrado`)
        return null
      }

      // Converter explicitamente os tipos para evitar erros de tipagem
      return {
        id: Number(data.id),
        name: String(data.name),
        price: Number(data.price),
        categoryId: Number(data.category_id),
        categoryName: data.category && typeof data.category === 'object' && data.category !== null && 'name' in data.category ? String((data.category as any).name) : "",
        active: Boolean(data.active),
        image: data.image ? String(data.image) : "",
      }
    } catch (error) {
      console.error(`Erro ao buscar adicional ${id}:`, error)
      return null
    }
  },

  // Salvar adicional
  async saveAdditional(additional: Additional): Promise<Additional | null> {
    try {
      const supabase = createSupabaseClient()
      console.log("Iniciando saveAdditional com dados:", JSON.stringify(additional))
      console.log("DEFAULT_STORE_ID na função saveAdditional:", DEFAULT_STORE_ID)

      // Verificar se o ID é válido (se existir)
      if (additional.id) {
        console.log("Verificando se o adicional com ID", additional.id, "existe")
        const { data: existingData, error: checkError } = await supabase
          .from("additionals")
          .select("id")
          .eq("id", additional.id)
          .eq("store_id", DEFAULT_STORE_ID)
          .maybeSingle()

        if (checkError) {
          console.error("Erro ao verificar adicional existente:", JSON.stringify(checkError))
          return null
        }

        // Se o adicional existir, atualizar
        if (existingData) {
          console.log("Atualizando adicional existente com ID:", additional.id)
          
          // Preparar dados para atualização
          const additionalData = {
            name: additional.name,
            price: additional.price,
            category_id: additional.categoryId,
            active: additional.active,
            image: additional.image || "",
            store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000",
          }
          
          const { error: updateError } = await supabase
            .from("additionals")
            .update(additionalData)
            .eq("id", additional.id)
            .eq("store_id", DEFAULT_STORE_ID)

          if (updateError) {
            console.error("Erro ao atualizar adicional:", JSON.stringify(updateError))
            return null
          }

          // Buscar os dados atualizados
          return this.getAdditionalById(additional.id)
        }
      }
      
      // Se chegou aqui, é um novo adicional ou o ID fornecido não existe
      console.log("Inserindo novo adicional")
      
      // Preparar dados para inserção - sem incluir o ID para evitar conflitos
      const additionalData = {
        name: additional.name,
        price: additional.price,
        category_id: additional.categoryId,
        active: additional.active,
        image: additional.image || "",
        store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000",
      }
      
      console.log("Dados para inserção:", JSON.stringify(additionalData))
      
      const { data: insertData, error: insertError } = await supabase
        .from("additionals")
        .insert(additionalData)
        .select("id")

      if (insertError) {
        console.error("Erro ao inserir adicional:", JSON.stringify(insertError))
        return null
      }

      if (!insertData || !Array.isArray(insertData) || insertData.length === 0) {
        console.error("Nenhum dado retornado após inserção")
        return null
      }

      const newId = Number(insertData[0].id)
      console.log("Novo adicional inserido com ID:", newId)
      
      // Buscar os dados completos do novo adicional
      return this.getAdditionalById(newId)
    } catch (error) {
      console.error("Erro ao salvar adicional:", error)
      return null
    }
  },

  // Excluir adicional
  async deleteAdditional(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase
        .from("additionals")
        .delete()
        .eq("id", id)
        .eq("store_id", DEFAULT_STORE_ID)

      if (error) {
        console.error(`Erro ao excluir adicional ${id}:`, JSON.stringify(error))
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao excluir adicional ${id}:`, error)
      return false
    }
  }
}

// Exportar funções individuais para facilitar o uso
export const getAllAdditionals = AdditionalService.getAllAdditionals.bind(AdditionalService)
export const getActiveAdditionals = AdditionalService.getActiveAdditionals.bind(AdditionalService)
export const getActiveAdditionalsByProduct = AdditionalService.getActiveAdditionalsByProduct.bind(AdditionalService)
export const getAdditionalById = AdditionalService.getAdditionalById.bind(AdditionalService)
export const saveAdditional = AdditionalService.saveAdditional.bind(AdditionalService)
export const deleteAdditional = AdditionalService.deleteAdditional.bind(AdditionalService)

// Exportar o tipo Additional
export type { Additional } from "../types"
