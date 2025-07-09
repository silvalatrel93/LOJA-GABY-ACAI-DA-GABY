import { createSupabaseClient } from "../supabase-client"
import type { Additional } from "../types"
import type { AdditionalCategory } from "./additional-category-service"
import { getActiveAdditionalCategories } from "./additional-category-service"

// Serviço para gerenciar adicionais
export const AdditionalService = {
  // Obter todos os adicionais
  async getAllAdditionals(): Promise<Additional[]> {
    try {
      console.log("Iniciando getAllAdditionals")
      
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
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
        .single()

      if (productError) {
        console.error(`Erro ao buscar produto ${productId}:`, JSON.stringify(productError))
        return []
      }

      // Se o produto não tiver adicionais permitidos ou for um array vazio, retornar todos os adicionais ativos
      if (!productData || !productData.allowed_additionals || !Array.isArray(productData.allowed_additionals) || productData.allowed_additionals.length === 0) {
        return this.getActiveAdditionals()
      }

      // Buscar todos os adicionais ativos que estão na lista de permitidos
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("active", true)
        .in("id", productData.allowed_additionals)

      if (error) {
        console.error(`Erro ao buscar adicionais para o produto ${productId}:`, JSON.stringify(error))
        return []
      }

      // Verificar se data existe
      if (!data || !Array.isArray(data)) {
        return []
      }

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
      
      console.log('🔍 DEBUG - Serviço: Dados processados para produto', productId, ':', result);
      return result
    } catch (error) {
      console.error(`Erro ao buscar adicionais para o produto ${productId}:`, error)
      return []
    }
  },

  // Obter adicionais ativos agrupados por categoria
  async getActiveAdditionalsByProductGroupedByCategory(productId: number): Promise<{category: AdditionalCategory, additionals: Additional[]}[]> {
    try {
      console.log("Iniciando getActiveAdditionalsByProductGroupedByCategory para produto ID:", productId)
      
      // Primeiro, obter o produto para verificar os adicionais permitidos
      const supabase = createSupabaseClient()
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("allowed_additionals")
        .eq("id", productId)
        .single()

      if (productError || !productData) {
        console.error("Erro ao buscar produto:", productError)
        return []
      }

      // Verificar se o produto tem adicionais permitidos
      if (!productData.allowed_additionals || !Array.isArray(productData.allowed_additionals) || productData.allowed_additionals.length === 0) {
        console.log("Produto não tem adicionais permitidos")
        return []
      }

      // Buscar todos os adicionais ativos que estão na lista de permitidos
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("active", true)
        .in("id", productData.allowed_additionals)

      if (error) {
        console.error("Erro ao buscar adicionais:", error)
        return []
      }

      if (!data || !Array.isArray(data)) {
        console.log("Nenhum adicional encontrado ou data não é um array")
        return []
      }

      // Buscar todas as categorias ativas
      const categories = await getActiveAdditionalCategories()

      // Agrupar adicionais por categoria
      const additionalsByCategory: { [key: number]: Additional[] } = {}

      // Processar adicionais
      data.forEach((item: any) => {
        const additional: Additional = {
          id: Number(item.id),
          name: String(item.name),
          price: Number(item.price),
          categoryId: Number(item.category_id),
          categoryName: item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String((item.category as any).name) : "",
          active: Boolean(item.active),
          image: item.image ? String(item.image) : "",
        }

        if (!additionalsByCategory[additional.categoryId]) {
          additionalsByCategory[additional.categoryId] = []
        }
        additionalsByCategory[additional.categoryId].push(additional)
      })

      // Montar resultado com categorias e seus adicionais
      const result = categories
        .filter(category => additionalsByCategory[category.id]?.length > 0)
        .map(category => ({
          category,
          additionals: additionalsByCategory[category.id] || []
        }))

      console.log("Adicionais agrupados por categoria processados:", JSON.stringify(result))
      return result
    } catch (error) {
      console.error("Erro ao buscar adicionais agrupados por categoria:", error)
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
        .single()

      if (error) {
        console.error(`Erro ao buscar adicional ${id}:`, JSON.stringify(error))
        return null
      }

      if (!data) {
        return null
      }

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
  async saveAdditional(additional: Additional): Promise<{ data: Additional | null; error: Error | null }> {
    try {
      console.log("Salvando adicional:", additional)
      const supabase = createSupabaseClient()

      // Se o adicional tem ID, atualizamos; se não, criamos
      if (additional.id && additional.id > 0) {
        // Atualizar adicional existente
        const updateData = {
          name: additional.name,
          price: additional.price,
          category_id: additional.categoryId,
          active: additional.active,
          image: additional.image || null,
        }

        const { data, error } = await supabase
          .from("additionals")
          .update(updateData)
          .eq("id", additional.id)
          .select()
          .single()

        if (error) {
          console.error("Erro ao atualizar adicional:", error)
          return { data: null, error: new Error(error.message) }
        }

        if (!data) {
          return { data: null, error: new Error("Nenhum dado retornado após atualização") }
        }

        const result: Additional = {
          id: Number(data.id),
          name: String(data.name),
          price: Number(data.price),
          categoryId: Number(data.category_id),
          active: Boolean(data.active),
          image: data.image ? String(data.image) : "",
        }

        return { data: result, error: null }
      } else {
        // Criar novo adicional
        const insertData = {
          name: additional.name,
          price: additional.price,
          category_id: additional.categoryId,
          active: additional.active !== undefined ? additional.active : true,
          image: additional.image || null,
        }

        const { data, error } = await supabase
          .from("additionals")
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error("Erro ao criar adicional:", error)
          return { data: null, error: new Error(error.message) }
        }

        if (!data) {
          return { data: null, error: new Error("Nenhum dado retornado após criação") }
        }

        const result: Additional = {
          id: Number(data.id),
          name: String(data.name),
          price: Number(data.price),
          categoryId: Number(data.category_id),
          active: Boolean(data.active),
          image: data.image ? String(data.image) : "",
        }

        return { data: result, error: null }
      }
    } catch (error) {
      console.error("Erro ao salvar adicional:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
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

      if (error) {
        console.error(`Erro ao deletar adicional ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar adicional ${id}:`, error)
      return false
    }
  },

  // Função para obter todos os adicionais com paginação (para uso em telas de administração)
  async getAdditionalsPaginated(page: number = 1, limit: number = 10): Promise<{ additionals: Additional[]; total: number }> {
    try {
      const supabase = createSupabaseClient()
      const offset = (page - 1) * limit

      // Contar o total de registros
      const { count, error: countError } = await supabase
        .from("additionals")
        .select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Erro ao contar adicionais:", countError)
        return { additionals: [], total: 0 }
      }

      // Buscar os registros da página
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .order("name")
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("Erro ao buscar adicionais paginados:", error)
        return { additionals: [], total: 0 }
      }

      if (!data || !Array.isArray(data)) {
        return { additionals: [], total: count || 0 }
      }

      const additionals = data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        price: Number(item.price),
        categoryId: Number(item.category_id),
        categoryName: item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category ? String((item.category as any).name) : "",
        active: Boolean(item.active),
        image: item.image ? String(item.image) : "",
      }))

      return { additionals, total: count || 0 }
    } catch (error) {
      console.error("Erro ao buscar adicionais paginados:", error)
      return { additionals: [], total: 0 }
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllAdditionals = AdditionalService.getAllAdditionals.bind(AdditionalService)
export const getActiveAdditionals = AdditionalService.getActiveAdditionals.bind(AdditionalService)
export const getActiveAdditionalsByProduct = AdditionalService.getActiveAdditionalsByProduct.bind(AdditionalService)
export const getActiveAdditionalsByProductGroupedByCategory = AdditionalService.getActiveAdditionalsByProductGroupedByCategory.bind(AdditionalService)
export const getAdditionalById = AdditionalService.getAdditionalById.bind(AdditionalService)
export const saveAdditional = AdditionalService.saveAdditional.bind(AdditionalService)
export const deleteAdditional = AdditionalService.deleteAdditional.bind(AdditionalService)

// Exportar o tipo Additional
export type { Additional } from "../types"
