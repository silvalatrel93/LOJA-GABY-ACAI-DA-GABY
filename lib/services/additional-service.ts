import { createSupabaseClient } from "../supabase-client"
import type { Additional } from "../types"
import { DEFAULT_STORE_ID } from "../constants"
import type { AdditionalCategory } from "./additional-category-service"
import { getActiveAdditionalCategories } from "./additional-category-service"

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

      // Buscar todos os adicionais ativos que estão na lista de permitidos
      const { data, error } = await supabase
        .from("additionals")
        .select("*, category:categories(name)")
        .eq("active", true)
        .eq("store_id", DEFAULT_STORE_ID)
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
        .eq("store_id", DEFAULT_STORE_ID)
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
        .eq("store_id", DEFAULT_STORE_ID)
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
      
      // Inicializar o mapa com todas as categorias (mesmo as que não têm adicionais)
      categories.forEach(category => {
        additionalsByCategory[category.id] = []
      })
      
      // Garantir que a categoria "Sem categoria" exista
      if (!additionalsByCategory[0]) {
        additionalsByCategory[0] = []
      }
      
      // Processar os adicionais e agrupá-los por categoria
      data.forEach(item => {
        // Garantir que categoryId seja um número válido
        const categoryId = typeof item.category_id === 'number' ? item.category_id : 0
        
        if (!additionalsByCategory[categoryId]) {
          additionalsByCategory[categoryId] = []
        }
        
        // Usar o nome da categoria que vem do join SQL se disponível
        const categoryName = item.category && typeof item.category === 'object' && item.category !== null && 'name' in item.category 
          ? String((item.category as any).name) 
          : (categories.find(c => c.id === categoryId)?.name || "Sem categoria");
        
        // Garantir que todos os campos necessários estejam presentes
        const additional: Additional = {
          id: typeof item.id === 'number' ? item.id : 0,
          name: typeof item.name === 'string' ? item.name : '',
          price: typeof item.price === 'number' ? item.price : 0,
          categoryId: categoryId,
          categoryName: categoryName,
          active: typeof item.active === 'boolean' ? item.active : true,
          image: typeof item.image === 'string' ? item.image : undefined
        }
        
        additionalsByCategory[categoryId].push(additional)
      })
      
      // Converter o mapa em um array de objetos {categoria, adicionais}
      const result = Object.entries(additionalsByCategory)
        .map(([categoryId, additionalsList]) => {
          // Encontrar a categoria correspondente
          const category = categories.find(c => c.id === Number(categoryId))
          
          // Se a categoria não existir e houver adicionais, criar uma categoria "Sem categoria"
          const categoryObj = category || {
            id: 0,
            name: "Sem categoria",
            order: 999, // Colocar no final da lista
            active: true
          }
          
          return {
            category: categoryObj,
            additionals: additionalsList
          }
        })
        // Filtrar categorias sem adicionais
        .filter(item => item.additionals.length > 0)
        // Ordenar por ordem da categoria
        .sort((a, b) => a.category.order - b.category.order)
      
      return result
    } catch (error) {
      console.error(`Erro ao buscar adicionais agrupados por categoria para o produto ${productId}:`, error)
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
  async saveAdditional(additional: Additional): Promise<{ data: Additional | null; error: Error | null }> {
    try {
      const supabase = createSupabaseClient()
      console.log("Iniciando saveAdditional com dados:", JSON.stringify(additional))
      console.log("DEFAULT_STORE_ID na função saveAdditional:", DEFAULT_STORE_ID)

      // Garantir que temos uma categoria válida
      let validCategoryId: number | null = null;
      
      // Verificar se temos uma categoria de produto válida
      if (additional.categoryId) {
        console.log("Verificando categoria de produto", additional.categoryId)
        
        // Verificar se a categoria existe na tabela categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("id")
          .eq("id", additional.categoryId)
          .maybeSingle()
        
        if (!categoryError && categoryData) {
          // A categoria existe, podemos usá-la
          validCategoryId = typeof categoryData.id === 'number' ? categoryData.id : Number(categoryData.id)
          console.log("Categoria válida encontrada com ID:", validCategoryId)
        } else {
          // A categoria não existe na tabela categories, vamos verificar nas additional_categories
          console.log("Categoria não encontrada na tabela categories, verificando additional_categories")
          
          const { data: additionalCategoryData, error: additionalCategoryError } = await supabase
            .from("additional_categories")
            .select("id, name")
            .eq("id", additional.categoryId)
            .maybeSingle()
          
          if (!additionalCategoryError && additionalCategoryData) {
            // Encontramos na tabela additional_categories, vamos buscar ou criar na tabela categories
            const categoryName = additionalCategoryData.name as string
            console.log("Categoria encontrada em additional_categories com nome:", categoryName)
            
            // Verificar se já existe uma categoria com este nome
            const { data: existingCategory, error: existingCategoryError } = await supabase
              .from("categories")
              .select("id")
              .eq("name", categoryName)
              .maybeSingle()
            
            if (!existingCategoryError && existingCategory) {
              // Já existe uma categoria com este nome
              validCategoryId = typeof existingCategory.id === 'number' ? existingCategory.id : Number(existingCategory.id)
              console.log("Usando categoria existente com ID:", validCategoryId)
            } else {
              // Precisamos criar uma nova categoria
              console.log("Criando nova categoria com nome:", categoryName)
              
              // Obter o próximo ID disponível para categoria
              const { data: maxIdData } = await supabase
                .from("categories")
                .select("id")
                .order("id", { ascending: false })
                .limit(1)
                .single()
              
              const nextId = maxIdData ? Number(maxIdData.id) + 1 : 1
              console.log("Próximo ID disponível para categoria:", nextId)
              
              const { data: newCategory, error: newCategoryError } = await supabase
                .from("categories")
                .insert({
                  id: nextId,
                  name: categoryName,
                  order: 999,
                  active: true,
                  store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000"
                })
                .select()
              
              if (!newCategoryError && newCategory && newCategory.length > 0) {
                validCategoryId = typeof newCategory[0].id === 'number' ? newCategory[0].id : Number(newCategory[0].id)
                console.log("Nova categoria criada com ID:", validCategoryId)
              } else {
                console.error("Erro ao criar nova categoria:", newCategoryError)
                // Tentar usar uma categoria padrão
                const { data: defaultCategory } = await supabase
                  .from("categories")
                  .select("id")
                  .limit(1)
                  .single()
                
                if (defaultCategory) {
                  validCategoryId = typeof defaultCategory.id === 'number' ? defaultCategory.id : Number(defaultCategory.id)
                  console.log("Usando categoria padrão com ID:", validCategoryId)
                }
              }
            }
          }
        }
      }
      
      // Se não conseguimos uma categoria válida, vamos usar a primeira categoria disponível
      if (validCategoryId === null) {
        console.log("Nenhuma categoria válida encontrada, buscando a primeira categoria disponível")
        const { data: firstCategory } = await supabase
          .from("categories")
          .select("id")
          .limit(1)
          .single()
        
        if (firstCategory) {
          validCategoryId = typeof firstCategory.id === 'number' ? firstCategory.id : Number(firstCategory.id)
          console.log("Usando primeira categoria disponível com ID:", validCategoryId)
        } else {
          // Criar uma categoria padrão
          console.log("Nenhuma categoria encontrada, criando categoria padrão")
          const { data: defaultCategory, error: defaultCategoryError } = await supabase
            .from("categories")
            .insert({
              name: "Categoria Padrão",
              order: 1,
              active: true,
              store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000"
            })
            .select()
          
          if (!defaultCategoryError && defaultCategory && defaultCategory.length > 0) {
            validCategoryId = typeof defaultCategory[0].id === 'number' ? defaultCategory[0].id : Number(defaultCategory[0].id)
            console.log("Categoria padrão criada com ID:", validCategoryId)
          } else {
            console.error("Erro ao criar categoria padrão:", defaultCategoryError)
            return { data: null, error: new Error("Não foi possível criar uma categoria válida") }
          }
        }
      }
      
      // Atualizar o ID da categoria no objeto additional
      additional.categoryId = validCategoryId
      
      // Criar objeto de dados para inserção/atualização
      const additionalData: any = {
        name: additional.name,
        price: additional.price,
        category_id: additional.categoryId,
        active: additional.active,
        store_id: DEFAULT_STORE_ID || "00000000-0000-0000-0000-000000000000" // Garantir que store_id nunca seja nulo
      }
      
      // Adicionar imagem apenas se estiver definida
      if (additional.image) {
        additionalData.image = additional.image
      }
      
      let result;
      
      // Se o ID existir, for maior que zero e for um ID existente na base
      // (não um ID temporário criado pelo frontend)
      if (additional.id && additional.id > 0) {
        // Verificar se o adicional com este ID existe
        const { data: existingData, error: checkError } = await supabase
          .from("additionals")
          .select("id")
          .eq("id", additional.id)
          .eq("store_id", DEFAULT_STORE_ID)
          .maybeSingle()

        if (existingData) {
          console.log("Atualizando adicional existente ID:", additional.id)
          
          const { data, error } = await supabase
            .from("additionals")
            .update(additionalData)
            .eq("id", additional.id)
            .eq("store_id", DEFAULT_STORE_ID)
            .select()
          
          if (error) {
            console.error("Erro ao atualizar adicional:", error)
            throw error
          }
          
          result = data?.[0] || null
        } else {
          // Se o ID não existir no banco, inserir como novo (ignorando o ID fornecido)
          console.log("ID não encontrado no banco, inserindo como novo adicional")
          // Remover o ID do objeto para permitir que o banco gere um novo ID
          delete additionalData.id
          
          const { data, error } = await supabase
            .from("additionals")
            .insert(additionalData)
            .select()
          
          if (error) {
            console.error("Erro ao inserir adicional:", error)
            throw error
          }
          
          result = data?.[0] || null
        }
      } else {
        // Caso não tenha ID, inserir um novo registro
        console.log("Inserindo novo adicional", additionalData)
        
        const { data, error } = await supabase
          .from("additionals")
          .insert(additionalData)
          .select()
        
        if (error) {
          console.error("Erro ao inserir adicional:", error)
          throw error
        }
        
        result = data?.[0] || null
      }
      
      // Se não houver resultado, retornar erro
      if (!result) {
        console.log("Nenhum resultado retornado após salvar adicional")
        return { data: null, error: new Error("Nenhum resultado retornado após salvar adicional") }
      }
      
      // Converter o resultado para o formato Additional
      const savedAdditional: Additional = {
        id: typeof result.id === 'number' ? result.id : Number(result.id),
        name: typeof result.name === 'string' ? result.name : String(result.name),
        price: typeof result.price === 'number' ? result.price : Number(result.price),
        categoryId: typeof result.category_id === 'number' ? result.category_id : Number(result.category_id || 0),
        active: typeof result.active === 'boolean' ? result.active : Boolean(result.active),
        image: typeof result.image === 'string' ? result.image : result.image ? String(result.image) : undefined
      }
      
      console.log("Adicional salvo com sucesso:", savedAdditional)
      return { data: savedAdditional, error: null }
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
export const getActiveAdditionalsByProductGroupedByCategory = AdditionalService.getActiveAdditionalsByProductGroupedByCategory.bind(AdditionalService)
export const getAdditionalById = AdditionalService.getAdditionalById.bind(AdditionalService)
export const saveAdditional = AdditionalService.saveAdditional.bind(AdditionalService)
export const deleteAdditional = AdditionalService.deleteAdditional.bind(AdditionalService)

// Exportar o tipo Additional
export type { Additional } from "../types"
