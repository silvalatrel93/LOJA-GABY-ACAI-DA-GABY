import { createSupabaseClient } from "../supabase-client"
import { createClient } from "@supabase/supabase-js"
import type { Category } from "../types"
import { DEFAULT_STORE_ID } from "../constants"

// Função para criar cliente administrativo do Supabase
function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Exportar o tipo Category para uso em outros arquivos
export type { Category }

// Serviço para gerenciar categorias
export const CategoryService = {
  // Obter todas as categorias
  async getAllCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      let query = supabase.from("categories").select("*").eq("store_id", DEFAULT_STORE_ID).eq("type", "product").order("order")

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar categorias:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      return []
    }
  },

  // Obter categorias ativas
  async getActiveCategories(): Promise<Category[]> {
    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", DEFAULT_STORE_ID)
        .eq("type", "product")
        .eq("active", true)
        .order("order")

      if (error) {
        console.error("Erro ao buscar categorias ativas:", error)
        return []
      }

      return (data || []).map((category: any) => ({
        id: Number(category.id),
        name: String(category.name),
        order: Number(category.order),
        active: Boolean(category.active),
      }))
    } catch (error) {
      console.error("Erro ao buscar categorias ativas:", error)
      return []
    }
  },

  // Obter categoria por ID
  async getCategoryById(id: number): Promise<Category | null> {
    try {
      console.log('Buscando categoria por ID:', { id });
      const supabase = createSupabaseClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("Erro ao buscar categoria:", error)
        return null
      }

      if (!data) {
        console.log(`Categoria com ID ${id} não encontrada`);
        return null;
      }

      console.log('Categoria encontrada:', {
        id: data.id,
        name: data.name,
        store_id: data.store_id
      });

      // Garantir que os tipos estejam corretos
      const category: Category = {
        id: Number(data.id),
        name: String(data.name),
        order: data.order ? Number(data.order) : 0,
        active: data.active !== undefined ? Boolean(data.active) : true,
      };

      return category;
    } catch (error) {
      console.error("Erro ao buscar categoria:", error)
      return null
    }
  },

  // Salvar categoria
  async saveCategory(category: Category): Promise<{ data: Category | null; error: Error | null }> {
    try {
      console.log('=== Iniciando saveCategory ===');
      console.log('Dados da categoria recebidos:', {
        categoryId: category.id,
        storeId: DEFAULT_STORE_ID,
        categoryName: category.name,
        isNew: !(category.id && category.id > 0),
        category: JSON.stringify(category, null, 2)
      });

      const supabase = createSupabaseClient();

      // Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Sessão atual:', {
        hasSession: !!sessionData?.session,
        user: sessionData?.session?.user,
        sessionError: sessionError?.message
      });

      // Verificar se o cliente Supabase foi inicializado corretamente
      if (!supabase) {
        console.error('Erro: Cliente Supabase não inicializado');
        return { data: null, error: new Error('Erro de conexão com o banco de dados') };
      }

      if (category.id && category.id > 0) {
        // Primeiro, verificar se a categoria existe
        const { data: existingCategory, error: fetchExistingError } = await supabase
          .from("categories")
          .select("id, store_id")
          .eq("id", category.id)
          .maybeSingle();

        if (fetchExistingError) {
          console.error("Erro ao verificar categoria existente:", fetchExistingError);
          return {
            data: null,
            error: new Error(`Erro ao verificar categoria: ${fetchExistingError.message}`)
          };
        }

        if (!existingCategory) {
          console.log(`Categoria com ID ${category.id} não encontrada. Criando nova categoria.`);
          // Se a categoria não existe, trata como uma nova categoria
          // Resetar o ID e seguir o fluxo de criação
          category.id = 0;
          // Continue to the creation flow below
        } else {
          // Verificar se a categoria pertence à loja correta
          if (existingCategory.store_id !== DEFAULT_STORE_ID) {
            console.error(`Categoria com ID ${category.id} pertence a outra loja.`);
            return {
              data: null,
              error: new Error(`Esta categoria pertence a outra loja e não pode ser modificada.`)
            };
          }

          // Atualizar categoria existente
          const updateData = {
            name: category.name.trim(),
            order: category.order || 0,
            active: category.active !== undefined ? Boolean(category.active) : true,
            updated_at: new Date().toISOString()
          };

          console.log('Atualizando categoria existente:', { id: category.id, ...updateData });

          // Fazer o update usando cliente administrativo
          const adminSupabase = createAdminSupabaseClient()
          const { data: updatedData, error: updateError } = await adminSupabase
            .from("categories")
            .update(updateData)
            .eq("id", category.id)
            .select()
            .maybeSingle();

          if (updateError) {
            console.error("Erro ao atualizar categoria:", updateError);
            return {
              data: null,
              error: new Error(`Erro ao atualizar categoria: ${updateError.message}`)
            };
          }

          if (!updatedData) {
            console.error("Nenhum dado retornado ao atualizar categoria");
            return {
              data: null,
              error: new Error("Falha ao atualizar categoria. Nenhum dado retornado.")
            };
          }

          const result: Category = {
            id: Number(updatedData.id),
            name: String(updatedData.name || ''),
            order: Number(updatedData.order || 0),
            active: updatedData.active !== undefined ? Boolean(updatedData.active) : true,
          }

          return { data: result, error: null }
        }
      }

      // Criar nova categoria (quando ID é 0 ou não existe)
      if (!category.id || category.id <= 0) {
        // Validar dados antes de criar nova categoria
        if (!category.name || !category.name.trim()) {
          console.error("Erro: Nome da categoria é obrigatório");
          return { data: null, error: new Error("O nome da categoria é obrigatório") };
        }

        // Garantir que a ordem seja um número válido
        const order = typeof category.order === 'number' ? category.order : 0;
        const active = category.active !== undefined ? Boolean(category.active) : true;

        console.log('Criando nova categoria:', {
          name: category.name,
          order,
          active,
          storeId: DEFAULT_STORE_ID
        });

        try {
          // Corrigir a sequência antes de inserir
          console.log('Corrigindo sequência categories_id_seq...');
          const { error: sequenceError } = await supabase.rpc('fix_categories_sequence');
          if (sequenceError) {
            console.warn('Aviso: Não foi possível corrigir a sequência automaticamente:', sequenceError);
          } else {
            console.log('Sequência corrigida com sucesso');
          }
          // Preparar os dados para inserção (sem incluir ID para deixar o banco gerar automaticamente)
          const insertData = {
            name: category.name.trim(),
            order: order,
            active: active,
            store_id: DEFAULT_STORE_ID,
            type: 'product',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Garantir que não há ID nos dados de inserção
          if ('id' in insertData) {
            delete (insertData as any).id;
          }

          console.log('Inserindo nova categoria:', insertData);

          // Verificar se há ID nos dados (não deveria haver)
          console.log('Verificação de ID nos dados:', {
            hasId: 'id' in insertData,
            insertDataKeys: Object.keys(insertData),
            originalCategoryId: category.id
          });

          // Inserir a nova categoria
          console.log('Enviando dados para o Supabase:', {
            table: 'categories',
            data: insertData,
            store_id: insertData.store_id,
            store_id_type: typeof insertData.store_id,
            store_id_length: insertData.store_id?.length
          });

          const adminSupabase = createAdminSupabaseClient()
          const { data, error } = await adminSupabase
            .from("categories")
            .insert(insertData)
            .select()
            .maybeSingle();

          if (error) {
            console.error("Erro ao inserir categoria:", {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              details_full: error.details
            });
            throw new Error(`Erro ao inserir categoria: ${error.message || 'Erro desconhecido'}`);
          }

          if (!data) {
            console.error("Nenhum dado retornado ao criar categoria");
            throw new Error("Nenhum dado retornado ao criar categoria");
          }

          console.log('Dados da nova categoria:', data);

          // Criar o objeto de resultado
          const result: Category = {
            id: Number(data.id),
            name: String(data.name || ''),
            order: Number(data.order || 0),
            active: data.active !== undefined ? Boolean(data.active) : true,
          };

          console.log('Categoria criada com sucesso:', result);
          return { data: result, error: null };

        } catch (error) {
          console.error("Erro ao processar criação de categoria:", error);
          return {
            data: null,
            error: error instanceof Error ? error : new Error("Erro desconhecido ao criar categoria")
          };
        }
      }
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }

    // Fallback return statement (should not reach here)
    return { data: null, error: new Error("Unexpected error: function reached end without returning") };
  },

  // Excluir categoria
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const supabase = createSupabaseClient()

      // Verificar se há produtos usando esta categoria
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .eq("category_id", id)

      if (productsError) {
        console.error(`Erro ao verificar produtos da categoria ${id}:`, productsError)
        throw new Error(`Erro ao verificar dependências de produtos: ${productsError.message}`)
      }

      // Verificar se há adicionais usando esta categoria
      const { data: additionals, error: additionalsError } = await supabase
        .from("additionals")
        .select("id, name")
        .eq("category_id", id)

      if (additionalsError) {
        console.error(`Erro ao verificar adicionais da categoria ${id}:`, additionalsError)
        throw new Error(`Erro ao verificar dependências de adicionais: ${additionalsError.message}`)
      }

      // Construir mensagem de erro se houver dependências
      const dependencies = []
      
      if (products && products.length > 0) {
        const productNames = products.map(p => p.name).join(", ")
        dependencies.push(`${products.length} produto(s): ${productNames}`)
      }

      if (additionals && additionals.length > 0) {
        const additionalNames = additionals.map(a => a.name).join(", ")
        dependencies.push(`${additionals.length} adicional(ais): ${additionalNames}`)
      }

      if (dependencies.length > 0) {
        const errorMessage = `Não é possível excluir a categoria. Existem dependências: ${dependencies.join(" e ")}. Remova ou mova estes itens para outra categoria primeiro.`
        console.error(errorMessage)
        throw new Error(errorMessage)
      }

      // Se não há dependências, prosseguir com a exclusão usando cliente administrativo
      const adminSupabase = createAdminSupabaseClient()
      const { error } = await adminSupabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (error) {
        console.error(`Erro ao deletar categoria ${id}:`, error)
        throw new Error(`Erro ao excluir categoria: ${error.message}`)
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Erro desconhecido ao deletar categoria ${id}`
      console.error(`Erro ao deletar categoria ${id}:`, errorMessage)
      throw new Error(errorMessage)
    }
  },
}

// Exportar funções individuais para facilitar o uso
export const getAllCategories = CategoryService.getAllCategories.bind(CategoryService)
export const getActiveCategories = CategoryService.getActiveCategories.bind(CategoryService)
export const getCategoryById = CategoryService.getCategoryById.bind(CategoryService)
export const saveCategory = CategoryService.saveCategory.bind(CategoryService)
export const deleteCategory = CategoryService.deleteCategory.bind(CategoryService)
