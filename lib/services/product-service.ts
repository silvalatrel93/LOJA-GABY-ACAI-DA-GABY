import { createSupabaseClient } from "../supabase-client"
import type { Product } from "../types"

export const ProductService = {
  // Obter todos os produtos
  async getAllProducts(): Promise<Product[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .order("id")

      if (error) {
        console.error("Erro ao buscar produtos:", error)
        return []
      }

      return data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        description: String(item.description || ""),
        image: String(item.image || ""),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories 
          ? String((item.categories as any).name) 
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
        hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
        additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
        needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar produtos:", error)
      return []
    }
  },

  // Obter produtos ativos
  async getActiveProducts(): Promise<Product[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("active", true)
        .order("id")

      if (error) {
        console.error("Erro ao buscar produtos ativos:", error)
        return []
      }

      return data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        description: String(item.description || ""),
        image: String(item.image || ""),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories 
          ? String((item.categories as any).name) 
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
        hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
        additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
        needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar produtos ativos:", error)
      return []
    }
  },

  // Obter produtos visíveis (ativos e não ocultos)
  async getVisibleProducts(): Promise<Product[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("active", true)
        .eq("hidden", false)
        .order("id")

      if (error) {
        console.error("Erro ao buscar produtos visíveis:", error)
        return []
      }

      return data.map((item: any) => ({
        id: Number(item.id),
        name: String(item.name),
        description: String(item.description || ""),
        image: String(item.image || ""),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories 
          ? String((item.categories as any).name) 
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
        hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
        additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
        needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar produtos visíveis:", error)
      return []
    }
  },

  // Obter produto por ID
  async getProductById(id: number): Promise<Product | null> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("id", id)
        .single()

      if (error) {
        console.error(`Erro ao buscar produto ${id}:`, error)
        return null
      }

      if (!data) {
        return null
      }

      return {
        id: Number(data.id),
        name: String(data.name),
        description: String(data.description || ""),
        image: String(data.image || ""),
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        categoryId: Number(data.category_id),
        categoryName: data.categories && typeof data.categories === 'object' && data.categories !== null && 'name' in data.categories 
          ? String((data.categories as any).name) 
          : "",
        active: Boolean(data.active),
        hidden: Boolean(data.hidden || false),
        allowedAdditionals: Array.isArray(data.allowed_additionals) ? data.allowed_additionals : [],
        hasAdditionals: Array.isArray(data.allowed_additionals) && data.allowed_additionals.length > 0,
        additionalsLimit: typeof data.additionals_limit === 'number' ? data.additionals_limit : undefined,
        needsSpoon: typeof data.needs_spoon === 'boolean' ? data.needs_spoon : undefined,
      }
    } catch (error) {
      console.error(`Erro ao buscar produto ${id}:`, error)
      return null
    }
  },

  // Salvar produto
  async saveProduct(product: Product): Promise<{ data: Product | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()

      // Determinar se é uma atualização (produto já existe no banco) ou criação (produto novo)
      const isUpdate = product.id && product.id > 0

      if (isUpdate) {
        // Preparar dados para atualização com validação
        const updateData = {
          name: product.name,
          description: product.description || "",
          image: product.image || "",
          sizes: product.sizes || [],
          category_id: product.categoryId,
          active: Boolean(product.active),
          hidden: Boolean(product.hidden || false),
          allowed_additionals: product.allowedAdditionals || [],
          additionals_limit: product.additionalsLimit || 5,
          needs_spoon: product.needsSpoon || false,
          store_id: "00000000-0000-0000-0000-000000000000", // Store ID padrão
        }

        console.log("Dados para atualização:", updateData)

        // Atualizar produto existente
        const { data, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", product.id)
          .select()
          .single()

        if (error) {
          console.error("Erro ao atualizar produto:", {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            productData: {
              id: product.id,
              name: product.name,
              hidden: product.hidden
            }
          })
          return { data: null, error: new Error(error.message || 'Erro desconhecido ao atualizar produto') }
        }

        const result: Product = {
          id: Number(data.id),
          name: String(data.name),
          description: String(data.description || ""),
          image: String(data.image || ""),
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          categoryId: Number(data.category_id),
          active: Boolean(data.active),
          hidden: Boolean(data.hidden || false),
          allowedAdditionals: Array.isArray(data.allowed_additionals) ? data.allowed_additionals : [],
          hasAdditionals: Array.isArray(data.allowed_additionals) && data.allowed_additionals.length > 0,
          additionalsLimit: typeof data.additionals_limit === 'number' ? data.additionals_limit : undefined,
          needsSpoon: typeof data.needs_spoon === 'boolean' ? data.needs_spoon : undefined,
        }

        return { data: result, error: null }
      } else {
        // Preparar dados para criação com validação
        const insertData = {
          name: product.name,
          description: product.description || "",
          image: product.image || "",
          sizes: product.sizes || [],
          category_id: product.categoryId,
          active: Boolean(product.active !== undefined ? product.active : true),
          hidden: Boolean(product.hidden || false),
          allowed_additionals: product.allowedAdditionals || [],
          additionals_limit: product.additionalsLimit || 5,
          needs_spoon: product.needsSpoon || false,
          store_id: "00000000-0000-0000-0000-000000000000", // Store ID padrão
        }

        console.log("Dados para criação:", insertData)

        // Criar novo produto
        const { data, error } = await supabase
          .from("products")
          .insert(insertData)
          .select()
          .single()

        if (error) {
          console.error("Erro ao criar produto:", {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            productData: {
              name: product.name,
              hidden: product.hidden
            }
          })
          return { data: null, error: new Error(error.message || 'Erro desconhecido ao criar produto') }
        }

        const result: Product = {
          id: Number(data.id),
          name: String(data.name),
          description: String(data.description || ""),
          image: String(data.image || ""),
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          categoryId: Number(data.category_id),
          active: Boolean(data.active),
          hidden: Boolean(data.hidden || false),
          allowedAdditionals: Array.isArray(data.allowed_additionals) ? data.allowed_additionals : [],
          hasAdditionals: Array.isArray(data.allowed_additionals) && data.allowed_additionals.length > 0,
          additionalsLimit: typeof data.additionals_limit === 'number' ? data.additionals_limit : undefined,
          needsSpoon: typeof data.needs_spoon === 'boolean' ? data.needs_spoon : undefined,
        }

        return { data: result, error: null }
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  },

  // Excluir produto
  async deleteProduct(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar produto ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao deletar produto ${id}:`, error)
      return false
    }
  },

  // Alternar visibilidade do produto
  async toggleProductVisibility(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()
      
      // Primeiro buscar o produto atual
      const { data: currentProduct, error: fetchError } = await supabase
        .from("products")
        .select("hidden")
        .eq("id", id)
        .single()

      if (fetchError) {
        console.error(`Erro ao buscar produto ${id}:`, fetchError)
        return false
      }

      // Inverter o valor de hidden
      const newHiddenValue = !currentProduct.hidden

      const { error } = await supabase
        .from("products")
        .update({ hidden: newHiddenValue })
        .eq("id", id)

      if (error) {
        console.error(`Erro ao alterar visibilidade do produto ${id}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Erro ao alterar visibilidade do produto ${id}:`, error)
      return false
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllProducts = ProductService.getAllProducts.bind(ProductService)
export const getActiveProducts = ProductService.getActiveProducts.bind(ProductService)
export const getVisibleProducts = ProductService.getVisibleProducts.bind(ProductService)
export const getProductById = ProductService.getProductById.bind(ProductService)
export const saveProduct = ProductService.saveProduct.bind(ProductService)
export const deleteProduct = ProductService.deleteProduct.bind(ProductService)
export const toggleProductVisibility = ProductService.toggleProductVisibility.bind(ProductService)

// Exportar tipos
export type { Product } from "../types"
