import { createSupabaseClient } from "../supabase-client"
import type { Additional } from "../types"

// Serviço para gerenciar adicionais
export const AdditionalService = {
  // Obter todos os adicionais
  async getAllAdditionals(): Promise<Additional[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("additionals").select("*, category:categories(name)").order("name")

    if (error) {
      console.error("Erro ao buscar adicionais:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      image: item.image || "",
    }))
  },

  // Obter adicionais ativos
  async getActiveAdditionals(): Promise<Additional[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("additionals")
      .select("*, category:categories(name)")
      .eq("active", true)
      .order("name")

    if (error) {
      console.error("Erro ao buscar adicionais ativos:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      image: item.image || "",
    }))
  },

  // Obter adicionais ativos por produto
  async getActiveAdditionalsByProduct(productId: number): Promise<Additional[]> {
    const supabase = createSupabaseClient()

    // Primeiro, buscar o produto para obter a lista de IDs de adicionais permitidos
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("allowed_additionals")
      .eq("id", productId)
      .single()

    if (productError) {
      console.error(`Erro ao buscar produto ${productId}:`, productError)
      return []
    }

    // Se o produto não tiver adicionais permitidos ou for um array vazio, retornar todos os adicionais ativos
    if (!productData.allowed_additionals || productData.allowed_additionals.length === 0) {
      return this.getActiveAdditionals()
    }

    // Buscar apenas os adicionais permitidos para este produto
    const { data, error } = await supabase
      .from("additionals")
      .select("*, category:categories(name)")
      .eq("active", true)
      .in("id", productData.allowed_additionals)
      .order("name")

    if (error) {
      console.error(`Erro ao buscar adicionais para o produto ${productId}:`, error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      image: item.image || "",
    }))
  },

  // Obter adicional por ID
  async getAdditionalById(id: number): Promise<Additional | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("additionals")
      .select("*, category:categories(name)")
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Erro ao buscar adicional ${id}:`, error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      categoryId: data.category_id,
      categoryName: data.category?.name || "",
      active: data.active,
      image: data.image || "",
    }
  },

  // Salvar adicional
  async saveAdditional(additional: Additional): Promise<Additional | null> {
    const supabase = createSupabaseClient()

    const additionalData = {
      id: additional.id,
      name: additional.name,
      price: additional.price,
      category_id: additional.categoryId,
      active: additional.active,
      image: additional.image || "",
    }

    let result

    if (additional.id) {
      // Atualizar adicional existente
      result = await supabase
        .from("additionals")
        .update(additionalData)
        .eq("id", additional.id)
        .select("*, category:categories(name)")
        .single()
    } else {
      // Criar novo adicional
      result = await supabase.from("additionals").insert(additionalData).select("*, category:categories(name)").single()
    }

    if (result.error) {
      console.error("Erro ao salvar adicional:", result.error)
      return null
    }

    const data = result.data

    return {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      categoryId: data.category_id,
      categoryName: data.category?.name || "",
      active: data.active,
      image: data.image || "",
    }
  },

  // Excluir adicional
  async deleteAdditional(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("additionals").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir adicional ${id}:`, error)
      return false
    }

    return true
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllAdditionals = AdditionalService.getAllAdditionals.bind(AdditionalService)
export const getActiveAdditionals = AdditionalService.getActiveAdditionals.bind(AdditionalService)
export const getActiveAdditionalsByProduct = AdditionalService.getActiveAdditionalsByProduct.bind(AdditionalService)
export const getAdditionalById = AdditionalService.getAdditionalById.bind(AdditionalService)
export const saveAdditional = AdditionalService.saveAdditional.bind(AdditionalService)
export const deleteAdditional = AdditionalService.deleteAdditional.bind(AdditionalService)
