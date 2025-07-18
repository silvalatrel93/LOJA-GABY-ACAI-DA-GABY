import { createSupabaseClient } from "../supabase-client"
import type { Product } from "../types"

export const ProductService = {
  // Obter todos os produtos
  async getAllProducts(): Promise<Product[]> {
    try {
      const supabase = createSupabaseClient()

      // Primeiro, tenta buscar com hidden_from_delivery
      let { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          hidden_from_delivery,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .order("id")

      // Se der erro (possivelmente porque a coluna não existe), tenta sem hidden_from_delivery
      if (error && error.message?.includes('hidden_from_delivery')) {
        const fallbackResult = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            image,
            sizes,
            table_sizes,
            category_id,
            categories!products_category_id_fkey(name),
            active,
            hidden,
            hidden_from_table,
            allowed_additionals,
            additionals_limit,
            needs_spoon
          `)
          .order("id")

        data = fallbackResult.data
        error = fallbackResult.error
      }

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
        tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
          ? String((item.categories as any).name)
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        hiddenFromTable: Boolean(item.hidden_from_table || false),
        hiddenFromDelivery: Boolean(item.hidden_from_delivery || false),
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

      // Primeiro, tenta buscar com hidden_from_delivery
      let { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          hidden_from_delivery,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("active", true)
        .order("id")

      // Se der erro (possivelmente porque a coluna não existe), tenta sem hidden_from_delivery
      if (error && error.message?.includes('hidden_from_delivery')) {
        const fallbackResult = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            image,
            sizes,
            table_sizes,
            category_id,
            categories!products_category_id_fkey(name),
            active,
            hidden,
            hidden_from_table,
            allowed_additionals,
            additionals_limit,
            needs_spoon
          `)
          .eq("active", true)
          .order("id")

        data = fallbackResult.data
        error = fallbackResult.error
      }

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
        tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
          ? String((item.categories as any).name)
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        hiddenFromTable: Boolean(item.hidden_from_table || false),
        hiddenFromDelivery: Boolean(item.hidden_from_delivery || false),
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

      // Primeiro, tenta buscar com hidden_from_delivery
      let { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          hidden_from_delivery,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("active", true)
        .eq("hidden", false)
        .order("id")

      // Se der erro (possivelmente porque a coluna não existe), tenta sem hidden_from_delivery
      if (error && error.message?.includes('hidden_from_delivery')) {
        const fallbackResult = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            image,
            sizes,
            table_sizes,
            category_id,
            categories!products_category_id_fkey(name),
            active,
            hidden,
            hidden_from_table,
            allowed_additionals,
            additionals_limit,
            needs_spoon
          `)
          .eq("active", true)
          .eq("hidden", false)
          .order("id")

        data = fallbackResult.data
        error = fallbackResult.error
      }

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
        tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
        categoryId: Number(item.category_id),
        categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
          ? String((item.categories as any).name)
          : "",
        active: Boolean(item.active),
        hidden: Boolean(item.hidden || false),
        hiddenFromTable: Boolean(item.hidden_from_table || false),
        hiddenFromDelivery: Boolean(item.hidden_from_delivery || false),
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

      // Primeiro, tenta buscar com hidden_from_delivery
      let { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          description,
          image,
          sizes,
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          hidden_from_delivery,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
        .eq("id", id)
        .single()

      // Se der erro (possivelmente porque a coluna não existe), tenta sem hidden_from_delivery
      if (error && error.message?.includes('hidden_from_delivery')) {
        const fallbackResult = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            image,
            sizes,
            table_sizes,
            category_id,
            categories!products_category_id_fkey(name),
            active,
            hidden,
            hidden_from_table,
            allowed_additionals,
            additionals_limit,
            needs_spoon
          `)
          .eq("id", id)
          .single()

        data = fallbackResult.data
        error = fallbackResult.error
      }

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
        tableSizes: Array.isArray(data.table_sizes) ? data.table_sizes : undefined,
        categoryId: Number(data.category_id),
        categoryName: data.categories && typeof data.categories === 'object' && data.categories !== null && 'name' in data.categories
          ? String((data.categories as any).name)
          : "",
        active: Boolean(data.active),
        hidden: Boolean(data.hidden || false),
        hiddenFromTable: Boolean(data.hidden_from_table || false),
        hiddenFromDelivery: Boolean(data.hidden_from_delivery || false),
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
          table_sizes: product.tableSizes || null,
          category_id: product.categoryId,
          active: Boolean(product.active),
          hidden: Boolean(product.hidden || false),
          allowed_additionals: product.allowedAdditionals || [],
          additionals_limit: product.additionalsLimit || 5,
          needs_spoon: product.needsSpoon || false,
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
          tableSizes: Array.isArray(data.table_sizes) ? data.table_sizes : undefined,
          categoryId: Number(data.category_id),
          active: Boolean(data.active),
          hidden: Boolean(data.hidden || false),
          hiddenFromDelivery: Boolean(data.hidden_from_delivery || false),
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
          table_sizes: product.tableSizes || null,
          category_id: product.categoryId,
          active: Boolean(product.active !== undefined ? product.active : true),
          hidden: Boolean(product.hidden || false),
          allowed_additionals: product.allowedAdditionals || [],
          additionals_limit: product.additionalsLimit || 5,
          needs_spoon: product.needsSpoon || false,
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
          tableSizes: Array.isArray(data.table_sizes) ? data.table_sizes : undefined,
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

/**
 * Detecta se estamos em contexto de mesa através da URL e localStorage
 */
function isTableContext(): boolean {
  if (typeof window === 'undefined') return false

  const currentPath = window.location.pathname
  const mesaAtual = localStorage.getItem('mesa_atual')

  // Verificar se estamos na rota de mesa OU se há dados de mesa no localStorage
  return currentPath.startsWith('/mesa/') || !!mesaAtual
}

/**
 * Aplica preços de mesa automaticamente se estivermos em contexto de mesa
 */
function applyTablePricesIfNeeded(products: Product[]): Product[] {
  // Só aplicar se estivermos em contexto de mesa
  if (!isTableContext()) {
    return products
  }

  return products.map(product => {
    // Verificar se o produto tem preços de mesa configurados
    if (product.tableSizes && Array.isArray(product.tableSizes) && product.tableSizes.length > 0) {
      // Aplicar os preços de mesa substituindo os preços padrão
      return {
        ...product,
        sizes: product.tableSizes
      }
    } else {
      return product
    }
  })
}

/**
 * Buscar produtos ativos com aplicação automática de preços de mesa
 */
export async function getActiveProductsWithContext(): Promise<Product[]> {
  const products = await getActiveProducts()
  return applyTablePricesIfNeeded(products)
}

/**
 * Buscar produtos visíveis com aplicação automática de preços de mesa
 * Detecta automaticamente se está em contexto de mesa ou delivery
 */
export async function getVisibleProductsWithContext(): Promise<Product[]> {
  // Detectar contexto baseado na URL ou localStorage
  let isTableContext = false
  
  if (typeof window !== 'undefined') {
    // Verificar se está na rota de mesa
    const currentPath = window.location.pathname
    if (currentPath.startsWith('/mesa/')) {
      isTableContext = true
    } else {
      // Verificar se há dados de mesa no localStorage
      const mesaAtual = localStorage.getItem('mesa_atual')
      if (mesaAtual) {
        try {
          const mesa = JSON.parse(mesaAtual)
          if (mesa && mesa.id) {
            isTableContext = true
          }
        } catch (e) {
          // Ignorar erro de parsing
        }
      }
    }
  }

  // Usar a função apropriada baseada no contexto
  let products: Product[]
  if (isTableContext) {
    console.log('ProductService: Carregando produtos para contexto de mesa')
    products = await getVisibleProductsForTable()
    // Aplicar preços de mesa se disponíveis
    return applyTablePricesIfNeeded(products)
  } else {
    console.log('ProductService: Carregando produtos para contexto de delivery')
    products = await getVisibleProductsForDelivery()
    // Para delivery, não aplicar preços de mesa
    return products
  }
}

/**
 * Obter produtos visíveis no delivery (ativos, não ocultos geralmente, e não ocultos específicamente do delivery)
 */
export async function getVisibleProductsForDelivery(): Promise<Product[]> {
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
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          hidden_from_delivery,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
      .eq("active", true)
      .eq("hidden", false)
      .eq("hidden_from_delivery", false)
      .order("id")

    if (error) {
      console.error("Erro ao buscar produtos visíveis no delivery:", error)
      // Fallback para quando a coluna hidden_from_delivery não existe ainda
      if (error.message?.includes("hidden_from_delivery")) {
        console.warn("Coluna hidden_from_delivery não existe. Aplicar migração.")
        // Fallback: buscar apenas produtos ativos e não ocultos (sem filtro de delivery)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("products")
          .select(`
              id,
              name,
              description,
              image,
              sizes,
              table_sizes,
              category_id,
              categories!products_category_id_fkey(name),
              active,
              hidden,
              hidden_from_table,
              allowed_additionals,
              additionals_limit,
              needs_spoon
            `)
          .eq("active", true)
          .eq("hidden", false)
          .order("id")

        if (fallbackError) {
          console.error("Erro no fallback para produtos visíveis no delivery:", fallbackError)
          return []
        }

        return (fallbackData || []).map((item: any) => ({
          id: Number(item.id),
          name: String(item.name),
          description: String(item.description || ""),
          image: String(item.image || ""),
          sizes: Array.isArray(item.sizes) ? item.sizes : [],
          tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
          categoryId: Number(item.category_id),
          categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
            ? String((item.categories as any).name)
            : "",
          active: Boolean(item.active),
          hidden: Boolean(item.hidden || false),
          hiddenFromTable: Boolean(item.hidden_from_table || false),
          hiddenFromDelivery: false, // Fallback: assume que não está oculto do delivery
          allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
          hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
          additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
          needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
        }))
      }
      return []
    }

    return (data || []).map((item: any) => ({
      id: Number(item.id),
      name: String(item.name),
      description: String(item.description || ""),
      image: String(item.image || ""),
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
      categoryId: Number(item.category_id),
      categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
        ? String((item.categories as any).name)
        : "",
      active: Boolean(item.active),
      hidden: Boolean(item.hidden || false),
      hiddenFromTable: Boolean(item.hidden_from_table || false),
      hiddenFromDelivery: Boolean(item.hidden_from_delivery || false),
      allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
      hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
      additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
      needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
    }))
  } catch (error) {
    console.error("Erro ao buscar produtos visíveis no delivery:", error)
    return []
  }
}

/**
 * Obter produtos visíveis em mesa (ativos, não ocultos geralmente, e não ocultos específicamente de mesa)
 */
export async function getVisibleProductsForTable(): Promise<Product[]> {
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
          table_sizes,
          category_id,
          categories!products_category_id_fkey(name),
          active,
          hidden,
          hidden_from_table,
          allowed_additionals,
          additionals_limit,
          needs_spoon
        `)
      .eq("active", true)
      .eq("hidden", false)
      .eq("hidden_from_table", false)
      .order("id")

    if (error) {
      console.error("Erro ao buscar produtos visíveis em mesa:", error)
      // Fallback para quando a coluna hidden_from_table não existe ainda
      if (error.message?.includes("hidden_from_table")) {
        console.warn("Coluna hidden_from_table não existe. Aplicar migração.")
        // Fallback: buscar apenas produtos ativos e não ocultos (sem filtro de mesa)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("products")
          .select(`
              id,
              name,
              description,
              image,
              sizes,
              table_sizes,
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

        if (fallbackError) {
          console.error("Erro no fallback para produtos visíveis em mesa:", fallbackError)
          return []
        }

        return (fallbackData || []).map((item: any) => ({
          id: Number(item.id),
          name: String(item.name),
          description: String(item.description || ""),
          image: String(item.image || ""),
          sizes: Array.isArray(item.sizes) ? item.sizes : [],
          tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
          categoryId: Number(item.category_id),
          categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
            ? String((item.categories as any).name)
            : "",
          active: Boolean(item.active),
          hidden: Boolean(item.hidden || false),
          hiddenFromTable: false, // Fallback: assume que não está oculto de mesa
          allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
          hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
          additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
          needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
        }))
      }
      return []
    }

    return (data || []).map((item: any) => ({
      id: Number(item.id),
      name: String(item.name),
      description: String(item.description || ""),
      image: String(item.image || ""),
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
      tableSizes: Array.isArray(item.table_sizes) ? item.table_sizes : undefined,
      categoryId: Number(item.category_id),
      categoryName: item.categories && typeof item.categories === 'object' && item.categories !== null && 'name' in item.categories
        ? String((item.categories as any).name)
        : "",
      active: Boolean(item.active),
      hidden: Boolean(item.hidden || false),
      hiddenFromTable: Boolean(item.hidden_from_table || false),
      allowedAdditionals: Array.isArray(item.allowed_additionals) ? item.allowed_additionals : [],
      hasAdditionals: Array.isArray(item.allowed_additionals) && item.allowed_additionals.length > 0,
      additionalsLimit: typeof item.additionals_limit === 'number' ? item.additionals_limit : undefined,
      needsSpoon: typeof item.needs_spoon === 'boolean' ? item.needs_spoon : undefined,
    }))
  } catch (error) {
    console.error("Erro ao buscar produtos visíveis em mesa:", error)
    return []
  }
}

