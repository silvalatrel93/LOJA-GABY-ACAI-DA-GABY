import { createSupabaseClient, createSupabaseClientWithStoreContext } from "../supabase-client"
import type { Product } from "../types"

// Serviço para gerenciar produtos
export const ProductService = {
  // Obter todos os produtos
  async getAllProducts(storeId?: string): Promise<Product[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("products").select("*, categories(name)").order("id")

      if (error) {
        console.error("Erro ao buscar produtos:", error)
        return []
      }

      return data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        sizes: product.sizes,
        categoryId: product.category_id,
        categoryName: product.categories?.name,
        active: product.active,
        allowedAdditionals: product.allowed_additionals || [],
        storeId: product.store_id,
      }))
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      return []
    }
  },

  // Obter produtos ativos
  async getActiveProducts(storeId?: string): Promise<Product[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("active", true)
        .order("id")

      if (error) {
        console.error("Erro ao buscar produtos ativos:", error)
        return []
      }

      return data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        sizes: product.sizes,
        categoryId: product.category_id,
        categoryName: product.categories?.name,
        active: product.active,
        allowedAdditionals: product.allowed_additionals || [],
        storeId: product.store_id,
      }))
    } catch (error) {
      console.error("Erro ao buscar produtos ativos:", error)
      return []
    }
  },

  // Obter produto por ID
  async getProductById(id: number, storeId?: string): Promise<Product | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase.from("products").select("*, categories(name)").eq("id", id).single()

      if (error) {
        console.error(`Erro ao buscar produto ${id}:`, error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        image: data.image,
        sizes: data.sizes,
        categoryId: data.category_id,
        categoryName: data.categories?.name,
        active: data.active,
        allowedAdditionals: data.allowed_additionals || [],
        storeId: data.store_id,
      }
    } catch (error) {
      console.error(`Erro ao buscar produto ${id}:`, error)
      return null
    }
  },

  // Obter produtos por categoria
  async getProductsByCategory(categoryId: number, storeId?: string): Promise<Product[]> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("category_id", categoryId)
        .order("id")

      if (error) {
        console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error)
        return []
      }

      return data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        sizes: product.sizes,
        categoryId: product.category_id,
        categoryName: product.categories?.name,
        active: product.active,
        allowedAdditionals: product.allowed_additionals || [],
        storeId: product.store_id,
      }))
    } catch (error) {
      console.error(`Erro ao buscar produtos da categoria ${categoryId}:`, error)
      return []
    }
  },

  // Salvar produto
  async saveProduct(product: Product, storeId?: string): Promise<Product | null> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { data, error } = await supabase
        .from("products")
        .upsert({
          id: product.id || undefined,
          name: product.name,
          description: product.description,
          image: product.image,
          sizes: product.sizes,
          category_id: product.categoryId,
          active: product.active,
          allowed_additionals: product.allowedAdditionals,
          store_id: storeId || product.storeId,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao salvar produto:", error)
        return null
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        image: data.image,
        sizes: data.sizes,
        categoryId: data.category_id,
        active: data.active,
        allowedAdditionals: data.allowed_additionals || [],
        storeId: data.store_id,
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      return null
    }
  },

  // Excluir produto
  async deleteProduct(id: number, storeId?: string): Promise<boolean> {
    try {
      let supabase = createSupabaseClient()

      // Se tiver storeId, definir o contexto da loja
      if (storeId) {
        supabase = await createSupabaseClientWithStoreContext(storeId)
      }

      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        console.error(`Erro ao excluir produto ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao excluir produto ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para compatibilidade com código existente
export const getAllProducts = ProductService.getAllProducts.bind(ProductService)
export const getActiveProducts = ProductService.getActiveProducts.bind(ProductService)
export const getAllActiveProducts = ProductService.getActiveProducts.bind(ProductService)
export const getProductById = ProductService.getProductById.bind(ProductService)
export const getProductsByCategory = ProductService.getProductsByCategory.bind(ProductService)
export const saveProduct = ProductService.saveProduct.bind(ProductService)
export const deleteProduct = ProductService.deleteProduct.bind(ProductService)
