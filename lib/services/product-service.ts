import { createSupabaseClient } from "../supabase-client"
import type { Product } from "../types"

// Serviço para gerenciar produtos
export const ProductService = {
  // Obter todos os produtos
  async getAllProducts(): Promise<Product[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("products").select("*, category:categories(name)").order("name")

    if (error) {
      console.error("Erro ao buscar produtos:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      image: item.image || "",
      sizes: item.sizes,
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      allowedAdditionals: item.allowed_additionals || [],
    }))
  },

  // Obter produtos ativos
  async getActiveProducts(): Promise<Product[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("active", true)
      .order("name")

    if (error) {
      console.error("Erro ao buscar produtos ativos:", error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      image: item.image || "",
      sizes: item.sizes,
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      allowedAdditionals: item.allowed_additionals || [],
    }))
  },

  // Alias para getActiveProducts para compatibilidade
  async getAllActiveProducts(): Promise<Product[]> {
    return this.getActiveProducts()
  },

  // Obter produtos por categoria
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .eq("category_id", categoryId)
      .eq("active", true)
      .order("name")

    if (error) {
      console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      image: item.image || "",
      sizes: item.sizes,
      categoryId: item.category_id,
      categoryName: item.category?.name || "",
      active: item.active,
      allowedAdditionals: item.allowed_additionals || [],
    }))
  },

  // Obter produto por ID
  async getProductById(id: number): Promise<Product | null> {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("products").select("*, category:categories(name)").eq("id", id).single()

    if (error) {
      console.error(`Erro ao buscar produto ${id}:`, error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description || "",
      image: data.image || "",
      sizes: data.sizes,
      categoryId: data.category_id,
      categoryName: data.category?.name || "",
      active: data.active,
      allowedAdditionals: data.allowed_additionals || [],
    }
  },

  // Salvar produto
  async saveProduct(product: Product): Promise<Product | null> {
    const supabase = createSupabaseClient()

    const productData = {
      name: product.name,
      description: product.description,
      image: product.image,
      sizes: product.sizes,
      category_id: product.categoryId,
      active: product.active !== undefined ? product.active : true,
      allowed_additionals: product.allowedAdditionals || [],
    }

    try {
      let result

      // Verificar se o produto existe antes de tentar atualizar
      if (product.id) {
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("id", product.id)
          .maybeSingle()

        if (existingProduct) {
          // Produto existe, atualizar
          console.log(`Atualizando produto existente com ID: ${product.id}`)
          result = await supabase
            .from("products")
            .update(productData)
            .eq("id", product.id)
            .select("*, category:categories(name)")
        } else {
          // Produto não existe, criar novo
          console.log(`Produto com ID ${product.id} não encontrado. Criando novo produto.`)
          result = await supabase.from("products").insert(productData).select("*, category:categories(name)")
        }
      } else {
        // Criar novo produto
        console.log("Criando novo produto")
        result = await supabase.from("products").insert(productData).select("*, category:categories(name)")
      }

      if (result.error) {
        console.error("Erro ao salvar produto:", result.error)
        throw new Error(`Erro ao salvar produto: ${result.error.message}`)
      }

      if (!result.data || result.data.length === 0) {
        console.error("Falha ao salvar produto, nenhum dado retornado")
        throw new Error("Falha ao salvar produto, nenhum dado retornado")
      }

      // Usar o primeiro item do array de resultados
      const data = result.data[0]

      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        image: data.image || "",
        sizes: data.sizes,
        categoryId: data.category_id,
        categoryName: data.category?.name || "",
        active: data.active,
        allowedAdditionals: data.allowed_additionals || [],
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      throw error
    }
  },

  // Excluir produto
  async deleteProduct(id: number): Promise<boolean> {
    const supabase = createSupabaseClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error(`Erro ao excluir produto ${id}:`, error)
      return false
    }

    return true
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllProducts = ProductService.getAllProducts.bind(ProductService)
export const getActiveProducts = ProductService.getActiveProducts.bind(ProductService)
export const getAllActiveProducts = ProductService.getAllActiveProducts.bind(ProductService)
export const getProductsByCategory = ProductService.getProductsByCategory.bind(ProductService)
export const getProductById = ProductService.getProductById.bind(ProductService)
export const saveProduct = ProductService.saveProduct.bind(ProductService)
export const deleteProduct = ProductService.deleteProduct.bind(ProductService)

// Exportar tipos
export type { Product } from "../types"