/**
 * Alternar visibilidade do produto no delivery
 */
export async function toggleDeliveryVisibility(productId: number): Promise<boolean> {
  try {
    const supabase = createSupabaseClient()

    // Primeiro, obter o estado atual
    const { data: currentProduct, error: fetchError } = await supabase
      .from("products")
      .select("hidden_from_delivery")
      .eq("id", productId)
      .single()

    if (fetchError) {
      console.error("Erro ao buscar produto para alternar visibilidade no delivery:", fetchError)
      return false
    }

    // Alternar o estado
    const newHiddenFromDelivery = !currentProduct.hidden_from_delivery

    const { error } = await supabase
      .from("products")
      .update({ hidden_from_delivery: newHiddenFromDelivery })
      .eq("id", productId)

    if (error) {
      console.error("Erro ao alternar visibilidade do produto no delivery:", error)
      return false
    }

    console.log(`Produto ${productId} ${newHiddenFromDelivery ? 'ocultado do' : 'exibido no'} delivery`)
    return true
  } catch (error) {
    console.error("Erro ao alternar visibilidade do produto no delivery:", error)
    return false
  }
}

// Exportar funções individuais para facilitar o uso
export const getAllProducts = ProductService.getAllProducts.bind(ProductService)
export const getActiveProducts = ProductService.getActiveProducts.bind(ProductService)
export const getVisibleProducts = ProductService.getVisibleProducts.bind(ProductService)
export const getProductById = ProductService.getProductById.bind(ProductService)
export const saveProduct = ProductService.saveProduct.bind(ProductService)
export const deleteProduct = ProductService.deleteProduct.bind(ProductService)
export const toggleProductVisibility = ProductService.toggleProductVisibility.bind(ProductService)
// getVisibleProductsForTable e getVisibleProductsForDelivery são exportadas como funções standalone acima

// Exportar tipos
export type { Product } from "../types"
