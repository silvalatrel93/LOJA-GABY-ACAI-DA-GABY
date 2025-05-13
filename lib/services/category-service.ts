import { createSupabaseClient } from "../supabase-client"
import type { Category } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

// Serviço para gerenciar categorias
export const CategoryService = {
  // Obter todas as categorias
  async getAllCategories(): Promise<Category[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("categories").select("*").order("order", { ascending: true })

    if (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }

    return data.map((category: any) => ({
      id: category.id as number,
      name: category.name as string,
      order: category.order as number,
      active: category.active as boolean,
    }))
  },
  
  // Obter categoria por ID
  async getCategoryById(id: number): Promise<Category | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).single()

    if (error) {
      console.error("Erro ao buscar categoria por ID:", error)
      return null
    }

    return {
      id: data.id as number,
      name: data.name as string,
      order: data.order as number,
      active: data.active as boolean,
    }
  },

  // Obter categorias ativas
  async getActiveCategories(): Promise<Category[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("order", { ascending: true })

    if (error) {
      console.error("Erro ao buscar categorias ativas:", error)
      return []
    }

    return data.map((category: any) => ({
      id: category.id as number,
      name: category.name as string,
      order: category.order as number,
      active: category.active as boolean,
    }))
  },

  // Salvar categoria (criar ou atualizar)
  async saveCategory(category: Category): Promise<Category | null> {
    const supabase = createSupabaseClient()

    const categoryData = {
      id: category.id,
      name: category.name,
      order: category.order,
      active: category.active,
      store_id: DEFAULT_STORE_ID, // Adicionar o ID da loja padrão
    }

    // Verificar se a categoria já existe
    const { data: existingCategory, error: checkError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", category.id)
      .maybeSingle()

    if (checkError) {
      console.error("Erro ao verificar categoria:", checkError)
      return null
    }

    if (existingCategory) {
      // Atualizar categoria existente
      const { data, error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", category.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar categoria:", error)
        return null
      }

      return {
        id: data.id as number,
        name: data.name as string,
        order: data.order as number,
        active: data.active as boolean,
      }
    } else {
      // Criar nova categoria
      const { data, error } = await supabase.from("categories").insert(categoryData).select().single()

      if (error) {
        console.error("Erro ao criar categoria:", error)
        return null
      }

      return {
        id: data.id as number,
        name: data.name as string,
        order: data.order as number,
        active: data.active as boolean,
      }
    }
  },

  // Excluir categoria
  async deleteCategory(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir categoria:", error)
      return false
    }

    return true
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllCategories = CategoryService.getAllCategories.bind(CategoryService)
export const getActiveCategories = CategoryService.getActiveCategories.bind(CategoryService)
export const getCategoryById = CategoryService.getCategoryById.bind(CategoryService)
export const saveCategory = CategoryService.saveCategory.bind(CategoryService)
export const deleteCategory = CategoryService.deleteCategory.bind(CategoryService)
